import { ActivityActionType } from '../enums/activityActionType.js';
import { ActivityEntityType } from '../enums/activityEntityType.js';

export class ActivityChangeDto {
  field: string = '';
  before?: unknown;
  after?: unknown;
}

export class ActivityPayloadDto {
  changes?: ActivityChangeDto[] = [];
  context?: Record<string, unknown>;
}

export class ActivityResDto {
  id: string = '';
  projectId: string = '';
  actorUserId: string | null = null;
  actorNameSnapshot: string = '';
  entityType: ActivityEntityType = ActivityEntityType.PROJECT;
  entityId: string = '';
  entityTitleSnapshot: string | null = null;
  actionType: ActivityActionType = ActivityActionType.UPDATED;
  summary: string = '';
  payload: ActivityPayloadDto = new ActivityPayloadDto();
  createdAt: string = '';
}
