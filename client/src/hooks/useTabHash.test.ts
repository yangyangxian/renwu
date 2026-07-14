import test from 'node:test';
import assert from 'node:assert/strict';

import { TaskViewMode } from '@fullstack/common';

import { resolveTabValue } from './useTabHash';

const taskViewModes = [
  TaskViewMode.BOARD,
  TaskViewMode.LIST,
  TaskViewMode.TABLE,
  TaskViewMode.TIMELINE,
];

test('controlled saved view mode wins over a stale hash from the previous route', () => {
  const resolved = resolveTabValue(
    taskViewModes,
    TaskViewMode.TABLE,
    '#board',
    TaskViewMode.TABLE
  );

  assert.equal(resolved, TaskViewMode.TABLE);
});

test('uncontrolled tabs still read a valid hash', () => {
  const resolved = resolveTabValue(
    taskViewModes,
    TaskViewMode.BOARD,
    '#table'
  );

  assert.equal(resolved, TaskViewMode.TABLE);
});
