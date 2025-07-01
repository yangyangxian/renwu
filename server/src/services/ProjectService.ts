import { eq } from 'drizzle-orm';
import { db } from '../database/databaseAccess.js';
import { projects, projectMembers } from '../database/schema.js';

export class ProjectService {
  async getProjectsByUserId(userId: string) {
    return db
      .select({ projects })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, userId));
  }
}

export const projectService = new ProjectService();
