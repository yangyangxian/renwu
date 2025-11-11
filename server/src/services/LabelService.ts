import { db } from '../database/databaseAccess';
import { labels, labelSets, labelSetLabels } from '../database/schema';
import { eq, and, ilike } from 'drizzle-orm';
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
  async listByUser(userId: string): Promise<LabelEntity[]> {
    logger.debug('LabelService.listByUser', userId);
    // Fetch all labels created by user, but exclude labels that are attached to any label set
    const rows = await db.select().from(labels).where(eq(labels.createdBy, userId));
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

  async getById(id: string) {
    const [row] = await db.select().from(labels).where(eq(labels.id, id));
    return row || null;
  }

  async create(data: { labelName: string; labelDescription?: string; labelColor?: string; createdBy: string }) {
    // basic validation
    if (!data.labelName || !data.labelName.trim()) {
      throw new CustomError('labelName is required', ErrorCodes.VALIDATION_ERROR);
    }
    const [created] = await db.insert(labels).values({
      labelName: data.labelName.trim(),
      labelDescription: data.labelDescription || null,
      labelColor: data.labelColor || null,
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
    const rows = await db.select().from(labelSets).where(eq(labelSets.createdBy, userId));
    return rows;
  }

  async createSet(data: { labelSetName: string; labelSetDescription?: string; createdBy: string }) {
    if (!data.labelSetName || !data.labelSetName.trim()) {
      throw new CustomError('labelSetName is required', ErrorCodes.VALIDATION_ERROR);
    }
    const [created] = await db.insert(labelSets).values({
      labelSetName: data.labelSetName.trim(),
      labelSetDescription: data.labelSetDescription || null,
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
}

export const labelService = new LabelService();
