export type UpcomingTaskRangeDays = 3 | 7;

function toLocalDate(dateValue: string | Date): Date | null {
  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : new Date(dateValue);
  }

  const dateOnlyMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDaysUntilDue(dueDate: string | Date, now: Date = new Date()): number | null {
  const due = toLocalDate(dueDate);
  if (!due) {
    return null;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function formatUpcomingDueLabel(dueDate: string | Date, now: Date = new Date()): string {
  const daysUntilDue = getDaysUntilDue(dueDate, now);

  if (daysUntilDue === null) return 'Due date unavailable';
  if (daysUntilDue === 0) return 'Today';
  if (daysUntilDue === 1) return 'Tomorrow';
  return `In ${daysUntilDue} days`;
}
