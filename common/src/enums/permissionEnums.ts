// Shared permission enums for both frontend and backend

export enum PermissionAction {
  DELETE_PROJECT = 'delete_project',
  UPDATE_PROJECT = 'update_project',
  DELETE_OTHERS_TASK = 'delete_others_task',
}

export enum PermissionResourceType {
  TASK = 'task',
  PROJECT = 'project',
}
