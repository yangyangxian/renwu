import { ProjectRole, ErrorCodes } from '@fullstack/common';
import { CustomError } from '../classes/CustomError';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../database/databaseAccess';
import { projects, projectMembers, users, tasks } from '../database/schema';

export class ProjectEntity {
  id: string = '';
  name: string = '';
  slug: string = '';
  description: string | null = null;
  createdAt: Date | null = null;
  updatedAt: Date | null = null;
  createdBy: string = '';
  members: ProjectMemberEntity[] = [];
  constructor(init?: Partial<ProjectEntity>) {
    Object.assign(this, init);
  }
}

export class ProjectMemberEntity {
  id: string = '';
  name: string = '';
  email?: string = '';
  role: ProjectRole = ProjectRole.MEMBER;
  constructor(init?: Partial<ProjectMemberEntity>) {
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
   * Get a project by its ID.
   */
  async getProjectById(projectId: string): Promise<ProjectEntity | null> {
    // Get project and all members
    const rows = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        projectSlug: projects.slug,
        projectDescription: projects.description,
        projectCreatedAt: projects.createdAt,
        projectUpdatedAt: projects.updatedAt,
        createdBy: projects.createdBy,
        memberId: users.id,
        memberName: users.name,
        memberEmail: users.email,
        memberRole: projectMembers.role,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projects.id, projectId));

    if (!rows || rows.length === 0) return null;

    const project = new ProjectEntity({
      id: rows[0].projectId,
      name: rows[0].projectName,
      slug: rows[0].projectSlug,
      description: rows[0].projectDescription,
      createdAt: rows[0].projectCreatedAt,
      updatedAt: rows[0].projectUpdatedAt,
      createdBy: rows[0].createdBy ?? '',
      members: [],
    });
    for (const row of rows) {
      project.members.push(new ProjectMemberEntity({
        id: row.memberId,
        name: row.memberName,
        email: row.memberEmail,
        role: row.memberRole,
      }));
    }
    return project;
  }

  /**
   * Get a project by its slug.
   */
  async getProjectBySlug(projectSlug: string): Promise<ProjectEntity | null> {
    // Get project and all members
    const rows = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        projectSlug: projects.slug,
        projectDescription: projects.description,
        projectCreatedAt: projects.createdAt,
        projectUpdatedAt: projects.updatedAt,
        createdBy: projects.createdBy,
        memberId: users.id,
        memberName: users.name,
        memberEmail: users.email,
        memberRole: projectMembers.role,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projects.slug, projectSlug));

    if (!rows || rows.length === 0) return null;

    const project = new ProjectEntity({
      id: rows[0].projectId,
      name: rows[0].projectName,
      slug: rows[0].projectSlug,
      description: rows[0].projectDescription,
      createdAt: rows[0].projectCreatedAt,
      updatedAt: rows[0].projectUpdatedAt,
      createdBy: rows[0].createdBy ?? '',
      members: [],
    });
    for (const row of rows) {
      project.members.push(new ProjectMemberEntity({
        id: row.memberId,
        name: row.memberName,
        email: row.memberEmail,
        role: row.memberRole,
      }));
    }
    return project;
  }

  /**
   * Creates a new project and adds the owner as a member with OWNER role.
   * @param params { name, description, ownerId }
   */
  async createProject({ name, slug, description, ownerId }: { name: string; slug: string; description?: string; ownerId: string }) {
    // Check if slug already exists
    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);
    
    if (existingProject.length > 0) {
      throw new CustomError('Project slug already exists. Please choose a different one.', ErrorCodes.VALIDATION_ERROR);
    }

    // Use a transaction to ensure both inserts succeed or fail together
    return await db.transaction(async (tx:any) => {
      // Insert project with user-provided slug
      const [projectRow] = await tx.insert(projects).values({
        name,
        slug,
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
        new ProjectMemberEntity({
          id: ownerId,
          // Optionally fetch name/email if needed, or leave blank for now
        })
      ];

      return new ProjectEntity({
        id: projectRow.id,
        name: projectRow.name,
        slug: projectRow.slug,
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
        projectSlug: projects.slug,
        projectDescription: projects.description,
        projectCreatedAt: projects.createdAt,
        projectUpdatedAt: projects.updatedAt,
        createdBy: projects.createdBy,
        memberId: users.id,
        memberName: users.name,
        memberEmail: users.email,
        memberRole: projectMembers.role,
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
          slug: row.projectSlug,
          description: row.projectDescription,
          createdAt: row.projectCreatedAt,
          updatedAt: row.projectUpdatedAt,
          createdBy: row.createdBy ?? '',
          members: [],
        }));
      }
      const project = projectMap.get(pid)!;
      // Use UserEntity constructor for cleaner instantiation
      project.members.push(new ProjectMemberEntity({
        id: row.memberId,
        name: row.memberName,
        email: row.memberEmail,
        role: row.memberRole,
      }));
    }
    return Array.from(projectMap.values());
  }

  /**
   * Updates a project's details (name, description).
   * @param projectId string
   * @param updateData { name?: string; description?: string }
   */
  async updateProject(
    projectId: string,
    updateData: { name?: string; description?: string; slug?: string }
  ): Promise<ProjectEntity | null> {
    // If slug is being updated, check for uniqueness
    if (updateData.slug) {
      const existingProject = await db
        .select()
        .from(projects)
        .where(eq(projects.slug, updateData.slug))
        .limit(1);
      
      // If a project with this slug exists and it's not the current project
      if (existingProject.length > 0 && existingProject[0].id !== projectId) {
        throw new CustomError('Project slug already exists. Please choose a different one.', ErrorCodes.VALIDATION_ERROR);
      }
    }

    // Update the project details
    const updates = {
      ...updateData,
      updatedAt: new Date(),
    };

    const [updatedProject] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, projectId))
      .returning();

    if (!updatedProject) {
      return null;
    }

    // Fetch updated project with members
    return this.getProjectById(projectId);
  }

  /**
   * Delete a project and all its associated data.
   * This will cascade delete project members and tasks.
   */
  async deleteProject(projectId: string): Promise<boolean> {
    // Check if project exists
    const existingProject = await this.getProjectById(projectId);
    if (!existingProject) {
      throw new CustomError('Project not found', ErrorCodes.NOT_FOUND);
    }

    try {
      // Delete all tasks associated with this project first
      await db.delete(tasks).where(eq(tasks.projectId, projectId));

      // Delete project members (this will also be handled by cascade, but explicit is clearer)
      await db.delete(projectMembers).where(eq(projectMembers.projectId, projectId));

      // Delete the project
      const [deletedProject] = await db
        .delete(projects)
        .where(eq(projects.id, projectId))
        .returning();

      return !!deletedProject;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new CustomError('Failed to delete project', ErrorCodes.INTERNAL_ERROR);
    }
  }
}

export const projectService = new ProjectService();
