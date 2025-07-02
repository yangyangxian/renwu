import { TaskStatus } from '../emuns/taskStatus.js';
/*
* The reason why using classes instead of interfaces is to ensure that the fields of DTOs can be used for object mapping in api.
*/
export class UserResDto {
  id: string | undefined;
  name: string = '';
  email?: string = '';
}

export class UserReqDto {
  email : string;
  constructor(email: string) {
    this.email = email;
  }
}

export class HelloResDto {
  message: string = '';
}

// Authentication DTOs
export class LoginReqDto {
  email: string = '';
  password: string = '';
}

export class LogoutResDto {
  message: string = '';
}

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

export class ProjectResDto {
  id: string = '';
  name: string = '';
  description?: string = '';
  createdBy?: string = '';
  createdAt?: string = '';
  updatedAt?: string = '';
  members?: UserResDto[] = [];
}

