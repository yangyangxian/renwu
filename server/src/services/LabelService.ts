import { db } from '../database/databaseAccess';
import { labels, labelSets, labelSetLabels, projectMembers } from '../database/schema';
import { eq, and, ilike, inArray, isNull } from 'drizzle-orm';
import { CustomError } from '../classes/CustomError';
import { ErrorCodes } from '@fullstack/common';
import logger from '../utils/logger';

export class LabelEntity {
  id: string = '';
  labelName: string = '';
  labelDescription?: string = '';
  labelColor?: string = '';
  createdBy?: string = '';
  createdAt?: string = '';
  updatedAt?: string = '';

  constructor(init?: Partial<LabelEntity>) {
    Object.assign(this, init);
  }
}

class LabelService {
  private async assertProjectMember(projectId: string, userId: string) {
    const [member] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
    if (!member) throw new CustomError('Forbidden', ErrorCodes.UNAUTHORIZED);
  }

  async listByUser(userId: string): Promise<LabelEntity[]> {
    logger.debug('LabelService.listByUser', userId);
    // Fetch all labels created by user, but exclude labels that are attached to any label set
    // Personal labels are scoped to the user and have no projectId
    const rows = await db
      .select()
      .from(labels)
      .where(and(eq(labels.createdBy, userId), isNull(labels.projectId)));
    // Get all attached label ids from label_set_labels to filter out
    const attached = await db.select({ labelId: labelSetLabels.labelId }).from(labelSetLabels);
    const attachedIds = new Set(attached.map((a: any) => a.labelId));
    const filtered = rows.filter((r: any) => !attachedIds.has(r.id));
    return filtered.map(r => ({
      id: r.id,
      labelName: r.labelName,
      labelDescription: r.labelDescription || '',
      labelColor: r.labelColor || '',
      createdBy: r.createdBy || undefined,
      createdAt: r.createdAt?.toISOString?.() ?? '',
      updatedAt: r.updatedAt?.toISOString?.() ?? '',
    }));
  }

  async listByProject(projectId: string, actorId: string): Promise<LabelEntity[]> {
    await this.assertProjectMember(projectId, actorId);
    // Exclude labels that are attached to any label set
    const rows = await db.select().from(labels).where(eq(labels.projectId, projectId));
    const attached = await db.select({ labelId: labelSetLabels.labelId }).from(labelSetLabels);
    const attachedIds = new Set(attached.map((a: any) => a.labelId));
    const filtered = (rows || []).filter((r: any) => !attachedIds.has(r.id));
    return filtered.map((r: any) => ({
      id: r.id,
      labelName: r.labelName,
      labelDescription: r.labelDescription || '',
      labelColor: r.labelColor || '',
      createdBy: r.createdBy || undefined,
      createdAt: r.createdAt?.toISOString?.() ?? '',
      updatedAt: r.updatedAt?.toISOString?.() ?? '',
    }));
  }

  async getById(id: string) {
    const [row] = await db.select().from(labels).where(eq(labels.id, id));
    return row || null;
  }

  async create(data: { labelName: string; labelDescription?: string; labelColor?: string; createdBy: string; projectId?: string | null }) {
    // basic validation
    if (!data.labelName || !data.labelName.trim()) {
      throw new CustomError('labelName is required', ErrorCodes.VALIDATION_ERROR);
    }
    if (data.projectId) {
      await this.assertProjectMember(data.projectId, data.createdBy);
    }
    const [created] = await db.insert(labels).values({
      labelName: data.labelName.trim(),
      labelDescription: data.labelDescription || null,
      labelColor: data.labelColor || null,
      projectId: data.projectId || null,
      createdBy: data.createdBy,
    }).returning();
    if (!created) throw new CustomError('Failed to create label', ErrorCodes.INTERNAL_ERROR);
    return created;
  }

  async update(id: string, actorId: string, patch: Partial<{ labelName: string; labelDescription?: string; labelColor?: string }>) {
    // ensure ownership
    const [existing] = await db.select().from(labels).where(eq(labels.id, id));
  if (!existing) throw new CustomError('Label not found', ErrorCodes.NOT_FOUND);
  if (existing.createdBy !== actorId) throw new CustomError('Forbidden', ErrorCodes.UNAUTHORIZED);

    const updateFields: any = {};
    if (patch.labelName !== undefined) updateFields.labelName = patch.labelName.trim();
    if (patch.labelDescription !== undefined) updateFields.labelDescription = patch.labelDescription;
    if (patch.labelColor !== undefined) updateFields.labelColor = patch.labelColor;

    const [updated] = await db.update(labels).set(updateFields).where(eq(labels.id, id)).returning();
    if (!updated) throw new CustomError('Failed to update label', ErrorCodes.INTERNAL_ERROR);
    return updated;
  }

  async delete(id: string, actorId: string) {
    const [existing] = await db.select().from(labels).where(eq(labels.id, id));
    if (!existing) 
      throw new CustomError('Label not found', ErrorCodes.NOT_FOUND);

    if (existing.createdBy !== actorId) 
      throw new CustomError('Forbidden', ErrorCodes.UNAUTHORIZED);
    
    await db.delete(labels).where(eq(labels.id, id));
    // cascade cleanup for label_set_labels if FK not set to cascade
    try {
      await db.delete(labelSetLabels).where(eq(labelSetLabels.labelId, id));
    } catch (err) {
      logger.debug('LabelService.delete: cleanup error (non-fatal)', err);
    }
    return true;
  }

  // Label sets helpers
  async listSetsByUser(userId: string) {
    // Personal label sets are scoped to the user and have no projectId
    const rows = await db
      .select()
      .from(labelSets)
      .where(and(eq(labelSets.createdBy, userId), isNull(labelSets.projectId)));
    return rows;
  }

  /**
   * List personal label sets (created by user, no projectId) with their labels embedded.
   * This avoids N+1 requests from the client.
   */
  async listSetsByUserWithLabels(userId: string) {
    const rows = await db
      .select({
        setId: labelSets.id,
        labelSetName: labelSets.labelSetName,
        labelSetDescription: labelSets.labelSetDescription,
        projectId: labelSets.projectId,
        createdBy: labelSets.createdBy,
        createdAt: labelSets.createdAt,
        updatedAt: labelSets.updatedAt,
        labelId: labels.id,
        labelName: labels.labelName,
        labelDescription: labels.labelDescription,
        labelColor: labels.labelColor,
        labelCreatedBy: labels.createdBy,
        labelCreatedAt: labels.createdAt,
        labelUpdatedAt: labels.updatedAt,
      })
      .from(labelSets)
      .leftJoin(labelSetLabels, eq(labelSetLabels.labelSetId, labelSets.id))
      .leftJoin(labels, eq(labelSetLabels.labelId, labels.id))
      .where(and(eq(labelSets.createdBy, userId), isNull(labelSets.projectId)));

    const bySet = new Map<string, any>();
    for (const r of rows) {
      if (!bySet.has(r.setId)) {
        bySet.set(r.setId, {
          id: r.setId,
          labelSetName: r.labelSetName,
          labelSetDescription: r.labelSetDescription,
          projectId: r.projectId ?? null,
          createdBy: r.createdBy,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          labels: [] as any[],
        });
      }
      if (r.labelId) {
        bySet.get(r.setId).labels.push({
          id: r.labelId,
          labelName: r.labelName,
          labelDescription: r.labelDescription || '',
          labelColor: r.labelColor || '',
          createdBy: r.labelCreatedBy || undefined,
          createdAt: r.labelCreatedAt?.toISOString?.() ?? '',
          updatedAt: r.labelUpdatedAt?.toISOString?.() ?? '',
        });
      }
    }

    return Array.from(bySet.values());
  }

  async listSetsByProject(projectId: string, actorId: string) {
    await this.assertProjectMember(projectId, actorId);
    const rows = await db.select().from(labelSets).where(eq(labelSets.projectId, projectId));
    return rows;
  }

  /**
   * List project label sets with their labels embedded.
   */
  async listSetsByProjectWithLabels(projectId: string, actorId: string) {
    await this.assertProjectMember(projectId, actorId);

    const rows = await db
      .select({
        setId: labelSets.id,
        labelSetName: labelSets.labelSetName,
        labelSetDescription: labelSets.labelSetDescription,
        projectId: labelSets.projectId,
        createdBy: labelSets.createdBy,
        createdAt: labelSets.createdAt,
        updatedAt: labelSets.updatedAt,
        labelId: labels.id,
        labelName: labels.labelName,
        labelDescription: labels.labelDescription,
        labelColor: labels.labelColor,
        labelCreatedBy: labels.createdBy,
        labelCreatedAt: labels.createdAt,
        labelUpdatedAt: labels.updatedAt,
      })
      .from(labelSets)
      .leftJoin(labelSetLabels, eq(labelSetLabels.labelSetId, labelSets.id))
      .leftJoin(labels, eq(labelSetLabels.labelId, labels.id))
      .where(eq(labelSets.projectId, projectId));

    const bySet = new Map<string, any>();
    for (const r of rows) {
      if (!bySet.has(r.setId)) {
        bySet.set(r.setId, {
          id: r.setId,
          labelSetName: r.labelSetName,
          labelSetDescription: r.labelSetDescription,
          projectId: r.projectId ?? null,
          createdBy: r.createdBy,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          labels: [] as any[],
        });
      }
      if (r.labelId) {
        bySet.get(r.setId).labels.push({
          id: r.labelId,
          labelName: r.labelName,
          labelDescription: r.labelDescription || '',
          labelColor: r.labelColor || '',
          createdBy: r.labelCreatedBy || undefined,
          createdAt: r.labelCreatedAt?.toISOString?.() ?? '',
          updatedAt: r.labelUpdatedAt?.toISOString?.() ?? '',
        });
      }
    }

    return Array.from(bySet.values());
  }

  async createSet(data: { labelSetName: string; labelSetDescription?: string; createdBy: string; projectId?: string | null }) {
    if (!data.labelSetName || !data.labelSetName.trim()) {
      throw new CustomError('labelSetName is required', ErrorCodes.VALIDATION_ERROR);
    }
    if (data.projectId) {
      await this.assertProjectMember(data.projectId, data.createdBy);
    }
    const [created] = await db.insert(labelSets).values({
      labelSetName: data.labelSetName.trim(),
      labelSetDescription: data.labelSetDescription || null,
      projectId: data.projectId || null,
      createdBy: data.createdBy,
    }).returning();
    if (!created) throw new CustomError('Failed to create label set', ErrorCodes.INTERNAL_ERROR);
    return created;
  }

  async createLabelInSet(
    data: { labelName: string; labelDescription?: string; labelColor?: string },
    labelSetId: string,
    actorId: string
  ) {
    // ensure set exists and owned by actor
    const [setRow] = await db.select().from(labelSets).where(eq(labelSets.id, labelSetId));
    if (!setRow) throw new CustomError('Label set not found', ErrorCodes.NOT_FOUND);
    if (setRow.createdBy !== actorId) throw new CustomError('Forbidden', ErrorCodes.UNAUTHORIZED);

    // basic validation
    if (!data.labelName || !data.labelName.trim()) {
      throw new CustomError('labelName is required', ErrorCodes.VALIDATION_ERROR);
    }

    // create label and attach to set in a transaction
    const created = await db.transaction(async (tx) => {
      const [labelRow] = await tx.insert(labels).values({
        labelName: data.labelName.trim(),
        labelDescription: data.labelDescription || null,
        labelColor: data.labelColor || null,
        projectId: (setRow as any).projectId ?? null,
        createdBy: actorId,
      }).returning();
      if (!labelRow) throw new CustomError('Failed to create label', ErrorCodes.INTERNAL_ERROR);
      try {
        await tx.insert(labelSetLabels).values({ labelSetId, labelId: labelRow.id }).onConflictDoNothing().execute();
      } catch (err) {
        logger.debug('createLabelInSet: failed to attach label to set (non-fatal)', err);
      }
      return labelRow;
    });

    return created;
  }

  async listLabelsInSet(labelSetId: string) {
    // ensure set exists
    const [setRow] = await db.select().from(labelSets).where(eq(labelSets.id, labelSetId));
    if (!setRow) throw new CustomError('Label set not found', ErrorCodes.NOT_FOUND);

    // join label_set_labels -> labels to fetch labels attached to the set
    const rows = await db.select()
      .from(labelSetLabels)
      .innerJoin(labels, eq(labelSetLabels.labelId, labels.id))
      .where(eq(labelSetLabels.labelSetId, labelSetId));

    return rows.map((r: any) => ({
      id: r.labels.id,
      labelName: r.labels.labelName,
      labelDescription: r.labels.labelDescription || '',
      labelColor: r.labels.labelColor || '',
      createdBy: r.labels.createdBy || undefined,
      createdAt: r.labels.createdAt?.toISOString?.() ?? '',
      updatedAt: r.labels.updatedAt?.toISOString?.() ?? '',
    }));
  }

  async deleteSet(setId: string, actorId: string) {
    // ensure set exists and actor is owner
    const [existing] = await db.select().from(labelSets).where(eq(labelSets.id, setId));
    if (!existing) throw new CustomError('Label set not found', ErrorCodes.NOT_FOUND);
    if (existing.createdBy !== actorId) throw new CustomError('Forbidden', ErrorCodes.UNAUTHORIZED);

    // perform deletion of associations, labels, and the set in a single transaction
    await db.transaction(async (tx) => {
      // fetch attached label ids
      const attached = await tx.select({ labelId: labelSetLabels.labelId }).from(labelSetLabels).where(eq(labelSetLabels.labelSetId, setId));
      const labelIds = (attached || []).map((a: any) => a.labelId).filter(Boolean);

      // delete associations (label_set_labels)
      await tx.delete(labelSetLabels).where(eq(labelSetLabels.labelSetId, setId));

      // delete labels that were attached to this set
      if (labelIds.length > 0) {
        await tx.delete(labels).where(inArray(labels.id, labelIds));
      }

      // delete the set itself
      await tx.delete(labelSets).where(eq(labelSets.id, setId));
    });

    return true;
  }
}

export const labelService = new LabelService();
