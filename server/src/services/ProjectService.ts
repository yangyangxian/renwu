import { UserEntity } from './UserService.js';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../database/databaseAccess.js';
import { projects, projectMembers, users } from '../database/schema.js';

export class ProjectEntity {
  id: string = '';
  name: string = '';
  description: string | null = null;
  createdAt: Date | null = null;
  updatedAt: Date | null = null;
  createdBy: string = '';
  members: UserEntity[] = [];

  constructor(init?: Partial<ProjectEntity>) {
    Object.assign(this, init);
  }
}

export type ProjectRow = typeof projects.$inferSelect;
export type UserRow = typeof users.$inferSelect;

export interface ProjectWithMembers extends ProjectRow {
  members: Pick<UserRow, 'id' | 'name' | 'email'>[];
}

export class ProjectService {
  async getProjectsByUserId(userId: string): Promise<ProjectEntity[]> {
    // Get all project IDs for the user first
    const userProjectIds = await db
      .select({ id: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));
    const projectIds = userProjectIds.map((row: { id: any; }) => row.id);

    const rows = projectIds.length === 0 ? [] : await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        projectDescription: projects.description,
        projectCreatedAt: projects.createdAt,
        projectUpdatedAt: projects.updatedAt,
        createdBy: projects.createdBy,
        memberId: users.id,
        memberName: users.name,
        memberEmail: users.email,
        memberPassword: users.passwordHash,
        memberCreatedAt: users.createdAt,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(inArray(projects.id, projectIds));

    // Group by project and map to ProjectEntity
    const projectMap = new Map<string, ProjectEntity>();
    for (const row of rows) {
      const pid = String(row.projectId);
      if (!projectMap.has(pid)) {
        projectMap.set(pid, new ProjectEntity({
          id: row.projectId,
          name: row.projectName,
          description: row.projectDescription,
          createdAt: row.projectCreatedAt,
          updatedAt: row.projectUpdatedAt,
          createdBy: row.createdBy ?? '',
          members: [],
        }));
      }
      const project = projectMap.get(pid)!;
      // Use UserEntity constructor for cleaner instantiation
      project.members.push(new UserEntity({
        id: row.memberId,
        name: row.memberName,
        email: row.memberEmail,
        password: row.memberPassword,
        createdAt: row.memberCreatedAt?.toISOString?.() ?? '',
      }));
    }
    return Array.from(projectMap.values());
  }
}

export const projectService = new ProjectService();
