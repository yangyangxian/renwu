import { TaskDateRange } from '../enums/taskDateRange.js';
import { TaskSortField, TaskSortOrder } from '../enums/taskSort.js';
import { TaskStatus } from '../enums/taskStatus.js';
import { TaskViewMode } from '../enums/taskViewMode.js';
import { UserResDto } from './user.dto.js';

export class TaskResDto {
  id: string = '';
  createdBy: UserResDto = new UserResDto();
  title: string = '';
  description: string = '';
  dueDate: string = '';
  status: TaskStatus = TaskStatus.TODO;
  assignedTo: UserResDto = new UserResDto();
  labels?: { id: string; labelName: string; color?: string }[] = [];
  createdAt: string = '';
  updatedAt: string = '';
  projectId: string = '';
  projectName: string = '';
}

export class TaskUpdateReqDto {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  assignedTo?: string;
  projectId?: string;
  labels?: string[];
}

export class TaskCreateReqDto {
  title!: string;
  description?: string = '';
  dueDate?: string = '';
  status?: TaskStatus = TaskStatus.TODO;
  assignedTo!: string;
  projectId?: string = '';
  labels?: string[];
  createdBy!: string;
}

/**
 * Request body for creating a task view
 */
export class TaskViewCreateReqDto {
  /** Name of the view (user-facing label) */
  name!: string;
  /** View configuration (filters, sort, etc) as JSON */
  viewConfig!: ViewConfig;
}

/**
 * Request body for updating a task view
 */
export class TaskViewUpdateReqDto {
  /** Name of the view (user-facing label) */
  name?: string;
  /** View configuration (filters, sort, etc) as JSON */
  viewConfig?: ViewConfig;
}

/**
 * Response DTO for a task view
 */
export class TaskViewResDto {
  //! is used to indicate that these fields are required
  id: string;
  userId: string;
  name: string;
  viewConfig: ViewConfig;

  // constructor is used to require every fields
  constructor(id: string, userId: string, name: string, viewConfig: ViewConfig) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.viewConfig = viewConfig;
  }
}

export class ViewConfig {
  projectId: string;
  dateRange: TaskDateRange;
  status: TaskStatus[];
  sortField: TaskSortField;
  sortOrder: TaskSortOrder;
  viewMode: TaskViewMode;
  searchTerm: string;
  constructor(projectId: string, dateRange: TaskDateRange, status: TaskStatus[], sortField: TaskSortField, sortOrder: TaskSortOrder, viewMode: TaskViewMode, searchTerm: string) {
    this.projectId = projectId;
    this.dateRange = dateRange;
    this.status = status;
    this.sortField = sortField;
    this.sortOrder = sortOrder;
    this.viewMode = viewMode;
    this.searchTerm = searchTerm;
  }
}
