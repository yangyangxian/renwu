import { permissionService } from '../services/PermissionService';
import { taskService } from '../services/TaskService';
import { hasPermission, PermissionAction, PermissionResourceType, UserPermissionResDto, PermissionResource } from '@fullstack/common';
import { mapObject } from '../utils/mappers';
import { CustomError } from '../classes/CustomError';
import { ErrorCodes } from '@fullstack/common';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Generic permission middleware factory
export function requirePermission(action: PermissionAction, resourceType: PermissionResourceType, resourceId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.userId) {
        return next(new CustomError('Authentication required', ErrorCodes.UNAUTHORIZED));
      }
      let resource: PermissionResource;
      switch (resourceType) {
        case PermissionResourceType.PROJECT: {
          if (!resourceId) return next(new CustomError('Project ID is required', ErrorCodes.NO_DATA));
          resource = { resourceType, projectId: resourceId };
          break;
        }
        case PermissionResourceType.TASK: {
          if (!resourceId) return next(new CustomError('Task ID is required', ErrorCodes.NO_DATA));
          const task = await taskService.getTaskById(resourceId);
          if (!task) return next(new CustomError('Task not found', ErrorCodes.NOT_FOUND));

          resource = {
            resourceType,
            projectId: task.projectId,
            loggedUserId: req.user.userId,
            assignedUserId: task.assignedTo!.id
          };
          break;
        }
        // Add more resource types as needed
        default:
          return next(new CustomError('Unsupported resource type', ErrorCodes.INVALID_INPUT));
      }

      logger.debug(`[Permission Check] User: ${req.user.userId}, Action: ${action}, Resource:`, resource);
      
      const permissions = await permissionService.getAllUserPermissions(req.user.userId);
      const allowed = hasPermission(
        permissions.map(p => mapObject(p, new UserPermissionResDto())),
        resource,
        action
      );
      if (!allowed) {
        logger.warn(`Permission denied for user ${req.user.userId} on resource`);
        return next(new CustomError('Insufficient permissions', ErrorCodes.UNAUTHORIZED));
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}