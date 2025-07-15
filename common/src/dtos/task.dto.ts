import { TaskStatus } from '../emuns/taskStatus.js';

export class TaskResDto {
  id: string = '';
  title: string = '';
  description: string = '';
  dueDate?: string = '';
  status: TaskStatus = TaskStatus.TODO;
  assignedTo?: string = '';
  createdAt?: string = '';
  updatedAt?: string = '';
  projectId?: string = '';
  projectName?: string = '';
}

export class TaskUpdateReqDto {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  assignedTo?: string;
  projectId?: string;
}

export class TaskCreateReqDto {
  title: string = '';
  description?: string = '';
  dueDate?: string = '';
  status?: TaskStatus = TaskStatus.TODO;
  assignedTo?: string = '';
  projectId?: string = '';
  createdBy: string = '';
}
