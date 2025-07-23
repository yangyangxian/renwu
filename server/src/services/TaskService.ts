// ...existing code...
import { normalizeNullableString } from '../utils/stringHelpers';
import { db } from '../database/databaseAccess';
import { tasks, projects, users } from '../database/schema';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { CustomError } from '../classes/CustomError';
import { ErrorCodes, TaskUpdateReqDto, TaskCreateReqDto } from '@fullstack/common';
import logger from '../utils/logger';
import { mapDbToEntity } from '../utils/mappers';
import { UserEntity } from './UserService';

export class TaskEntity {
  id: string = '';
  assignedTo?: UserEntity;
  createdBy?: UserEntity;
  title: string = '';
  description: string = '';
  status: string = '';
  projectId?: string = '';
  projectName?: string = '';
  dueDate?: string = '';
  createdAt: string = '';
  updatedAt: string = '';
}

class TaskService {
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
  private toTaskEntityForDb(data: Partial<TaskCreateReqDto>, isUpdate: boolean = false) {
    const result: Record<string, any> = {};
    if (data.title !== undefined) result.title = data.title;
    if (data.description !== undefined) result.description = data.description;
    if (data.status !== undefined) result.status = data.status;
    if (data.assignedTo !== undefined) result.assignedTo = data.assignedTo;
    if (data.projectId !== undefined) result.projectId = data.projectId;
    if (data.dueDate !== undefined) {
      result.dueDate = normalizeNullableString(data.dueDate)
        ? new Date(data.dueDate as string).toISOString()
        : null;
    }
    if (!isUpdate && data.createdBy !== undefined) {
      result.createdBy = data.createdBy;
    }
    return result;
  }
    
  /**
   * Create a new task
   * @param data TaskCreateReqDto
   */
  async createTask(data: TaskCreateReqDto): Promise<TaskEntity> {
    // Convert DTO to DB-ready entity - custom types handle empty string conversion
    const insertValues = this.toTaskEntityForDb(data, false);
    logger.debug('insertValues insert:', insertValues);

    const [created] = await db
      .insert(tasks)
      .values(insertValues)
      .returning();
    if (!created) {
      throw new CustomError('Failed to create task', ErrorCodes.INTERNAL_ERROR);
    }

    // Use the common getTaskById function to fetch the created task with details
    return await this.getTaskById(created.id);
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
    
    return result.map((task: any) => {
      const entity = mapDbToEntity(task, new TaskEntity());
      // Set assignedTo and createdBy manually to avoid recursion
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
      return entity;
    });
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
    
    return result.map((task: any) => {
      const entity = mapDbToEntity(task, new TaskEntity());
      // Set assignedTo and createdBy manually to avoid recursion
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
      return entity;
    });
  }

  async getTasksByProjectSlug(projectSlug: string): Promise<TaskEntity[]> {
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
      .where(eq(projects.slug, projectSlug));
    
    return result.map((task: any) => {
      const entity = mapDbToEntity(task, new TaskEntity());
      // Set assignedTo and createdBy manually to avoid recursion
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
      return entity;
    });
  }

  /**
   * Update a task by ID, with validation and permission checks.
   * @param taskId string
   * @param updateData TaskUpdateReqDto
   */
  async updateTask(taskId: string, updateData: TaskUpdateReqDto): Promise<TaskEntity> {
    // Reuse toTaskEntityForDb for normalization, do not include createdBy
    const updateValues = this.toTaskEntityForDb(updateData, true);
    console.debug("updateValues update:", updateValues);
    await db.update(tasks)
      .set(updateValues)
      .where(eq(tasks.id, taskId));
    // Use the common getTaskById function to fetch the updated task with details
    return await this.getTaskById(taskId);
  }

  /**
   * Get a task by ID with user and project information
   * @param taskId string
   * @returns TaskEntity
   */
  async getTaskById(taskId: string): Promise<TaskEntity> {
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
      throw new CustomError('Task not found', ErrorCodes.NOT_FOUND);
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
    return entity;
  }
}

export const taskService = new TaskService();
