import { describe, expect, it } from 'vitest';

import {
  getDefaultTaskTableColumnWidths,
  getTaskTableGridTemplateColumns,
} from './taskTableColumnSizing';

describe('taskTableColumnSizing layout', () => {
  it('places task number first, assignee after status, and removes updated date', () => {
    expect(
      getTaskTableGridTemplateColumns(getDefaultTaskTableColumnWidths(), { titleAutoWidth: true })
    ).toBe('120px minmax(560px, 700px) 170px 170px 116px');
  });
});