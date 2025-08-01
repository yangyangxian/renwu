import { PermissionAction, PermissionResourceType } from '../enums/permissionEnums';
import { UserPermissionResDto } from '../dtos/user.dto';

export interface ResourceBase {
  resourceType: PermissionResourceType;
}

export interface TaskResource extends ResourceBase {
  resourceType: PermissionResourceType.TASK;
  taskId: string;
  assignedUserId: string;
}

export interface ProjectResource extends ResourceBase {
  resourceType: PermissionResourceType.PROJECT;
  projectId: string;
}

export type PermissionResource = TaskResource | ProjectResource;

/**
 * Checks if a user has a specific permission action for a given resource (project, task, etc).
 * @param permissions Array of UserPermissionResDto (user's permissions)
 * @param resource Resource object (ProjectResource, TaskResource, ...)
 * @param action PermissionAction to check
 * @returns true if user has the permission, false otherwise
 */
export function hasPermission(
  permissions: UserPermissionResDto[],
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  switch (resource.resourceType) {
    case PermissionResourceType.PROJECT:
      return hasProjectPermission(permissions, resource, action);
    case PermissionResourceType.TASK:
      return hasTaskPermission(permissions, resource, action);
    default:
      return false;
  }
}

function hasProjectPermission(
  permissions: UserPermissionResDto[],
  projectResource: ProjectResource,
  action: PermissionAction
): boolean {
  const projectPerm = permissions.find((p) => p.projectId === projectResource.projectId);
  if (!projectPerm) return false;
  return projectPerm.actions.includes(action);
}

function hasTaskPermission(
  permissions: UserPermissionResDto[],
  taskResource: TaskResource,
  action: PermissionAction
): boolean {
  return false; // Placeholder for actual task permission logic
} 