import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, CalendarDayButton } from '@/components/ui-kit/Calendar';
import { Card } from '@/components/ui-kit/Card';
import {
  buildTimelineDateCounts,
  buildTimelineGroups,
  buildTimelineMonths,
  parseTimelineDateKey,
  resolveTimelineSelectedDateKey,
  toTimelineDateKey,
} from '@/lib/timelineViewModel';
import type { TaskResDto } from '@fullstack/common';
import { CalendarRange } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-kit/Tooltip';
import TimelineTaskCard from './TimelineTaskCard';

interface TimelineViewProps {
  tasks: TaskResDto[];
  onTaskClick: (taskId: string) => void;
  showAssignedTo?: boolean;
  showProjectName?: boolean;
}

function formatWeekday(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
  });
}

export function shouldShowTimelineSelectedDay({
  selected,
  outside,
}: {
  selected: boolean;
  outside: boolean;
}) {
  return selected && !outside;
}

export default function TimelineView({
  tasks,
  onTaskClick,
  showAssignedTo = false,
  showProjectName = true,
}: TimelineViewProps) {
  const groups = useMemo(() => buildTimelineGroups(tasks), [tasks]);
  const dateCounts = useMemo(() => buildTimelineDateCounts(tasks), [tasks]);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    resolveTimelineSelectedDateKey(undefined, groups.map((group) => group.dateKey), toTimelineDateKey(new Date()))
  );
  const leftRailRef = useRef<HTMLDivElement | null>(null);
  const rightRailRef = useRef<HTMLDivElement | null>(null);
  const emptyStateRef = useRef<HTMLElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const shouldAutoScrollToSelectedRef = useRef(true);

  useEffect(() => {
    setSelectedDateKey((current) =>
      resolveTimelineSelectedDateKey(current, groups.map((group) => group.dateKey), toTimelineDateKey(new Date()))
    );
    shouldAutoScrollToSelectedRef.current = true;
  }, [groups]);

  const monthDateKeys = useMemo(() => {
    const keys = groups.map((group) => group.dateKey);
    if (!keys.includes(selectedDateKey)) {
      keys.push(selectedDateKey);
    }
    return keys;
  }, [groups, selectedDateKey]);

  const months = useMemo(() => buildTimelineMonths(monthDateKeys), [monthDateKeys]);
  const selectedDate = useMemo(() => parseTimelineDateKey(selectedDateKey), [selectedDateKey]);
  const entryDateSet = useMemo(() => new Set(groups.map((group) => group.dateKey)), [groups]);
  const entryDates = useMemo(() => groups.map((group) => group.date), [groups]);
  const missingSelectedDate = !entryDateSet.has(selectedDateKey);

  useEffect(() => {
    const container = leftRailRef.current;
    if (!container) {
      return;
    }

    let frame = 0;
    const syncSelectedDate = () => {
      frame = 0;
      const sections = [
        ...(missingSelectedDate && emptyStateRef.current
          ? [{ dateKey: selectedDateKey, node: emptyStateRef.current }]
          : []),
        ...groups
          .map((group) => {
            const node = sectionRefs.current[group.dateKey];
            return node ? { dateKey: group.dateKey, node } : null;
          })
          .filter((entry): entry is { dateKey: string; node: HTMLDivElement } => entry !== null),
      ]
        .map((entry) => ({
          dateKey: entry.dateKey,
          offsetTop: entry.node.offsetTop,
          offsetBottom: entry.node.offsetTop + entry.node.offsetHeight,
        }))
        .sort((a, b) => a.offsetTop - b.offsetTop);

      if (sections.length === 0) {
        return;
      }

      // Use a near-top anchor and section bottoms to avoid stale highlights
      // when a whole date section has already scrolled out of view.
      const anchor = container.scrollTop + 200;
      const currentSection = sections.find((entry) => entry.offsetBottom > anchor) ?? sections[sections.length - 1];
      const currentDateKey = currentSection.dateKey;

      setSelectedDateKey((previous) => previous === currentDateKey ? previous : currentDateKey);
    };

    const handleScroll = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(syncSelectedDate);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [groups, missingSelectedDate, selectedDateKey]);

  useEffect(() => {
    if (!shouldAutoScrollToSelectedRef.current) {
      return;
    }

    const target = sectionRefs.current[selectedDateKey] ?? (missingSelectedDate ? emptyStateRef.current : null);
    if (!target) {
      return;
    }

    shouldAutoScrollToSelectedRef.current = false;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  }, [missingSelectedDate, selectedDateKey]);

  useEffect(() => {
    const monthKey = selectedDateKey.slice(0, 7);
    const monthCard = monthRefs.current[monthKey];
    const rightRail = rightRailRef.current;
    if (!monthCard || !rightRail) {
      return;
    }

    requestAnimationFrame(() => {
      monthCard.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    });
  }, [selectedDateKey]);

  const scrollToDateKey = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    const target = sectionRefs.current[dateKey] ?? (dateKey === selectedDateKey ? emptyStateRef.current : null);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (dateKey !== selectedDateKey && !entryDateSet.has(dateKey)) {
      requestAnimationFrame(() => {
        emptyStateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const renderTimelineDayButton = (props: React.ComponentProps<typeof CalendarDayButton>) => {
    const dateKey = toTimelineDateKey(props.day.date);
    const taskCount = dateCounts.get(dateKey) ?? 0;
    const showSelectedState = shouldShowTimelineSelectedDay({
      selected: Boolean(props.modifiers.selected),
      outside: Boolean(props.modifiers.outside),
    });
    const dayButtonClassName = [
      'relative',
      'gap-0',
      'pt-0',
      'pb-0.5',
      'text-[14px]',
      'leading-none',
      !showSelectedState && props.modifiers.selected
        ? 'data-[selected-single=true]:bg-transparent data-[selected-single=true]:text-muted-foreground data-[selected-single=true]:hover:bg-accent/50'
        : null,
      props.className,
    ].filter(Boolean).join(' ');
    const button = (
      <CalendarDayButton
        {...props}
        title={taskCount > 0 ? `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'} on ${dateKey}` : undefined}
        className={dayButtonClassName}
      >
        {props.children}
        {taskCount > 0 ? (
          <span className="pointer-events-none absolute bottom-1.25 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-500 shadow-[0_0_0_1px_rgba(255,255,255,0.75)] dark:shadow-[0_0_0_1px_rgba(10,10,10,0.9)]" />
        ) : null}
      </CalendarDayButton>
    );

    if (taskCount === 0) {
      return button;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="contents">{button}</span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" sideOffset={6}>
          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1.5fr)_28rem] xl:grid-cols-[minmax(0,1.45fr)_30rem]">
      <div
        ref={leftRailRef}
        className="gradient-scroll-area-scrollbar min-h-0 overflow-y-auto pr-2"
      >
        {groups.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-border/80 bg-background/80 p-8 text-center text-sm text-muted-foreground shadow-none">
            No tasks match the current filters.
          </Card>
        ) : null}

        {missingSelectedDate ? (
          <section
            ref={emptyStateRef}
            className="mb-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary/70" />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="text-base font-semibold tabular-nums dark:text-muted-foreground">{selectedDateKey}</h3>
                  <span className="text-sm font-medium text-muted-foreground dark:text-foreground">{formatWeekday(selectedDate)}</span>
                </div>
              </div>
            </div>
            <div className="relative ml-2 mt-3 border-l border-dashed border-border/70 pl-6">
              <Card className="rounded-3xl border border-dashed border-border/80 bg-background/80 p-5 text-sm text-muted-foreground shadow-none">
                No entries were created on this day. You can use this date as a jump target and add the first record from here.
              </Card>
            </div>
          </section>
        ) : null}

        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.dateKey}
              ref={(node) => {
                sectionRefs.current[group.dateKey] = node;
              }}
              className="scroll-mt-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary/70" />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="text-base font-semibold tabular-nums dark:text-muted-foreground">{group.dateKey}</h3>
                    <span className="text-sm font-medium text-muted-foreground dark:text-foreground">{formatWeekday(group.date)}</span>
                  </div>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {group.tasks.length} {group.tasks.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>

              <div className="relative ml-2 border-l border-border/70 pl-6">
                <div className="space-y-4">
                {group.tasks.map((task) => (
                  <TimelineTaskCard
                    key={task.id}
                    task={task}
                    showAssignedTo={showAssignedTo}
                    showProjectName={showProjectName}
                    onClick={() => onTaskClick(task.id)}
                  />
                ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div ref={rightRailRef} className="gradient-scroll-area-scrollbar min-h-0 w-fit max-w-full justify-self-start overflow-y-auto pl-1 pr-2">
        <div className="mb-3 flex items-center gap-2 px-0 py-1 text-sm font-medium text-foreground">
          <CalendarRange className="h-4 w-4 text-primary" />
          Timeline Calendar
        </div>

        <div className="space-y-3">
          {months.map((month) => (
            <Card
              key={month.key}
              ref={(node) => {
                monthRefs.current[month.key] = node;
              }}
              className="w-fit max-w-full rounded-3xl border border-border/70 bg-background/90 px-3.5 py-3 shadow-xs"
            >
              <Calendar
                mode="single"
                month={month.date}
                selected={selectedDate}
                onSelect={(date) => {
                  if (!date) {
                    return;
                  }

                  scrollToDateKey(toTimelineDateKey(date));
                }}
                hideNavigation
                fixedWeeks
                showOutsideDays
                modifiers={{
                  hasEntries: entryDates,
                }}
                modifiersClassNames={{
                  hasEntries: 'font-semibold text-primary',
                }}
                className="rounded-2xl bg-transparent p-0"
                classNames={{
                  root: 'w-auto px-0',
                  months: 'flex w-auto flex-col',
                  month: 'w-auto gap-3 px-0',
                  month_caption: 'justify-start px-0 text-left h-auto mb-4',
                  caption_label: 'text-[13px] font-semibold',
                  month_grid: 'mx-auto w-auto border-collapse',
                  weekdays: 'w-auto',
                  weeks: 'w-auto',
                  week: 'w-auto',
                  weekday: 'w-10 px-0 text-center text-[10px] uppercase tracking-[0.1em]',
                  day: 'p-0 text-center align-middle',
                  day_button: 'mx-auto h-10 w-11 min-w-10',
                }}
                components={{
                  DayButton: renderTimelineDayButton,
                }}
              />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}