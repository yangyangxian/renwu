import { describe, expect, it } from 'vitest';

import { getTaskCardTaskLink } from './TaskCard';

describe('TaskCard task link', () => {
  it('builds a new-tab task page link from task id and task code', () => {
    expect(getTaskCardTaskLink('task/123', 'abc-12')).toEqual({
      href: '/task/task%2F123',
      text: 'ABC-12',
      ariaLabel: 'Open ABC-12 task page',
    });
  });
});