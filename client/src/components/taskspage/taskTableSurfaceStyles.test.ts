import { describe, expect, it } from 'vitest';

import {
  getTaskTableCardClassName,
  getTaskTableGroupByCardClassName,
  getTaskTableGroupByTriggerClassName,
} from './taskTableSurfaceStyles';

describe('taskTableSurfaceStyles', () => {
  it('uses the same darker dark-mode muted surface for the group-by card as the description editor', () => {
    const className = getTaskTableGroupByCardClassName();

    expect(className).toMatch(/bg-muted\/40/);
    expect(className).toMatch(/dark:bg-muted\/65/);
    expect(className).not.toMatch(/bg-background/);
  });

  it('keeps the table card on the darker dark-mode muted surface', () => {
    const className = getTaskTableCardClassName();

    expect(className).toMatch(/bg-muted\/40/);
    expect(className).toMatch(/dark:bg-muted\/65/);
    expect(className).not.toMatch(/bg-background/);
  });

  it('uses a brighter foreground color for the selected group-by label set in dark mode', () => {
    const className = getTaskTableGroupByTriggerClassName();

    expect(className).toMatch(/text-foreground/);
    expect(className).toMatch(/dark:text-white/);
  });
});