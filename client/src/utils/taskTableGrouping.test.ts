import test from 'node:test';
import assert from 'node:assert/strict';

import { createTaskTableSections } from './taskTableGrouping';

test('createTaskTableSections returns a single flat section when no label set is selected', () => {
  const sections = createTaskTableSections({
    tasks: [
      { id: 'task-1', labels: [{ id: 'label-a', labelName: 'A' }] },
      { id: 'task-2', labels: [] },
    ],
    labelSet: null,
  });

  assert.deepEqual(sections, [
    {
      key: 'all-tasks',
      title: null,
      taskIds: ['task-1', 'task-2'],
      isUngrouped: true,
    },
  ]);
});

test('createTaskTableSections groups tasks by label-set labels and leaves unmatched tasks in Unassigned', () => {
  const sections = createTaskTableSections({
    tasks: [
      { id: 'task-1', labels: [{ id: 'sprint-1', labelName: 'Sprint 1' }] },
      { id: 'task-2', labels: [{ id: 'sprint-2', labelName: 'Sprint 2' }] },
      { id: 'task-3', labels: [] },
      { id: 'task-4', labels: [{ id: 'priority-high', labelName: 'High' }] },
    ],
    labelSet: {
      id: 'set-sprint',
      name: 'Sprint',
      labels: [
        { id: 'sprint-1', name: 'Sprint 1' },
        { id: 'sprint-2', name: 'Sprint 2' },
      ],
    },
  });

  assert.deepEqual(sections, [
    {
      key: 'label:sprint-1',
      title: 'Sprint 1',
      taskIds: ['task-1'],
      isUngrouped: false,
    },
    {
      key: 'label:sprint-2',
      title: 'Sprint 2',
      taskIds: ['task-2'],
      isUngrouped: false,
    },
    {
      key: 'unassigned',
      title: 'Unassigned',
      taskIds: ['task-3', 'task-4'],
      isUngrouped: false,
    },
  ]);
});

test('createTaskTableSections keeps empty label sections so every label can render as a titled table section', () => {
  const sections = createTaskTableSections({
    tasks: [{ id: 'task-2', labels: [{ id: 'sprint-2', labelName: 'Sprint 2' }] }],
    labelSet: {
      id: 'set-sprint',
      name: 'Sprint',
      labels: [
        { id: 'sprint-1', name: 'Sprint 1' },
        { id: 'sprint-2', name: 'Sprint 2' },
      ],
    },
  });

  assert.deepEqual(sections, [
    {
      key: 'label:sprint-1',
      title: 'Sprint 1',
      taskIds: [],
      isUngrouped: false,
    },
    {
      key: 'label:sprint-2',
      title: 'Sprint 2',
      taskIds: ['task-2'],
      isUngrouped: false,
    },
    {
      key: 'unassigned',
      title: 'Unassigned',
      taskIds: [],
      isUngrouped: false,
    },
  ]);
});