import { CustomError } from '../classes/CustomError';
import { db } from '../database/databaseAccess';
import { projectDocuments } from '../database/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { ErrorCodes } from '@fullstack/common';

export class ProjectDocumentEntity {
  id: string = '';
  projectId: string = '';
  title: string = '';
  content: string | null = null;
  position: number = 0;
  createdBy: string | null = null;
  createdAt: Date | null = null;
  updatedAt: Date | null = null;

  constructor(init?: Partial<ProjectDocumentEntity>) {
    Object.assign(this, init);
  }
}

export class ProjectDocumentService {
  async getDocumentById(projectId: string, documentId: string): Promise<ProjectDocumentEntity | null> {
    const [row] = await db
      .select()
      .from(projectDocuments)
      .where(and(eq(projectDocuments.id, documentId), eq(projectDocuments.projectId, projectId)))
      .limit(1);

    if (!row) {
      return null;
    }

    return new ProjectDocumentEntity({
      id: row.id,
      projectId: row.projectId,
      title: row.title,
      content: row.content,
      position: row.position,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async getDocumentsByProjectId(projectId: string): Promise<ProjectDocumentEntity[]> {
    const rows = await db
      .select()
      .from(projectDocuments)
      .where(eq(projectDocuments.projectId, projectId))
      .orderBy(asc(projectDocuments.position), asc(projectDocuments.createdAt));

    return rows.map((row) => new ProjectDocumentEntity({
      id: row.id,
      projectId: row.projectId,
      title: row.title,
      content: row.content,
      position: row.position,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async createDocument(
    projectId: string,
    userId: string,
    input: { title?: string; content?: string }
  ): Promise<ProjectDocumentEntity> {
    const [lastDocument] = await db
      .select({
        position: projectDocuments.position,
      })
      .from(projectDocuments)
      .where(eq(projectDocuments.projectId, projectId))
      .orderBy(desc(projectDocuments.position), desc(projectDocuments.createdAt))
      .limit(1);

    const nextPosition = typeof lastDocument?.position === 'number' ? lastDocument.position + 1 : 0;
    const nextTitle = input.title?.trim() || (nextPosition === 0 ? 'Overview' : `Document ${nextPosition}`);

    const [createdDocument] = await db
      .insert(projectDocuments)
      .values({
        projectId,
        title: nextTitle,
        content: input.content ?? '',
        position: nextPosition,
        createdBy: userId,
      })
      .returning();

    if (!createdDocument) {
      throw new CustomError('Failed to create project document', ErrorCodes.INTERNAL_ERROR);
    }

    return new ProjectDocumentEntity({
      id: createdDocument.id,
      projectId: createdDocument.projectId,
      title: createdDocument.title,
      content: createdDocument.content,
      position: createdDocument.position,
      createdBy: createdDocument.createdBy,
      createdAt: createdDocument.createdAt,
      updatedAt: createdDocument.updatedAt,
    });
  }

  async updateDocument(
    projectId: string,
    documentId: string,
    input: { title?: string; content?: string; position?: number }
  ): Promise<ProjectDocumentEntity | null> {
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) {
      updates.title = input.title.trim();
    }
    if (input.content !== undefined) {
      updates.content = input.content;
    }
    if (input.position !== undefined) {
      updates.position = input.position;
    }

    const [updatedDocument] = await db
      .update(projectDocuments)
      .set(updates)
      .where(and(eq(projectDocuments.id, documentId), eq(projectDocuments.projectId, projectId)))
      .returning();

    if (!updatedDocument) {
      return null;
    }

    return new ProjectDocumentEntity({
      id: updatedDocument.id,
      projectId: updatedDocument.projectId,
      title: updatedDocument.title,
      content: updatedDocument.content,
      position: updatedDocument.position,
      createdBy: updatedDocument.createdBy,
      createdAt: updatedDocument.createdAt,
      updatedAt: updatedDocument.updatedAt,
    });
  }

  async deleteDocument(projectId: string, documentId: string): Promise<boolean> {
    const documents = await db
      .select({
        id: projectDocuments.id,
      })
      .from(projectDocuments)
      .where(eq(projectDocuments.projectId, projectId));

    if (documents.length <= 1) {
      throw new CustomError('Project must keep at least one document', ErrorCodes.VALIDATION_ERROR);
    }

    const [deletedDocument] = await db
      .delete(projectDocuments)
      .where(and(eq(projectDocuments.id, documentId), eq(projectDocuments.projectId, projectId)))
      .returning({ id: projectDocuments.id });

    return !!deletedDocument;
  }
}

export const projectDocumentService = new ProjectDocumentService();
