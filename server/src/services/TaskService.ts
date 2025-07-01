import { db } from '../database/databaseAccess.js';
import { tasks, projects } from '../database/schema.js';
import { eq } from 'drizzle-orm';

export class TaskEntity {
  id: string = '';
  userId: string = '';
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
  async getTasksByUserId(userId: string): Promise<TaskEntity[]> {
    const result = await db
      .select({
        id: tasks.id,
        userId: tasks.assignedTo,
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
    return result.map(task => ({
      id: task.id,
      userId: task.userId,
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      projectId: task.projectId ?? '',
      projectName: task.projectName ?? '',
      dueDate: task.dueDate ? task.dueDate.toISOString() : '',
      createdAt: task.createdAt ? task.createdAt.toISOString() : '',
      updatedAt: task.updatedAt ? task.updatedAt.toISOString() : '',
    }));
  }
}

export const taskService = new TaskService();
