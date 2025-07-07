import { ProjectRole, ErrorCodes } from '@fullstack/common';
import { CustomError } from '../classes/CustomError.js';
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

  /**
   * Creates a new project and adds the owner as a member with OWNER role.
   * @param params { name, description, ownerId }
   */
  async createProject({ name, description, ownerId }: { name: string; description?: string; ownerId: string }) {
    // Use a transaction to ensure both inserts succeed or fail together
    return await db.transaction(async (tx) => {
      // Insert project
      const [projectRow] = await tx.insert(projects).values({
        name,
        description,
        createdBy: ownerId,
      }).returning();
      if (!projectRow) throw new CustomError('Failed to create project', ErrorCodes.INTERNAL_ERROR);

      // Add owner as project member with OWNER role
      await tx.insert(projectMembers).values({
        projectId: projectRow.id,
        userId: ownerId,
        role: ProjectRole.OWNER,
      });

      // Fetch members (just the owner for now)
      const members = [
        new UserEntity({
          id: ownerId,
          // Optionally fetch name/email if needed, or leave blank for now
        })
      ];

      return new ProjectEntity({
        id: projectRow.id,
        name: projectRow.name,
        description: projectRow.description,
        createdAt: projectRow.createdAt,
        updatedAt: projectRow.updatedAt,
        createdBy: projectRow.createdBy,
        members,
      });
    });
  }
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
