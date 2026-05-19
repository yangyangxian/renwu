import test from 'node:test';
import assert from 'node:assert/strict';

import { TaskViewMode } from '@fullstack/common';
import { Kanban, List, Table2 } from 'lucide-react';

import { TASK_VIEW_MODE_ORDER, getTaskViewModeMeta } from './taskViewModeMeta';

test('task view mode metadata preserves the existing tab order', () => {
  assert.deepEqual(TASK_VIEW_MODE_ORDER, [
    TaskViewMode.BOARD,
    TaskViewMode.LIST,
    TaskViewMode.TABLE,
  ]);
});

test('task view mode metadata exposes the tab labels and icons', () => {
  assert.deepEqual(getTaskViewModeMeta(TaskViewMode.BOARD), {
    label: 'Board',
    icon: Kanban,
  });
  assert.deepEqual(getTaskViewModeMeta(TaskViewMode.LIST), {
    label: 'List',
    icon: List,
  });
  assert.deepEqual(getTaskViewModeMeta(TaskViewMode.TABLE), {
    label: 'Table',
    icon: Table2,
  });
});