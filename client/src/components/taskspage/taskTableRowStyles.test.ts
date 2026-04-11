import { describe, expect, it } from 'vitest';

import {
  getEditableTaskTableRowClassName,
  getTaskTableDetailButtonClassName,
} from './taskTableRowStyles';

describe('taskTableRowStyles', () => {
  it('keeps row backgrounds transparent so the table surface remains visible', () => {
    const className = getEditableTaskTableRowClassName();

    expect(className).toMatch(/bg-transparent/);
    expect(className).not.toMatch(/bg-background/);
  });

  it('keeps a subtle hover surface without reintroducing a solid dark row background', () => {
    const className = getEditableTaskTableRowClassName();

    expect(className).toMatch(/hover:bg-muted\/30/);
    expect(className).not.toMatch(/dark:hover:bg-background/);
  });

  it('uses a brighter dark-mode color for the row detail icon button', () => {
    const className = getTaskTableDetailButtonClassName();

    expect(className).toMatch(/text-muted-foreground/);
    expect(className).toMatch(/dark:text-slate-200/);
    expect(className).toMatch(/opacity-90/);
    expect(className).not.toMatch(/opacity-60/);
  });
});