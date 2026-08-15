import { PermissionAction, ProjectRole } from '@fullstack/common';
import { db } from '../database/databaseAccess';
import { roles, projectMembers, rolePermissions, permissions } from '../database/schema';
import { eq } from 'drizzle-orm';

export class UserPermissionEntity {
  userId: string = '';
  projectId: string = '';
  actions: PermissionAction[] = [];
}

export function getActionsForRole(roleName: string, actions: PermissionAction[]): PermissionAction[] {
  if (roleName === ProjectRole.OWNER) {
    return Object.values(PermissionAction);
  }
  return actions;
}

export class PermissionService {
  static async getAllRoles() {
    return db.select().from(roles);
  }

  /**
   * Get all permissions for a user (across all projects)
   */
  async getAllUserPermissions(userId: string): Promise<UserPermissionEntity[]> {
    if (!userId) return [];

    const rows = await db
      .select({
        projectId: projectMembers.projectId,
        roleName: roles.name,
        action: permissions.action
      })
      .from(projectMembers)
      .innerJoin(roles, eq(projectMembers.roleId, roles.id))
      .leftJoin(rolePermissions, eq(projectMembers.roleId, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(projectMembers.userId, userId));

    // Group by projectId
    const grouped: Record<string, PermissionAction[]> = {};
    for (const row of rows) {
      if (!grouped[row.projectId]) grouped[row.projectId] = [];
      const roleActions = getActionsForRole(row.roleName, grouped[row.projectId]);
      if (roleActions !== grouped[row.projectId]) {
        grouped[row.projectId] = roleActions;
      } else if (row.action && !roleActions.includes(row.action as PermissionAction)) {
        roleActions.push(row.action as PermissionAction);
      }
    }
    return Object.entries(grouped).map(([projectId, actions]) => ({
      userId,
      projectId,
      actions
    }));
  }
}

export const permissionService = new PermissionService();
