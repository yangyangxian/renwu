import { describe, expect, it } from 'vitest';
import { formatDueDateLabel, getDaysUntilDue } from './upcomingTasks';

const NOW = new Date(2026, 6, 22, 15, 30);

describe('upcoming task due date labels', () => {
  it('treats date-only values as local calendar dates', () => {
    expect(getDaysUntilDue('2026-07-22', NOW)).toBe(0);
    expect(getDaysUntilDue('2026-07-23', NOW)).toBe(1);
    expect(getDaysUntilDue('2026-07-28', NOW)).toBe(6);
  });

  it('uses concise labels for upcoming and overdue dates', () => {
    expect(formatDueDateLabel('2026-07-20', NOW)).toBe('2 days overdue');
    expect(formatDueDateLabel('2026-07-21', NOW)).toBe('1 day overdue');
    expect(formatDueDateLabel('2026-07-22', NOW)).toBe('Today');
    expect(formatDueDateLabel('2026-07-23', NOW)).toBe('Tomorrow');
    expect(formatDueDateLabel('2026-07-25', NOW)).toBe('In 3 days');
  });
});
