import { describe, expect, it } from 'vitest';

import {
  getDefaultTaskTableColumnWidths,
  getTaskTableGridTemplateColumns,
} from './taskTableColumnSizing';

describe('taskTableColumnSizing layout', () => {
  it('places the assignee column before title while keeping the same width rules', () => {
    expect(
      getTaskTableGridTemplateColumns(getDefaultTaskTableColumnWidths(), { titleAutoWidth: true })
    ).toBe('170px minmax(560px, 700px) 170px 190px 104px');
  });
});