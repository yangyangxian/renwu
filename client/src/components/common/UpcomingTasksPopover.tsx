import { useRef, useState } from 'react';
import { TaskResDto, TaskStatus } from '@fullstack/common';
import { CalendarCheck2, CalendarClock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUpcomingTasks } from '@/apiRequests/apiEndpoints';
import { apiClient } from '@/utils/APIClient';
import { Button } from '@/components/ui-kit/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui-kit/Popover';
import { Skeleton } from '@/components/ui-kit/Skeleton';
import { statusColors, statusLabels } from '@/consts/taskStatusConfig';
import {
  formatUpcomingDueLabel,
  getDaysUntilDue,
  type UpcomingTaskRangeDays,
} from '@/lib/upcomingTasks';

const RANGE_OPTIONS: UpcomingTaskRangeDays[] = [3, 7];

export function UpcomingTasksPopover() {
  const navigate = useNavigate();
  const requestIdRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<UpcomingTaskRangeDays>(3);
  const [tasks, setTasks] = useState<TaskResDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadTasks = async (nextDays: UpcomingTaskRangeDays) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setHasError(false);

    try {
      const upcomingTasks = await apiClient.get<TaskResDto[]>(getUpcomingTasks(), {
        days: String(nextDays),
      });
      if (requestId === requestIdRef.current) {
        setTasks(upcomingTasks);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setTasks([]);
        setHasError(true);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      void loadTasks(days);
    }
  };

  const handleRangeChange = (nextDays: UpcomingTaskRangeDays) => {
    if (nextDays === days) return;
    setDays(nextDays);
    void loadTasks(nextDays);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Show upcoming tasks"
          title="Upcoming tasks"
          className="group text-white hover:text-foreground"
        >
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[22rem] overflow-hidden p-0">
        <div className="border-b px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold leading-none">Upcoming tasks</h2>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Due in the next {days} days
              </p>
            </div>
            {!loading && !hasError && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-200">
                {tasks.length}
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 rounded-lg bg-muted p-1" aria-label="Due date range">
            {RANGE_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === option
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => handleRangeChange(option)}
                aria-pressed={days === option}
              >
                Next {option} days
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[22rem] overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-1" aria-label="Loading upcoming tasks">
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
              <p className="text-sm font-medium">Couldn’t load upcoming tasks</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void loadTasks(days)}
              >
                Try again
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <CalendarCheck2 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium">Nothing due soon</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You’re clear for the next {days} days.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {tasks.map(task => {
                const dueInDays = getDaysUntilDue(task.dueDate);
                const dueLabel = formatUpcomingDueLabel(task.dueDate);
                const urgencyClass = dueInDays === 0
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200'
                  : dueInDays === 1
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200'
                    : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200';

                return (
                  <button
                    key={task.id}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    onClick={() => {
                      setOpen(false);
                      navigate(`/task/${task.id}`);
                    }}
                  >
                    <span className={`mt-0.5 rounded-lg p-2 ${urgencyClass}`}>
                      <CalendarClock className="h-4 w-4" aria-hidden="true" />
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
                      <span className="text-xs font-medium text-foreground">{dueLabel}</span>
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
  );
}
