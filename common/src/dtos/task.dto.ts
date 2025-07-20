import { TaskStatus } from '../emuns/taskStatus.js';
import { UserResDto } from './user.dto.js';

export class TaskResDto {
  id: string = '';
  createdBy?: UserResDto = new UserResDto();
  title: string = '';
  description: string = '';
  dueDate?: string = '';
  status: TaskStatus = TaskStatus.TODO;
  assignedTo?: UserResDto = new UserResDto();
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
