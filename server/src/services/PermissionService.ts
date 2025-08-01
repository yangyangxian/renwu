import { PermissionAction } from '@fullstack/common';
import { db } from '../database/databaseAccess';
import { roles, projectMembers, rolePermissions, permissions } from '../database/schema';
import { eq } from 'drizzle-orm';

export class UserPermissionEntity {
  userId: string = '';
  projectId: string = '';
  actions: PermissionAction[] = [];
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
        action: permissions.action
      })
      .from(projectMembers)
      .innerJoin(rolePermissions, eq(projectMembers.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(projectMembers.userId, userId));

    // Group by projectId
    const grouped: Record<string, PermissionAction[]> = {};
    for (const row of rows) {
      if (!grouped[row.projectId]) grouped[row.projectId] = [];
      grouped[row.projectId].push(row.action as PermissionAction);
    }
    return Object.entries(grouped).map(([projectId, actions]) => ({
      userId,
      projectId,
      actions
    }));
  }
}

export const permissionService = new PermissionService();
