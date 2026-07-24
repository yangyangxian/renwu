import { useCallback, useEffect, useRef, useState } from 'react';
import { TaskDueDateFilter, TaskResDto, TaskStatus } from '@fullstack/common';
import { CalendarCheck2, CalendarClock, RefreshCw } from 'lucide-react';
import { getDueDateTasks } from '@/apiRequests/apiEndpoints';
import { apiClient } from '@/utils/APIClient';
import { Button } from '@/components/ui-kit/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui-kit/Dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui-kit/Popover';
import { Skeleton } from '@/components/ui-kit/Skeleton';
import TaskDetail from '@/components/taskspage/TaskDetail';
import { statusColors, statusLabels } from '@/consts/taskStatusConfig';
import {
  formatDueDateLabel,
  getDaysUntilDue,
} from '@/lib/upcomingTasks';

const FILTER_OPTIONS = [
  { value: TaskDueDateFilter.NEXT_3_DAYS, label: 'Next 3 days' },
  { value: TaskDueDateFilter.OVERDUE, label: 'Overdue' },
] as const;

const EMPTY_TASK_GROUPS: Record<TaskDueDateFilter, TaskResDto[]> = {
  [TaskDueDateFilter.NEXT_3_DAYS]: [],
  [TaskDueDateFilter.OVERDUE]: [],
};

export function DueDateTasksPopover() {
  const requestIdRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskResDto | null>(null);
  const [filter, setFilter] = useState<TaskDueDateFilter>(TaskDueDateFilter.NEXT_3_DAYS);
  const [taskGroups, setTaskGroups] = useState<Record<TaskDueDateFilter, TaskResDto[]>>(EMPTY_TASK_GROUPS);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadTasks = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setHasError(false);

    try {
      const [upcomingTasks, overdueTasks] = await Promise.all([
        apiClient.get<TaskResDto[]>(getDueDateTasks(), {
          filter: TaskDueDateFilter.NEXT_3_DAYS,
        }),
        apiClient.get<TaskResDto[]>(getDueDateTasks(), {
          filter: TaskDueDateFilter.OVERDUE,
        }),
      ]);
      if (requestId === requestIdRef.current) {
        setTaskGroups({
          [TaskDueDateFilter.NEXT_3_DAYS]: upcomingTasks,
          [TaskDueDateFilter.OVERDUE]: overdueTasks,
        });
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setTaskGroups(EMPTY_TASK_GROUPS);
        setHasError(true);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      void loadTasks();
    }, 0);

    return () => {
      window.clearTimeout(initialLoadTimer);
      requestIdRef.current += 1;
    };
  }, [loadTasks]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      void loadTasks();
    }
  };

  const tasks = taskGroups[filter];
  const hasReminder = taskGroups[TaskDueDateFilter.NEXT_3_DAYS].length > 0
    || taskGroups[TaskDueDateFilter.OVERDUE].length > 0;
  const isOverdue = filter === TaskDueDateFilter.OVERDUE;

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={hasReminder ? 'Show due date tasks, reminder available' : 'Show due date tasks'}
            title="Due date tasks"
            className="group relative text-white hover:text-foreground"
          >
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
            {hasReminder && (
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"
                aria-hidden="true"
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="flex max-h-[min(32rem,var(--radix-popover-content-available-height))] w-[30rem] max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0"
        >
          <div className="shrink-0 border-b px-4 pb-3 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold leading-none">Due date tasks</h2>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {isOverdue ? 'Past their due date' : 'Due in the next 3 days'}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 rounded-lg bg-muted p-1" aria-label="Due date filter">
              {FILTER_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === option.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setFilter(option.value)}
                  aria-pressed={filter === option.value}
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    {option.label}
                    {option.value === TaskDueDateFilter.OVERDUE
                      && taskGroups[TaskDueDateFilter.OVERDUE].length > 0 && (
                      <span className="min-w-4 rounded-full bg-red-100 px-1 text-[10px] font-semibold leading-4 text-red-700 dark:bg-red-950 dark:text-red-200">
                        {taskGroups[TaskDueDateFilter.OVERDUE].length}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-2 p-1" aria-label="Loading due date tasks">
                {[0, 1, 2].map(item => (
                  <div key={item} className="flex items-center gap-3 rounded-lg p-2">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-4/5" />
                      <Skeleton className="h-3 w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hasError ? (
              <div className="flex flex-col items-center px-6 py-9 text-center">
                <RefreshCw className="mb-3 h-7 w-7 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">Couldn’t load due date tasks</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void loadTasks()}
                >
                  Try again
                </Button>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <div className="mb-3 rounded-full bg-muted p-3">
                  <CalendarCheck2 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium">
                  {isOverdue ? 'No overdue tasks' : 'Nothing due soon'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isOverdue ? 'You’re all caught up.' : 'You’re clear for the next 3 days.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {tasks.map(task => {
                  const dueInDays = getDaysUntilDue(task.dueDate);
                  const dueLabel = formatDueDateLabel(task.dueDate);
                  const urgencyClass = dueInDays !== null && dueInDays <= 0
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200'
                    : dueInDays === 1
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200'
                      : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200';

                  return (
                    <button
                      key={task.id}
                      type="button"
                      className="flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                      onClick={() => {
                        setOpen(false);
                        setSelectedTask(task);
                      }}
                    >
                      <span className={`mt-0.5 rounded-md p-1.5 ${urgencyClass}`}>
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {task.title}
                        </span>
                        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="truncate">{task.projectName || 'Personal'}</span>
                          {task.taskCode && <span aria-hidden="true">·</span>}
                          {task.taskCode && <span className="shrink-0">{task.taskCode}</span>}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-xs font-medium">
                          {dueInDays !== null && dueInDays < 0 ? (
                            <>
                              <span className="font-semibold text-foreground">
                                {Math.abs(dueInDays)}
                              </span>
                              <span className="text-muted-foreground">
                                {' '}day{Math.abs(dueInDays) === 1 ? '' : 's'} overdue
                              </span>
                            </>
                          ) : (
                            <span className="text-foreground">{dueLabel}</span>
                          )}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[task.status as TaskStatus]}`}>
                          {statusLabels[task.status as TaskStatus]}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog
        open={selectedTask !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedTask(null);
            void loadTasks();
          }
        }}
      >
        {selectedTask && (
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-6xl">
            <DialogTitle className="sr-only">Task details</DialogTitle>
            <TaskDetail
              key={selectedTask.id}
              taskId={selectedTask.id}
              previewTask={selectedTask}
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
