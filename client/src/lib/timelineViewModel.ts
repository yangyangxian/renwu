import type { TaskResDto } from '@fullstack/common';

export interface TimelineGroup {
  dateKey: string;
  date: Date;
  tasks: TaskResDto[];
}

export interface TimelineMonth {
  key: string;
  date: Date;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function toTimelineDateKey(value: Date | string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseTimelineDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function buildTimelineGroups(tasks: TaskResDto[]): TimelineGroup[] {
  const sortedTasks = [...tasks].sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  const groups: TimelineGroup[] = [];
  for (const task of sortedTasks) {
    const dateKey = toTimelineDateKey(task.createdAt);
    const existingGroup = groups[groups.length - 1];

    if (existingGroup?.dateKey === dateKey) {
      existingGroup.tasks.push(task);
      continue;
    }

    groups.push({
      dateKey,
      date: parseTimelineDateKey(dateKey),
      tasks: [task],
    });
  }

  return groups;
}

export function buildTimelineDateCounts(tasks: TaskResDto[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const task of tasks) {
    const dateKey = toTimelineDateKey(task.createdAt);
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  }

  return counts;
}

export function resolveTimelineSelectedDateKey(
  currentSelectedDateKey: string | null | undefined,
  availableDateKeys: string[],
  fallbackDateKey: string,
): string | null {
  if (currentSelectedDateKey && availableDateKeys.includes(currentSelectedDateKey)) {
    return currentSelectedDateKey;
  }

  if (availableDateKeys.length === 0) {
    return null;
  }

  const fallbackTime = parseTimelineDateKey(fallbackDateKey).getTime();

  return [...availableDateKeys].sort((left, right) => {
    const leftTime = parseTimelineDateKey(left).getTime();
    const rightTime = parseTimelineDateKey(right).getTime();
    const leftDistance = Math.abs(leftTime - fallbackTime);
    const rightDistance = Math.abs(rightTime - fallbackTime);

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    return rightTime - leftTime;
  })[0] ?? null;
}

export function buildTimelineMonths(dateKeys: string[]): TimelineMonth[] {
  if (dateKeys.length === 0) {
    const today = new Date();
    return [{
      key: `${today.getFullYear()}-${pad(today.getMonth() + 1)}`,
      date: new Date(today.getFullYear(), today.getMonth(), 1),
    }];
  }

  const sortedDates = [...dateKeys].map(parseTimelineDateKey).sort((left, right) => left.getTime() - right.getTime());
  const current = new Date(sortedDates[0].getFullYear(), sortedDates[0].getMonth(), 1);
  const end = new Date(sortedDates[sortedDates.length - 1].getFullYear(), sortedDates[sortedDates.length - 1].getMonth(), 1);
  const months: TimelineMonth[] = [];

  while (current.getTime() <= end.getTime()) {
    months.push({
      key: `${current.getFullYear()}-${pad(current.getMonth() + 1)}`,
      date: new Date(current.getFullYear(), current.getMonth(), 1),
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

export function getTimelineExcerpt(markdown: string | null | undefined): string {
  if (!markdown) {
    return 'No description yet.';
  }

  const excerpt = markdown
    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, ' ')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[`#>*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!excerpt) {
    return 'No description yet.';
  }

  return excerpt.length > 160 ? `${excerpt.slice(0, 157).trimEnd()}...` : excerpt;
}