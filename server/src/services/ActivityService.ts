import {
  ActivityActionType,
  ActivityEntityType,
} from '@fullstack/common';
import { and, desc, eq } from 'drizzle-orm';
import { CustomError } from '../classes/CustomError';
import { db } from '../database/databaseAccess';
import { activityEvents, projectMembers, tasks, users } from '../database/schema';
import { ErrorCodes } from '@fullstack/common';
import { ProjectDocumentEntity } from './ProjectDocumentService';
import { TaskEntity } from './TaskService';

export type ActivityChange = {
  field: string;
  before?: unknown;
  after?: unknown;
};

export type ActivityPayload = {
  changes?: ActivityChange[];
  context?: Record<string, unknown>;
};

export class ActivityEventEntity {
  id: string = '';
  projectId: string = '';
  actorUserId: string | null = null;
  actorNameSnapshot: string = '';
  entityType: ActivityEntityType = ActivityEntityType.PROJECT;
  entityId: string = '';
  entityTitleSnapshot: string | null = null;
  actionType: ActivityActionType = ActivityActionType.UPDATED;
  summary: string = '';
  payload: ActivityPayload = {};
  createdAt: Date | null = null;

  constructor(init?: Partial<ActivityEventEntity>) {
    Object.assign(this, init);
  }
}

type RecordActivityInput = {
  projectId: string;
  actorUserId: string;
  entityType: ActivityEntityType;
  entityId: string;
  entityTitleSnapshot?: string | null;
  actionType: ActivityActionType;
  summary: string;
  payload?: ActivityPayload;
};

class ActivityService {
  private async assertProjectMember(projectId: string, userId: string): Promise<void> {
    const [membership] = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .limit(1);

    if (!membership) {
      throw new CustomError('Project not found or not accessible', ErrorCodes.UNAUTHORIZED);
    }
  }

  private async getActorNameSnapshot(actorUserId: string): Promise<string> {
    const [actor] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, actorUserId))
      .limit(1);

    if (!actor?.name) {
      throw new CustomError('Actor user not found', ErrorCodes.NOT_FOUND);
    }

    return actor.name;
  }

  private static normalizeValue(value: unknown): unknown {
    if (value instanceof Date) {
      return value.toISOString();
    }

    return value;
  }

  private static hasMeaningfulChange(before: unknown, after: unknown): boolean {
    return JSON.stringify(ActivityService.normalizeValue(before)) !== JSON.stringify(ActivityService.normalizeValue(after));
  }

  private static compactChanges(changes: Array<ActivityChange | null>): ActivityChange[] {
    return changes.filter((change): change is ActivityChange => Boolean(change));
  }

  private static createChange(field: string, before: unknown, after: unknown): ActivityChange | null {
    if (!ActivityService.hasMeaningfulChange(before, after)) {
      return null;
    }

    return {
      field,
      before: ActivityService.normalizeValue(before),
      after: ActivityService.normalizeValue(after),
    };
  }

  private static createTruncatedTextChange(field: string, before: unknown, after: unknown): ActivityChange | null {
    if (!ActivityService.hasMeaningfulChange(before, after)) {
      return null;
    }

    return { field };
  }

  private static normalizeLabelNames(task: TaskEntity | null): string[] {
    return [...(task?.labels || [])]
      .map((label) => label.labelName)
      .sort((a, b) => a.localeCompare(b));
  }

  private buildTaskUpdatePayload(beforeTask: TaskEntity, afterTask: TaskEntity): ActivityPayload | null {
    const changes = ActivityService.compactChanges([
      ActivityService.createChange('title', beforeTask.title, afterTask.title),
      ActivityService.createTruncatedTextChange('description', beforeTask.description, afterTask.description),
      ActivityService.createChange('status', beforeTask.status, afterTask.status),
      ActivityService.createChange('assignedTo', beforeTask.assignedTo?.name || beforeTask.assignedTo?.id || null, afterTask.assignedTo?.name || afterTask.assignedTo?.id || null),
      ActivityService.createChange('dueDate', beforeTask.dueDate || null, afterTask.dueDate || null),
      ActivityService.createChange('projectId', beforeTask.projectId || null, afterTask.projectId || null),
      ActivityService.createChange('labels', ActivityService.normalizeLabelNames(beforeTask), ActivityService.normalizeLabelNames(afterTask)),
    ]);

    if (changes.length === 0) {
      return null;
    }

    return { changes };
  }

  private buildProjectDocumentUpdatePayload(
    beforeDocument: ProjectDocumentEntity,
    afterDocument: ProjectDocumentEntity
  ): ActivityPayload | null {
    const changes = ActivityService.compactChanges([
      ActivityService.createChange('title', beforeDocument.title, afterDocument.title),
      ActivityService.createTruncatedTextChange('content', beforeDocument.content ?? '', afterDocument.content ?? ''),
      ActivityService.createChange('position', beforeDocument.position, afterDocument.position),
    ]);

    if (changes.length === 0) {
      return null;
    }

    return { changes };
  }

  async record(input: RecordActivityInput): Promise<ActivityEventEntity> {
    const actorNameSnapshot = await this.getActorNameSnapshot(input.actorUserId);
    const [createdEvent] = await db
      .insert(activityEvents)
      .values({
        projectId: input.projectId,
        actorUserId: input.actorUserId,
        actorNameSnapshot,
        entityType: input.entityType,
        entityId: input.entityId,
        entityTitleSnapshot: input.entityTitleSnapshot ?? null,
        actionType: input.actionType,
        summary: input.summary,
        payload: input.payload ?? {},
      })
      .returning();

    if (!createdEvent) {
      throw new CustomError('Failed to record activity', ErrorCodes.INTERNAL_ERROR);
    }

    return new ActivityEventEntity({
      id: createdEvent.id,
      projectId: createdEvent.projectId,
      actorUserId: createdEvent.actorUserId,
      actorNameSnapshot: createdEvent.actorNameSnapshot,
      entityType: createdEvent.entityType as ActivityEntityType,
      entityId: createdEvent.entityId,
      entityTitleSnapshot: createdEvent.entityTitleSnapshot,
      actionType: createdEvent.actionType as ActivityActionType,
      summary: createdEvent.summary,
      payload: createdEvent.payload as ActivityPayload,
      createdAt: createdEvent.createdAt,
    });
  }

  async recordTaskCreated(task: TaskEntity, actorUserId: string): Promise<ActivityEventEntity | null> {
    if (!task.projectId) {
      return null;
    }

    return this.record({
      projectId: task.projectId,
      actorUserId,
      entityType: ActivityEntityType.TASK,
      entityId: task.id,
      entityTitleSnapshot: task.title,
      actionType: ActivityActionType.CREATED,
      summary: `created task "${task.title}"`,
      payload: {
        context: {
          status: task.status,
          assignedTo: task.assignedTo?.name || task.assignedTo?.id || null,
          dueDate: task.dueDate || null,
          labels: ActivityService.normalizeLabelNames(task),
        },
      },
    });
  }

  async recordTaskUpdated(beforeTask: TaskEntity, afterTask: TaskEntity, actorUserId: string): Promise<ActivityEventEntity | null> {
    const projectId = afterTask.projectId || beforeTask.projectId;
    if (!projectId) {
      return null;
    }

    const payload = this.buildTaskUpdatePayload(beforeTask, afterTask);
    if (!payload) {
      return null;
    }

    return this.record({
      projectId,
      actorUserId,
      entityType: ActivityEntityType.TASK,
      entityId: afterTask.id,
      entityTitleSnapshot: afterTask.title,
      actionType: ActivityActionType.UPDATED,
      summary: `updated task "${afterTask.title}"`,
      payload,
    });
  }

  async recordTaskDeleted(task: TaskEntity, actorUserId: string): Promise<ActivityEventEntity | null> {
    if (!task.projectId) {
      return null;
    }

    return this.record({
      projectId: task.projectId,
      actorUserId,
      entityType: ActivityEntityType.TASK,
      entityId: task.id,
      entityTitleSnapshot: task.title,
      actionType: ActivityActionType.DELETED,
      summary: `deleted task "${task.title}"`,
      payload: {
        context: {
          status: task.status,
        },
      },
    });
  }

  async recordProjectDocumentCreated(
    document: ProjectDocumentEntity,
    actorUserId: string
  ): Promise<ActivityEventEntity> {
    return this.record({
      projectId: document.projectId,
      actorUserId,
      entityType: ActivityEntityType.PROJECT_DOCUMENT,
      entityId: document.id,
      entityTitleSnapshot: document.title,
      actionType: ActivityActionType.CREATED,
      summary: `created document "${document.title}"`,
      payload: {
        context: {
          position: document.position,
        },
      },
    });
  }

  async recordProjectDocumentUpdated(
    beforeDocument: ProjectDocumentEntity,
    afterDocument: ProjectDocumentEntity,
    actorUserId: string
  ): Promise<ActivityEventEntity | null> {
    const payload = this.buildProjectDocumentUpdatePayload(beforeDocument, afterDocument);
    if (!payload) {
      return null;
    }

    return this.record({
      projectId: afterDocument.projectId,
      actorUserId,
      entityType: ActivityEntityType.PROJECT_DOCUMENT,
      entityId: afterDocument.id,
      entityTitleSnapshot: afterDocument.title,
      actionType: ActivityActionType.UPDATED,
      summary: `updated document "${afterDocument.title}"`,
      payload,
    });
  }

  async recordProjectDocumentDeleted(
    document: ProjectDocumentEntity,
    actorUserId: string
  ): Promise<ActivityEventEntity> {
    return this.record({
      projectId: document.projectId,
      actorUserId,
      entityType: ActivityEntityType.PROJECT_DOCUMENT,
      entityId: document.id,
      entityTitleSnapshot: document.title,
      actionType: ActivityActionType.DELETED,
      summary: `deleted document "${document.title}"`,
      payload: {
        context: {
          position: document.position,
        },
      },
    });
  }

  async getProjectActivities(projectId: string, userId: string): Promise<ActivityEventEntity[]> {
    await this.assertProjectMember(projectId, userId);

    const rows = await db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.projectId, projectId))
      .orderBy(desc(activityEvents.createdAt));

    return rows.map((row) => new ActivityEventEntity({
      id: row.id,
      projectId: row.projectId,
      actorUserId: row.actorUserId,
      actorNameSnapshot: row.actorNameSnapshot,
      entityType: row.entityType as ActivityEntityType,
      entityId: row.entityId,
      entityTitleSnapshot: row.entityTitleSnapshot,
      actionType: row.actionType as ActivityActionType,
      summary: row.summary,
      payload: row.payload as ActivityPayload,
      createdAt: row.createdAt,
    }));
  }

  async getTaskActivities(taskId: string, userId: string): Promise<ActivityEventEntity[]> {
    const [task] = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        createdBy: tasks.createdBy,
        assignedTo: tasks.assignedTo,
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      throw new CustomError('Task not found', ErrorCodes.NOT_FOUND);
    }

    if (task.projectId) {
      await this.assertProjectMember(task.projectId, userId);
    } else if (task.createdBy !== userId && task.assignedTo !== userId) {
      throw new CustomError('Task not found or not accessible', ErrorCodes.UNAUTHORIZED);
    }

    const rows = await db
      .select()
      .from(activityEvents)
      .where(and(eq(activityEvents.entityType, ActivityEntityType.TASK), eq(activityEvents.entityId, taskId)))
      .orderBy(desc(activityEvents.createdAt));

    return rows.map((row) => new ActivityEventEntity({
      id: row.id,
      projectId: row.projectId,
      actorUserId: row.actorUserId,
      actorNameSnapshot: row.actorNameSnapshot,
      entityType: row.entityType as ActivityEntityType,
      entityId: row.entityId,
      entityTitleSnapshot: row.entityTitleSnapshot,
      actionType: row.actionType as ActivityActionType,
      summary: row.summary,
      payload: row.payload as ActivityPayload,
      createdAt: row.createdAt,
    }));
  }
}

export const activityService = new ActivityService();
