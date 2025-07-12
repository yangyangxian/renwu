import { db } from '../database/databaseAccess.js';
import { tasks, projects } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { CustomError } from '../classes/CustomError.js';
import { ErrorCodes, TaskUpdateReqDto, TaskCreateReqDto } from '@fullstack/common';
import logger from '../utils/logger.js';

export class TaskEntity {
  id: string = '';
  assignedTo: string = '';
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

    // Optionally, join project for projectName
    let projectName = '';
    if (created.projectId) {
      const [project] = await db.select().from(projects).where(eq(projects.id, created.projectId));
      projectName = project?.name || '';
    }

    return {
      id: created.id,
      assignedTo: created.assignedTo,
      title: created.title,
      description: created.description ?? '',
      status: created.status,
      projectId: created.projectId ?? '',
      projectName,
      dueDate: typeof created.dueDate === 'string'
        ? created.dueDate
        : created.dueDate
          ? created.dueDate.toISOString()
          : '',
      createdAt: created.createdAt ? created.createdAt.toISOString() : '',
      updatedAt: created.updatedAt ? created.updatedAt.toISOString() : '',
    };
  }

  async getTasksByUserId(userId: string): Promise<TaskEntity[]> {
    const result = await db
      .select({
        id: tasks.id,
        assignedTo: tasks.assignedTo,
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
      .where(eq(tasks.assignedTo, userId));
    return result.map((task: any) => ({
      id: task.id,
      assignedTo: task.assignedTo,
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      projectId: task.projectId ?? '',
      projectName: task.projectName ?? '',
      dueDate: typeof task.dueDate === 'string'
        ? task.dueDate
        : task.dueDate
          ? task.dueDate.toISOString()
          : '',
      createdAt: task.createdAt ? task.createdAt.toISOString() : '',
      updatedAt: task.updatedAt ? task.updatedAt.toISOString() : '',
    }));
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

    let projectName = '';
    if (updated.projectId) {
      const [project] = await db.select().from(projects).where(eq(projects.id, updated.projectId));
      projectName = project?.name || '';
    }

    return {
      id: updated.id,
      assignedTo: updated.assignedTo,
      title: updated.title,
      description: updated.description ?? '',
      status: updated.status,
      projectId: updated.projectId ?? '',
      projectName,
      dueDate: typeof updated.dueDate === 'string'
        ? updated.dueDate
        : updated.dueDate
          ? updated.dueDate.toISOString()
          : '',
      createdAt: updated.createdAt ? updated.createdAt.toISOString() : '',
      updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : '',
    };
  }
}

export const taskService = new TaskService();
