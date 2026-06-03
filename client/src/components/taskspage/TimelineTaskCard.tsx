import { useState } from 'react';

import { PermissionAction, PermissionResourceType, TaskStatus, type TaskResDto } from '@fullstack/common';
import { CalendarClock, FolderKanban, Trash2, User } from 'lucide-react';

import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import LabelBadge from '@/components/common/LabelBadge';
import { getTaskCardTaskLink } from '@/components/taskspage/TaskCard';
import { Button } from '@/components/ui-kit/Button';
import { Card } from '@/components/ui-kit/Card';
import { useAuth } from '@/providers/AuthProvider';
import { usePermissionStore } from '@/stores/usePermissionStore';
import { formatDateSmart } from '@/utils/dateUtils';
import { getTimelineExcerpt } from '@/lib/timelineViewModel';

const statusLabelMap: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'Todo',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
  [TaskStatus.CLOSE]: 'Closed',
};

const statusClassMap: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  [TaskStatus.IN_PROGRESS]: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200',
  [TaskStatus.DONE]: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
  [TaskStatus.CLOSE]: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
};

interface TimelineTaskCardProps {
  task: TaskResDto;
  onClick: () => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  showAssignedTo?: boolean;
  showProjectName?: boolean;
}

export default function TimelineTaskCard({
  task,
  onClick,
  onDeleteTask,
  showAssignedTo = false,
  showProjectName = true,
}: TimelineTaskCardProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissionStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const taskLink = task.taskCode ? getTaskCardTaskLink(task.id, task.taskCode) : null;
  const canDeleteTask = Boolean(user?.id) && hasPermission(PermissionAction.DELETE_OTHERS_TASK, {
    resourceType: PermissionResourceType.TASK,
    loggedUserId: user?.id!,
    projectId: task.projectId ?? '',
    assignedUserId: task.assignedTo?.id ?? '',
  });

  return (
    <div className="group relative">
      {canDeleteTask && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 z-20 size-8 shrink-0 rounded-full bg-white/80 text-muted-foreground opacity-0 transition-opacity duration-150 hover:bg-red-100 hover:text-red-500 focus:opacity-100 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto focus:pointer-events-auto focus-visible:pointer-events-auto dark:bg-black/60 dark:hover:bg-red-900"
          style={{ width: 24, height: 24, minWidth: 0 }}
          aria-label="Delete task"
          title="Delete task"
          data-timeline-task-delete-trigger="true"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            setDialogOpen(true);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}

      <Card
        className="cursor-pointer overflow-hidden border border-border/70 bg-background/95 p-0 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        onClick={onClick}
        tabIndex={0}
        aria-label={task.title}
      >
        {task.previewImageUrl ? (
          <div className="aspect-video overflow-hidden bg-muted">
            <img
              src={task.previewImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              {taskLink && (
                <a
                  href={taskLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={taskLink.ariaLabel}
                  className="w-fit shrink-0 text-sm font-medium text-foreground/80 underline underline-offset-3 transition-colors hover:text-foreground"
                  onClick={(event) => event.stopPropagation()}
                >
                  {taskLink.text}
                </a>
              )}
              <h3 className="text-base font-semibold leading-tight text-foreground">
                {task.title}
              </h3>
            </div>
            <div className={`flex items-center gap-2 ${canDeleteTask ? 'pr-10' : ''}`}>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClassMap[task.status]}`}>
                {statusLabelMap[task.status]}
              </span>
            </div>
          </div>

          <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
            {getTimelineExcerpt(task.description)}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {showProjectName && (
              <span className="inline-flex items-center gap-1">
                <FolderKanban className="h-3.5 w-3.5" />
                {task.projectName || 'Personal'}
              </span>
            )}
            {showAssignedTo && task.assignedTo?.name && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {task.assignedTo.name}
              </span>
            )}
            {task.dueDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                Due {formatDateSmart(task.dueDate)}
              </span>
            )}
          </div>

          {!!task.labels?.length && (
            <div className="flex flex-wrap gap-1.5">
              {task.labels
                .filter((label) => label && (label.labelName || label.name))
                .map((label) => (
                  <LabelBadge
                    key={label.id}
                    text={(label.labelName || label.name) as string}
                    color={label.color ?? label.labelColor}
                    className="px-2 py-0.5 text-[11px]"
                  />
                ))}
            </div>
          )}
        </div>
      </Card>

      <ConfirmDeleteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Delete Task?"
        description="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={() => {
          setDialogOpen(false);
          void onDeleteTask(task.id);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}