import React from 'react';
import { ActivityActionType, ActivityEntityType, ActivityResDto, TaskStatus } from '@fullstack/common';
import { Avatar, AvatarFallback } from '@/components/ui-kit/Avatar';
import { Card } from '@/components/ui-kit/Card';
import { TASK_STATUS_CONFIG } from './taskStatusConfig';

interface ProjectActivityCardProps {
  activities: ActivityResDto[];
  loading?: boolean;
  error?: string | null;
  className?: string;
}

type ActivityChange = {
  field: string;
  before?: unknown;
  after?: unknown;
};

function titleOrFallback(activity: ActivityResDto, fallback: string) {
  return activity.entityTitleSnapshot?.trim() || fallback;
}

function findChange(activity: ActivityResDto, field: string): ActivityChange | undefined {
  const changes = Array.isArray(activity.payload?.changes)
    ? (activity.payload.changes as ActivityChange[])
    : [];

  return changes.find((change) => change.field === field);
}

function toSentenceCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatStatusValue(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    return 'Unknown';
  }

  const status = value as TaskStatus;
  return TASK_STATUS_CONFIG[status]?.label || toSentenceCase(value);
}

function getStatusBadgeClass(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    return 'bg-muted text-muted-foreground';
  }

  const status = value as TaskStatus;
  return TASK_STATUS_CONFIG[status]?.dotClass || 'bg-muted text-muted-foreground';
}

function formatDateValue(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    return 'No date';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString();
}

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return '';
  }

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (deltaSeconds < 60) {
    return 'Just now';
  }
  if (deltaSeconds < 3600) {
    const minutes = Math.floor(deltaSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (deltaSeconds < 86400) {
    const hours = Math.floor(deltaSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (deltaSeconds < 604800) {
    const days = Math.floor(deltaSeconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return new Date(value).toLocaleDateString();
}

function buildActivityMessage(activity: ActivityResDto): React.ReactNode {
  const taskTitle = titleOrFallback(activity, 'Untitled task');
  const documentTitle = titleOrFallback(activity, 'Untitled document');
  const statusChange = findChange(activity, 'status');
  const assigneeChange = findChange(activity, 'assignedTo');
  const dueDateChange = findChange(activity, 'dueDate');
  const labelChange = findChange(activity, 'labels');
  const titleChange = findChange(activity, 'title');
  const contentChange = findChange(activity, 'content');

  if (activity.entityType === ActivityEntityType.PROJECT_DOCUMENT) {
    if (activity.actionType === ActivityActionType.CREATED) {
      return `created document "${documentTitle}".`;
    }

    if (activity.actionType === ActivityActionType.DELETED) {
      return `deleted document "${documentTitle}".`;
    }

    if (titleChange) {
      return `renamed document from "${String(titleChange.before || 'Untitled document')}" to "${String(titleChange.after || documentTitle)}".`;
    }

    if (contentChange) {
      return `updated document "${documentTitle}".`;
    }

    return `updated document "${documentTitle}".`;
  }

  if (activity.entityType === ActivityEntityType.TASK) {
    if (activity.actionType === ActivityActionType.CREATED) {
      return `created task "${taskTitle}".`;
    }

    if (activity.actionType === ActivityActionType.DELETED) {
      return `deleted task "${taskTitle}".`;
    }

    if (statusChange) {
      return (
        <>
          updated task "{taskTitle}" status from{' '}
          <span className={`inline-flex items-center rounded-full px-1.5 py-[3px] text-[10px] leading-none font-semibold text-white align-middle ${getStatusBadgeClass(statusChange.before)}`}>
            {formatStatusValue(statusChange.before)}
          </span>{' '}
          to{' '}
          <span className={`inline-flex items-center rounded-full px-1.5 py-[3px] text-[10px] leading-none font-semibold text-white align-middle ${getStatusBadgeClass(statusChange.after)}`}>
            {formatStatusValue(statusChange.after)}
          </span>
          .
        </>
      );
    }

    if (assigneeChange) {
      return `reassigned task "${taskTitle}" from ${String(assigneeChange.before || 'Unassigned')} to ${String(assigneeChange.after || 'Unassigned')}.`;
    }

    if (dueDateChange) {
      return `updated task "${taskTitle}" due date from ${formatDateValue(dueDateChange.before)} to ${formatDateValue(dueDateChange.after)}.`;
    }

    if (labelChange) {
      return `updated labels on task "${taskTitle}".`;
    }

    if (titleChange) {
      return `renamed task from "${String(titleChange.before || 'Untitled task')}" to "${String(titleChange.after || taskTitle)}".`;
    }

    return `updated task "${taskTitle}".`;
  }

  return activity.summary || 'updated this project.';
}

export const ProjectActivityCard: React.FC<ProjectActivityCardProps> = ({
  activities,
  loading = false,
  error = null,
  className,
}) => {
  return (
    <Card className={`flex min-h-0 flex-1 flex-col overflow-hidden ${className ? ` ${className}` : ''}`}>
      <div className="px-1 font-bold text-md">Project Activity</div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Loading activity…</div>
        ) : error ? (
          <div className="py-4 text-center text-sm text-muted-foreground">{error}</div>
        ) : activities.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Project activity will appear here.</div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-white-black px-3 py-3"
            >
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-sm font-semibold text-primary">
                  {(activity.actorNameSnapshot || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-5 text-foreground">
                  <span className="font-medium">{activity.actorNameSnapshot || 'Someone'}</span>{' '}
                  <span className="text-muted-foreground">{buildActivityMessage(activity)}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(activity.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
