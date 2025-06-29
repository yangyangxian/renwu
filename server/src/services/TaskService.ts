import { db } from '../database/databaseAccess.js';
import { tasks } from '../database/schema.js';
import { eq } from 'drizzle-orm';

export class TaskEntity {
  id: string = '';
  userId: string = '';
  title: string = '';
  description: string = '';
  status: string = '';
  dueDate?: string = '';
  createdAt: string = '';
}

class TaskService {
  async getTasksByUserId(userId: string): Promise<TaskEntity[]> {
    const result = await db.select().from(tasks).where(eq(tasks.assignedTo, userId));
    return result.map(task => ({
      id: task.id,
      userId: task.assignedTo,
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      dueDate: task.dueDate?.toISOString?.() ?? '',
      createdAt: task.createdAt?.toISOString?.() ?? '',
    }));
  }
}

export const taskService = new TaskService();
