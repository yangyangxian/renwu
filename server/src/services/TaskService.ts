import { db } from '../database/databaseAccess';
import { tasks, projects, users, taskView, taskLabels, labels, projectMembers, taskComments } from '../database/schema';
import { eq, and, inArray, or, isNull, sql, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { CustomError } from '../classes/CustomError';
import { ErrorCodes, TaskUpdateReqDto, TaskCreateReqDto } from '@fullstack/common';
import logger from '../utils/logger';
import { mapDbToEntity } from '../utils/mappers';
import { LabelEntity } from './LabelService';
import { resolveTaskPreviewImageUrl } from './taskTimelinePreview';
import { UserEntity } from './UserService';

export class TaskEntity {
  id: string = '';
  taskNumber: number | null = null;
  taskCode: string = '';
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
  previewImageUrl?: string = undefined;
}

export class TaskViewEntity {
  id: string = '';
  userId: string = '';
  name: string = '';
  projectId: string | null = null;
  viewConfig: any = null;
}

export class TaskCommentEntity {
  id: string = '';
  taskId: string = '';
  content: string = '';
  createdBy?: UserEntity;
  createdAt: string = '';
  updatedAt: string = '';
}

type DbTask = typeof tasks.$inferInsert;

type NumberedProject = {
  slug: string;
  taskNumber: number;
};

class TaskService {
  private buildTaskCode(
    projectSlug: string | null | undefined,
    taskNumber: number | null | undefined,
    projectId: string | null | undefined,
  ): string {
    if (taskNumber == null) {
      return '';
    }

    return projectId ? `${projectSlug}-${taskNumber}` : `P-${taskNumber}`;
  }

  private mapTaskEntity(source: Record<string, unknown>): TaskEntity {
    const entity = mapDbToEntity(source, new TaskEntity(), {
      taskNumber: { default: null },
      taskCode: { default: '' },
      previewImageUrl: { default: undefined },
    });

    const taskSource = source as { projectSlug?: string | null; projectId?: string | null };
    entity.taskCode = this.buildTaskCode(taskSource.projectSlug, entity.taskNumber, taskSource.projectId);
    return entity;
  }

  private async getPreviewImageUrlsByTaskIds(taskRows: Array<{ id: string; description?: string | null }>): Promise<Map<string, string>> {
    const previewImageUrls = new Map<string, string>();
    const commentFallbackTaskIds: string[] = [];

    for (const taskRow of taskRows) {
      const previewFromDescription = resolveTaskPreviewImageUrl({
        description: taskRow.description,
      });

      if (previewFromDescription) {
        previewImageUrls.set(taskRow.id, previewFromDescription);
        continue;
      }

      commentFallbackTaskIds.push(taskRow.id);
    }

    if (commentFallbackTaskIds.length === 0) {
      return previewImageUrls;
    }

    const commentRows = await db
      .select({
        taskId: taskComments.taskId,
        content: taskComments.content,
      })
      .from(taskComments)
      .where(inArray(taskComments.taskId, commentFallbackTaskIds))
      .orderBy(taskComments.createdAt);

    const commentsByTaskId = new Map<string, string[]>();
    for (const row of commentRows) {
      const comments = commentsByTaskId.get(row.taskId) ?? [];
      comments.push(row.content || '');
      commentsByTaskId.set(row.taskId, comments);
    }

    for (const taskId of commentFallbackTaskIds) {
      const previewFromComments = resolveTaskPreviewImageUrl({
        comments: commentsByTaskId.get(taskId) ?? [],
      });

      if (previewFromComments) {
        previewImageUrls.set(taskId, previewFromComments);
      }
    }

    return previewImageUrls;
  }

  private async allocateProjectTaskNumber(projectId: string, transactionDb: any): Promise<NumberedProject> {
    const [project] = await transactionDb
      .update(projects)
      .set({
        lastTaskNumber: sql`${projects.lastTaskNumber} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning({
        slug: projects.slug,
        taskNumber: projects.lastTaskNumber,
      });

    if (!project) {
      throw new CustomError('Project not found', ErrorCodes.NOT_FOUND);
    }

    return project;
  }

  private async allocatePersonalTaskNumber(userId: string, transactionDb: any): Promise<number> {
    const [user] = await transactionDb
      .update(users)
      .set({
        lastPersonalTaskNumber: sql`${users.lastPersonalTaskNumber} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ taskNumber: users.lastPersonalTaskNumber });

    if (!user) {
      throw new CustomError('User not found', ErrorCodes.NOT_FOUND);
    }

    return user.taskNumber;
  }

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

  private mapTaskCommentEntity(source: Record<string, unknown>): TaskCommentEntity {
    return mapDbToEntity(source, new TaskCommentEntity(), {
      content: { default: '' },
    });
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

    if (insertValues.projectId && data.createdBy) {
      await this.assertProjectMember(insertValues.projectId, data.createdBy);
    }

    const created = await db.transaction(async (tx) => {
      const nextInsertValues = { ...insertValues };

      if (nextInsertValues.projectId) {
        const numberedProject = await this.allocateProjectTaskNumber(nextInsertValues.projectId, tx);
        nextInsertValues.taskNumber = numberedProject.taskNumber;
      } else {
        nextInsertValues.taskNumber = await this.allocatePersonalTaskNumber(data.createdBy, tx);
      }

      const [insertedTask] = await tx
        .insert(tasks)
        .values(nextInsertValues)
        .returning();

      return insertedTask;
    });

    if (!created) {
      throw new CustomError('Failed to create task', ErrorCodes.INTERNAL_ERROR);
    }

    return this.mapTaskEntity(created);
  }

  async getPersonalTasksByUserId(userId: string): Promise<TaskEntity[]> {
    const assignedUser = alias(users, 'assigned_user');
    const creatorUser = alias(users, 'creator_user');

    const result = await db
      .select({
        id: tasks.id,
        taskNumber: tasks.taskNumber,
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
        projectSlug: projects.slug,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(assignedUser, eq(tasks.assignedTo, assignedUser.id))
      .leftJoin(creatorUser, eq(tasks.createdBy, creatorUser.id))
      .where(and(eq(tasks.createdBy, userId), isNull(tasks.projectId)));

    if (result.length === 0) {
      return [];
    }

    const [labelsByTaskId, previewImageUrlsByTaskId] = await Promise.all([
      this.getLabelsByTaskIds(result.map(task => task.id)),
      this.getPreviewImageUrlsByTaskIds(result.map(task => ({ id: task.id, description: task.description }))),
    ]);

    const entities: TaskEntity[] = [];
    for (const task of result) {
      const entity = this.mapTaskEntity(task);
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
      entity.previewImageUrl = previewImageUrlsByTaskId.get(task.id);
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
        taskNumber: tasks.taskNumber,
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
        projectSlug: projects.slug,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(assignedUser, eq(tasks.assignedTo, assignedUser.id))
      .leftJoin(creatorUser, eq(tasks.createdBy, creatorUser.id))
      .where(eq(tasks.projectId, projectId));

    if (result.length === 0) {
      return [];
    }

    const [labelsByTaskId, previewImageUrlsByTaskId] = await Promise.all([
      this.getLabelsByTaskIds(result.map(task => task.id)),
      this.getPreviewImageUrlsByTaskIds(result.map(task => ({ id: task.id, description: task.description }))),
    ]);
    
    const entities: TaskEntity[] = [];
    for (const task of result) {
      const entity = this.mapTaskEntity(task);
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
      entity.previewImageUrl = previewImageUrlsByTaskId.get(task.id);
      entities.push(entity);
    }
    return entities;
  }

  /**
   * Update a task by ID, with validation and permission checks.
   * @param taskId string
   * @param updateData TaskUpdateReqDto
   */
  async updateTask(taskId: string, updateData: TaskUpdateReqDto, actorUserId: string): Promise<TaskEntity> {
    const existingTask = await this.getTaskById(taskId);
    if (!existingTask) {
      throw new CustomError('Task not found', ErrorCodes.NOT_FOUND);
    }

    // Reuse toTaskEntityForDb for normalization, do not include createdBy
    const updateValues = this.toTaskEntityForUpdate(updateData);
    logger.debug("updateValues update:", updateValues);
    const currentProjectId = existingTask.projectId || null;
    const nextProjectId = updateData.projectId === undefined
      ? currentProjectId
      : (updateData.projectId || null);
    const projectChanged = nextProjectId !== currentProjectId;

    if (projectChanged) {
      if (nextProjectId) {
        await this.assertProjectMember(nextProjectId, actorUserId);
      }

      await db.transaction(async (tx) => {
        let nextTaskNumber: number | null = null;

        if (nextProjectId) {
          const numberedProject = await this.allocateProjectTaskNumber(nextProjectId, tx);
          nextTaskNumber = numberedProject.taskNumber;
        } else {
          nextTaskNumber = await this.allocatePersonalTaskNumber(existingTask.createdBy?.id ?? actorUserId, tx);
        }

        await tx.update(tasks)
          .set({
            ...updateValues,
            projectId: nextProjectId,
            taskNumber: nextTaskNumber,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, taskId));
      });

      const updatedTask = await this.getTaskById(taskId);
      if (!updatedTask) {
        throw new CustomError('Task not found after update', ErrorCodes.NOT_FOUND);
      }
      return updatedTask;
    }

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
        taskNumber: tasks.taskNumber,
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
        projectSlug: projects.slug,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(assignedUser, eq(tasks.assignedTo, assignedUser.id))
      .leftJoin(creatorUser, eq(tasks.createdBy, creatorUser.id))
      .where(eq(tasks.id, taskId));

    if (!taskWithDetails) {
      return null;
    }

    const entity = this.mapTaskEntity(taskWithDetails);
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

    const commentRows = await db
      .select({ content: taskComments.content })
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt));

    entity.previewImageUrl = resolveTaskPreviewImageUrl({
      description: entity.description,
      comments: commentRows.map((row) => row.content || ''),
    }) ?? undefined;
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

  async getCommentsByTaskId(taskId: string): Promise<TaskCommentEntity[]> {
    const creatorUser = alias(users, 'comment_creator_user');

    const rows = await db
      .select({
        id: taskComments.id,
        taskId: taskComments.taskId,
        content: taskComments.content,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
        createdById: taskComments.createdBy,
        createdByName: creatorUser.name,
        createdByEmail: creatorUser.email,
      })
      .from(taskComments)
      .innerJoin(creatorUser, eq(taskComments.createdBy, creatorUser.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt));

    return rows.map((row) => {
      const entity = this.mapTaskCommentEntity(row);
      entity.createdBy = new UserEntity({
        id: row.createdById,
        name: row.createdByName || '',
        email: row.createdByEmail || '',
      });
      return entity;
    });
  }

  async createComment(taskId: string, content: string, actorUserId: string): Promise<TaskCommentEntity> {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new CustomError('Comment content is required', ErrorCodes.INVALID_INPUT);
    }

    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new CustomError('Task not found', ErrorCodes.NOT_FOUND);
    }

    const [createdComment] = await db
      .insert(taskComments)
      .values({
        taskId,
        content: trimmedContent,
        createdBy: actorUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: taskComments.id });

    if (!createdComment) {
      throw new CustomError('Failed to create comment', ErrorCodes.INTERNAL_ERROR);
    }

    const comments = await this.getCommentsByTaskId(taskId);
    const created = comments.find((comment) => comment.id === createdComment.id);

    if (!created) {
      throw new CustomError('Failed to fetch created comment', ErrorCodes.INTERNAL_ERROR);
    }

    return created;
  }

  async updateComment(commentId: string, content: string, actorUserId: string): Promise<TaskCommentEntity> {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new CustomError('Comment content is required', ErrorCodes.INVALID_INPUT);
    }

    const [existingComment] = await db
      .select({ id: taskComments.id, taskId: taskComments.taskId, createdBy: taskComments.createdBy })
      .from(taskComments)
      .where(eq(taskComments.id, commentId));

    if (!existingComment) {
      throw new CustomError('Comment not found', ErrorCodes.NOT_FOUND);
    }

    if (existingComment.createdBy !== actorUserId) {
      throw new CustomError('You can only edit your own comments', ErrorCodes.UNAUTHORIZED);
    }

    await db
      .update(taskComments)
      .set({ content: trimmedContent, updatedAt: new Date() })
      .where(eq(taskComments.id, commentId));

    const comments = await this.getCommentsByTaskId(existingComment.taskId);
    const updated = comments.find((comment) => comment.id === commentId);

    if (!updated) {
      throw new CustomError('Failed to fetch updated comment', ErrorCodes.INTERNAL_ERROR);
    }

    return updated;
  }

  async deleteComment(commentId: string, actorUserId: string): Promise<void> {
    const [existingComment] = await db
      .select({ id: taskComments.id, createdBy: taskComments.createdBy })
      .from(taskComments)
      .where(eq(taskComments.id, commentId));

    if (!existingComment) {
      throw new CustomError('Comment not found', ErrorCodes.NOT_FOUND);
    }

    if (existingComment.createdBy !== actorUserId) {
      throw new CustomError('You can only delete your own comments', ErrorCodes.UNAUTHORIZED);
    }

    await db.delete(taskComments).where(eq(taskComments.id, commentId));
  }
}

export const taskService = new TaskService();
