import { db } from '../database/databaseAccess';
import { tasks, projects, users } from '../database/schema';
import { eq } from 'drizzle-orm';
import { CustomError } from '../classes/CustomError';
import { ErrorCodes, TaskUpdateReqDto, TaskCreateReqDto } from '@fullstack/common';
import logger from '../utils/logger';
import { mapDbToEntity } from '../utils/mappers';
import { UserEntity } from './UserService';

export class TaskEntity {
  id: string = '';
  assignedTo?: UserEntity;
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
  private toTaskEntityForInsert(data: TaskCreateReqDto) {
    return {
      title: data.title,
      description: data.description || '',
      status: data.status || 'todo',
      assignedTo: data.assignedTo || '',
      projectId: data.projectId || null,
      createdBy: data.createdBy,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString(): null,
    };
  }

  /**
   * Create a new task
   * @param data TaskCreateReqDto
   */
  async createTask(data: TaskCreateReqDto): Promise<TaskEntity> {
    // Convert DTO to DB-ready entity - custom types handle empty string conversion
    const insertValues = this.toTaskEntityForInsert(data);
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
    const result = await db
      .select({
        id: tasks.id,
        assignedToId: tasks.assignedTo,
        assignedToName: users.name,
        assignedToEmail: users.email,
        assignedToCreatedAt: users.createdAt,
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
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.assignedTo, userId));
    
    return result.map((task: any) => {
      const entity = mapDbToEntity(task, new TaskEntity());
      // Map user information to assignedTo object
      if (task.assignedToId) {
        entity.assignedTo = new UserEntity({
          id: task.assignedToId,
          name: task.assignedToName || '',
          email: task.assignedToEmail || '',
          createdAt: task.assignedToCreatedAt?.toISOString() || '',
        });
      }
      return entity;
    });
  }

  async getTasksByProjectId(projectId: string): Promise<TaskEntity[]> {
    const result = await db
      .select({
        id: tasks.id,
        assignedToId: tasks.assignedTo,
        assignedToName: users.name,
        assignedToEmail: users.email,
        assignedToCreatedAt: users.createdAt,
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
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.projectId, projectId));
    
    return result.map((task: any) => {
      const entity = mapDbToEntity(task, new TaskEntity());
      // Map user information to assignedTo object
      if (task.assignedToId) {
        entity.assignedTo = new UserEntity({
          id: task.assignedToId,
          name: task.assignedToName || '',
          email: task.assignedToEmail || '',
          createdAt: task.assignedToCreatedAt?.toISOString() || '',
        });
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
    const updates = {
      ...updateData,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId))
      .returning();
    if (!updated) {
      throw new CustomError('Failed to update task', ErrorCodes.INTERNAL_ERROR);
    }

    // Use the common getTaskById function to fetch the updated task with details
    return await this.getTaskById(taskId);
  }

    /**
   * Get a task by ID with user and project information
   * @param taskId string
   * @returns TaskEntity
   */
  async getTaskById(taskId: string): Promise<TaskEntity> {
    const [taskWithDetails] = await db
      .select({
        id: tasks.id,
        assignedToId: tasks.assignedTo,
        assignedToName: users.name,
        assignedToEmail: users.email,
        assignedToCreatedAt: users.createdAt,
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
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.id, taskId));

    if (!taskWithDetails) {
      throw new CustomError('Task not found', ErrorCodes.NOT_FOUND);
    }

    const entity = mapDbToEntity(taskWithDetails, new TaskEntity());
    
    // Map user information to assignedTo object
    if (taskWithDetails.assignedToId) {
      entity.assignedTo = new UserEntity({
        id: taskWithDetails.assignedToId,
        name: taskWithDetails.assignedToName || '',
        email: taskWithDetails.assignedToEmail || '',
        createdAt: taskWithDetails.assignedToCreatedAt?.toISOString() || '',
      });
    }
    
    return entity;
  }
}

export const taskService = new TaskService();
