import { db } from '../database/databaseAccess';
import { tasks, projects, users, taskView, taskLabels, labels, projectMembers } from '../database/schema';
import { eq, and, inArray, or, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { CustomError } from '../classes/CustomError';
import { ErrorCodes, TaskUpdateReqDto, TaskCreateReqDto } from '@fullstack/common';
import logger from '../utils/logger';
import { mapDbToEntity } from '../utils/mappers';
import { LabelEntity } from './LabelService';
import { UserEntity } from './UserService';

export class TaskEntity {
  id: string = '';
  assignedTo?: UserEntity;
  createdBy?: UserEntity;
  title: string = '';
  description: string = '';
  status: string = '';
  labels?: LabelEntity[] = [];
  projectId?: string = '';
  projectName?: string = '';
  dueDate?: string = '';
  createdAt: string = '';
  updatedAt: string = '';
}

export class TaskViewEntity {
  id: string = '';
  userId: string = '';
  name: string = '';
  projectId: string | null = null;
  viewConfig: any = null;
}

type DbTask = typeof tasks.$inferInsert;

class TaskService {
  private async assertProjectMember(projectId: string, userId: string): Promise<void> {
    const membership = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));

    if (membership.length === 0) {
      throw new CustomError('Project not found or not accessible', ErrorCodes.UNAUTHORIZED);
    }
  }

  private async getLabelsByTaskIds(taskIds: string[]): Promise<Map<string, LabelEntity[]>> {
    const labelsByTaskId = new Map<string, LabelEntity[]>();

    if (taskIds.length === 0) {
      return labelsByTaskId;
    }

    const rows = await db
      .select({
        taskId: taskLabels.taskId,
        id: labels.id,
        labelName: labels.labelName,
        labelColor: labels.labelColor,
      })
      .from(taskLabels)
      .innerJoin(labels, eq(taskLabels.labelId, labels.id))
      .where(inArray(taskLabels.taskId, taskIds))
      .orderBy(taskLabels.createdAt);

    for (const row of rows) {
      const existing = labelsByTaskId.get(row.taskId) || [];
      existing.push(new LabelEntity({
        id: row.id,
        labelName: row.labelName,
        labelColor: row.labelColor ?? undefined,
      }));
      labelsByTaskId.set(row.taskId, existing);
    }

    return labelsByTaskId;
  }
  
  /**
   * Delete a task by ID
   * @param taskId string
   */
  async deleteTask(taskId: string): Promise<void> {
    const deleted = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();
    if (!deleted || deleted.length === 0) {
      throw new CustomError('Task not found or already deleted', ErrorCodes.NOT_FOUND);
    }
  }

  /**
   * Convert TaskCreateReqDto to a DB-ready object for insertion
   * Custom types automatically handle all empty string to null conversions
   */
  /**
   * Convert TaskCreateReqDto or TaskUpdateReqDto to a DB-ready object for insert/update
   * @param data TaskCreateReqDto or TaskUpdateReqDto
   * @param isUpdate If true, do not include createdBy (for update)
   */
  private toTaskEntityForCreate(data: Partial<TaskCreateReqDto>): DbTask {
    const emptyToNull = (v: any) => v === '' || v === undefined ? null : v;
    let result: DbTask = {} as DbTask;
    if (data.title !== undefined) result.title = data.title;
    if (data.description !== undefined) result.description = emptyToNull(data.description);
    if (data.status !== undefined) result.status = data.status;
    if (data.assignedTo !== undefined) result.assignedTo = data.assignedTo;
    if (data.projectId !== undefined) result.projectId = emptyToNull(data.projectId);
    if (data.dueDate !== undefined) {
      result.dueDate = emptyToNull(data.dueDate)
        ? new Date(data.dueDate as string).toISOString()
        : null;
    }
    if (data.createdBy !== undefined) {
      result.createdBy = data.createdBy;
    }
    return result;
  }

  private toTaskEntityForUpdate(data: Partial<TaskUpdateReqDto>): Partial<DbTask> {
    const emptyToNull = (v: any) => v === '' || v === undefined ? null : v;
    const result: Partial<DbTask> = {};
    if (data.title !== undefined) result.title = data.title;
    if (data.description !== undefined) result.description = emptyToNull(data.description);
    if (data.status !== undefined) result.status = data.status;
    if (data.assignedTo !== undefined) result.assignedTo = data.assignedTo;
    if (data.projectId !== undefined) result.projectId = emptyToNull(data.projectId);
    if (data.dueDate !== undefined) {
      result.dueDate = emptyToNull(data.dueDate)
        ? new Date(data.dueDate as string).toISOString()
        : null;
    }
    return result;
  }

  /**
   * Get all task views for a user
   */
  async getTaskViewsByUser(userId: string): Promise<TaskViewEntity[]> {
    logger.debug('Fetching task views for user:', userId);
    const rows = await db
      .select({
        id: taskView.id,
        userId: taskView.userId,
        name: taskView.name,
        projectId: taskView.projectId,
        viewConfig: taskView.viewConfig,
        createdAt: taskView.createdAt,
        updatedAt: taskView.updatedAt,
      })
      .from(taskView)
      .leftJoin(projectMembers, eq(taskView.projectId, projectMembers.projectId))
      .where(or(
        and(eq(taskView.userId, userId), isNull(taskView.projectId)),
        eq(projectMembers.userId, userId)
      ));
    return rows.map(row => {
      const entity = Object.assign(new TaskViewEntity(), row);
      return entity;
    });
  }

  /**
   * Create a new task view for a user
   */
  async createTaskView(userId: string, name: string, viewConfig: any, projectId: string | null = null) {
    if (projectId) {
      await this.assertProjectMember(projectId, userId);
    }

    const [created] = await db.insert(taskView).values({ userId, name, projectId, viewConfig }).returning();
    if (!created) throw new CustomError('Failed to create task view', ErrorCodes.INTERNAL_ERROR);
    return created;
  }

  /**
   * Update a task view (must belong to user)
   */
  async updateTaskView(userId: string, viewId: string, update: { name?: string; viewConfig?: any; projectId?: string | null }) {
    if (update.projectId) {
      await this.assertProjectMember(update.projectId, userId);
    }

    const [updated] = await db
      .update(taskView)
      .set({ ...update, updatedAt: new Date() })
      .where(and(eq(taskView.id, viewId), eq(taskView.userId, userId)))
      .returning();
    if (!updated) throw new CustomError('Task view not found or not owned by user', ErrorCodes.NOT_FOUND);
    return updated;
  }

  /**
   * Delete a task view (must belong to user)
   */
  async deleteTaskView(userId: string, viewId: string) {
    const [deleted] = await db
      .delete(taskView)
      .where(and(eq(taskView.id, viewId), eq(taskView.userId, userId)))
      .returning();
    if (!deleted) throw new CustomError('Task view not found or not owned by user', ErrorCodes.NOT_FOUND);
    return deleted;
  }
    
  /**
   * Create a new task
   * @param data TaskCreateReqDto
   */
  async createTask(data: TaskCreateReqDto): Promise<TaskEntity> {
    // Convert DTO to DB-ready entity - custom types handle empty string conversion
    const insertValues = this.toTaskEntityForCreate(data);
    logger.debug('insertValues insert:', insertValues);

    const [created] = await db
      .insert(tasks)
      .values(insertValues)
      .returning();
    if (!created) {
      throw new CustomError('Failed to create task', ErrorCodes.INTERNAL_ERROR);
    }

    return mapDbToEntity(created, new TaskEntity());
  }

  async getTasksByUserId(userId: string): Promise<TaskEntity[]> {
    const assignedUser = alias(users, 'assigned_user');
    const creatorUser = alias(users, 'creator_user');
    
    const result = await db
      .select({
        id: tasks.id,
        assignedToId: tasks.assignedTo,
        assignedToName: assignedUser.name,
        assignedToEmail: assignedUser.email,
        assignedToCreatedAt: assignedUser.createdAt,
        createdById: tasks.createdBy,
        createdByName: creatorUser.name,
        createdByEmail: creatorUser.email,
        createdByCreatedAt: creatorUser.createdAt,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        projectId: tasks.projectId,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(assignedUser, eq(tasks.assignedTo, assignedUser.id))
      .leftJoin(creatorUser, eq(tasks.createdBy, creatorUser.id))
      .where(eq(tasks.assignedTo, userId));

    if (result.length === 0) {
      return [];
    }

    const labelsByTaskId = await this.getLabelsByTaskIds(result.map(task => task.id));

    const entities: TaskEntity[] = [];
    for (const task of result) {
      const entity = mapDbToEntity(task, new TaskEntity());
      if (task.assignedToId) {
        entity.assignedTo = new UserEntity({
          id: task.assignedToId,
          name: task.assignedToName || '',
          email: task.assignedToEmail || '',
          createdAt: task.assignedToCreatedAt?.toISOString() || '',
        });
      }
      if (task.createdById) {
        entity.createdBy = {
          id: task.createdById,
          name: task.createdByName || '',
          email: task.createdByEmail || '',
          createdAt: task.createdByCreatedAt?.toISOString() || '',
        };
      }
      entity.labels = labelsByTaskId.get(task.id) || [];
      entities.push(entity);
    }
    return entities;
  }

  async getTasksByProjectId(projectId: string): Promise<TaskEntity[]> {
    const assignedUser = alias(users, 'assigned_user');
    const creatorUser = alias(users, 'creator_user');
    
    const result = await db
      .select({
        id: tasks.id,
        assignedToId: tasks.assignedTo,
        assignedToName: assignedUser.name,
        assignedToEmail: assignedUser.email,
        assignedToCreatedAt: assignedUser.createdAt,
        createdById: tasks.createdBy,
        createdByName: creatorUser.name,
        createdByEmail: creatorUser.email,
        createdByCreatedAt: creatorUser.createdAt,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        projectId: tasks.projectId,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(assignedUser, eq(tasks.assignedTo, assignedUser.id))
      .leftJoin(creatorUser, eq(tasks.createdBy, creatorUser.id))
      .where(eq(tasks.projectId, projectId));

    if (result.length === 0) {
      return [];
    }

    const labelsByTaskId = await this.getLabelsByTaskIds(result.map(task => task.id));
    
    const entities: TaskEntity[] = [];
    for (const task of result) {
      const entity = mapDbToEntity(task, new TaskEntity());
      if (task.assignedToId) {
        entity.assignedTo = new UserEntity({
          id: task.assignedToId,
          name: task.assignedToName || '',
          email: task.assignedToEmail || '',
          createdAt: task.assignedToCreatedAt?.toISOString() || '',
        });
      }
      if (task.createdById) {
        entity.createdBy = {
          id: task.createdById,
          name: task.createdByName || '',
          email: task.createdByEmail || '',
          createdAt: task.createdByCreatedAt?.toISOString() || '',
        };
      }
      entity.labels = labelsByTaskId.get(task.id) || [];
      entities.push(entity);
    }
    return entities;
  }

  /**
   * Update a task by ID, with validation and permission checks.
   * @param taskId string
   * @param updateData TaskUpdateReqDto
   */
  async updateTask(taskId: string, updateData: TaskUpdateReqDto): Promise<TaskEntity> {
    // Reuse toTaskEntityForDb for normalization, do not include createdBy
    const updateValues = this.toTaskEntityForUpdate(updateData);
    logger.debug("updateValues update:", updateValues);
    // If there are no values to set (e.g. caller only sent labels which are
    // handled separately), skip the DB update to avoid errors from the ORM
    // when .set({}) is called with an empty object.
    if (Object.keys(updateValues).length > 0) {
      await db.update(tasks)
        .set({ ...updateValues, updatedAt: new Date() })
        .where(eq(tasks.id, taskId));
    } else {
      // If there are no other fields to update (for example caller only sent labels),
      // still update the `updated_at` timestamp so the task modification time reflects
      // the latest change.
      logger.debug('updateTask: no non-label fields to update, updating updatedAt only');
      await db.update(tasks).set({ updatedAt: new Date() }).where(eq(tasks.id, taskId));
    }
    // Use the common getTaskById function to fetch the updated task with details
    const updatedTask = await this.getTaskById(taskId);
    if (!updatedTask) {
      throw new CustomError('Task not found after update', ErrorCodes.NOT_FOUND);
    }
    return updatedTask;
  }

  /**
   * Get a task by ID with user and project information
   * @param taskId string
   * @returns TaskEntity
   */
  async getTaskById(taskId: string): Promise<TaskEntity | null> {
    const assignedUser = alias(users, 'assigned_user');
    const creatorUser = alias(users, 'creator_user');

    const [taskWithDetails] = await db
      .select({
        id: tasks.id,
        assignedToId: tasks.assignedTo,
        assignedToName: assignedUser.name,
        assignedToEmail: assignedUser.email,
        assignedToCreatedAt: assignedUser.createdAt,
        createdById: tasks.createdBy,
        createdByName: creatorUser.name,
        createdByEmail: creatorUser.email,
        createdByCreatedAt: creatorUser.createdAt,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        projectId: tasks.projectId,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(assignedUser, eq(tasks.assignedTo, assignedUser.id))
      .leftJoin(creatorUser, eq(tasks.createdBy, creatorUser.id))
      .where(eq(tasks.id, taskId));

    if (!taskWithDetails) {
      return null;
    }

    const entity = mapDbToEntity(taskWithDetails, new TaskEntity());
    // Set assignedTo and createdBy manually to avoid recursion
    if (taskWithDetails.assignedToId) {
      entity.assignedTo = new UserEntity({
        id: taskWithDetails.assignedToId,
        name: taskWithDetails.assignedToName || '',
        email: taskWithDetails.assignedToEmail || '',
        createdAt: taskWithDetails.assignedToCreatedAt?.toISOString() || '',
      });
    }
    if (taskWithDetails.createdById) {
      entity.createdBy = {
        id: taskWithDetails.createdById,
        name: taskWithDetails.createdByName || '',
        email: taskWithDetails.createdByEmail || '',
        createdAt: taskWithDetails.createdByCreatedAt?.toISOString() || '',
      };
    }
    // Fetch labels for the task via join to task_labels and include name
    const lblRows = await db
      .select({ id: labels.id, labelName: labels.labelName, labelColor: labels.labelColor, addedAt: taskLabels.createdAt })
      .from(labels)
      .innerJoin(taskLabels, eq(taskLabels.labelId, labels.id))
      .where(eq(taskLabels.taskId, taskId))
      .orderBy(taskLabels.createdAt);
    entity.labels = (lblRows || []).map((r: any) => new LabelEntity({ id: r.id, labelName: r.labelName, labelColor: r.labelColor }));
    return entity;
  }

  /**
   * Replace the labels for a task with the provided list. This will remove any existing
   * label associations and insert the new ones in a single transaction.
   */
  async updateTaskLabels(taskId: string, labelIds: string[], actorId: string): Promise<void> {
    // Ensure task exists
    const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!existingTask) throw new CustomError('Task not found', ErrorCodes.NOT_FOUND);

    // New algorithm: incremental add/remove
    // 1. Load existing label associations for the task
    // 2. Compute inserts = requested - existing; deletes = existing - requested
    // 3. Insert new label associations, delete removed ones
    // 4. Update tasks.updatedAt only if any DB changes occurred
    await db.transaction(async (tx) => {
      const existingRows = await tx.select({ id: taskLabels.labelId }).from(taskLabels).where(eq(taskLabels.taskId, taskId));
      const existingIds: string[] = (existingRows || []).map((r: any) => r.id);

      const requested = labelIds || [];

      // Validate requested labels exist in labels table to avoid FK errors
      const validLabelRows = await tx.select({ id: labels.id }).from(labels).where(inArray(labels.id, requested));
      const validSet = new Set((validLabelRows || []).map((r: any) => r.id));
      const validRequested = requested.filter((id) => validSet.has(id));

      // Determine which labels to insert and which to delete
      const existingSet = new Set(existingIds);
      const requestedSet = new Set(validRequested);

      const toInsert = validRequested.filter((id) => !existingSet.has(id));
      const toDelete = existingIds.filter((id) => !requestedSet.has(id));

      let changed = false;

      // Insert new associations in the requested order
      for (const lid of toInsert) {
        await tx.insert(taskLabels).values({ taskId, labelId: lid, createdBy: actorId, createdAt: new Date() }).onConflictDoNothing().execute();
        changed = true;
      }

      // Delete associations that were removed in the request
      if (toDelete.length > 0) {
        await tx.delete(taskLabels).where(and(eq(taskLabels.taskId, taskId), inArray(taskLabels.labelId, toDelete)));
        changed = true;
      }

      // If any DB changes occurred, update the task's updatedAt
      if (changed) {
        await tx.update(tasks).set({ updatedAt: new Date() }).where(eq(tasks.id, taskId));
      }
    });
  }
}

export const taskService = new TaskService();
