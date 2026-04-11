import { describe, expect, it } from 'vitest';

import {
  getTaskDetailIconButtonClassName,
  getTaskDetailIconClassName,
} from './taskDetailStyles';

describe('taskDetailStyles', () => {
  it('uses a clearly brighter but still not pure-white dark-mode color for detail field icons', () => {
    const className = getTaskDetailIconClassName();

    expect(className).toMatch(/text-muted-foreground/);
    expect(className).toMatch(/dark:text-slate-200/);
    expect(className).not.toMatch(/dark:text-white/);
  });

  it('keeps edit icon buttons on the same brighter dark-mode icon tone without heavy dimming', () => {
    const className = getTaskDetailIconButtonClassName();

    expect(className).toMatch(/text-muted-foreground/);
    expect(className).toMatch(/dark:text-slate-200/);
    expect(className).toMatch(/opacity-90/);
    expect(className).not.toMatch(/dark:text-white/);
  });
});