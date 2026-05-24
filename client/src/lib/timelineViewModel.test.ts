import test from 'node:test';
import assert from 'node:assert/strict';

import { TaskStatus, type TaskResDto } from '@fullstack/common';

import {
  buildTimelineDateCounts,
  buildTimelineGroups,
  buildTimelineMonths,
  resolveTimelineSelectedDateKey,
} from './timelineViewModel';

function createTask(overrides: Partial<TaskResDto>): TaskResDto {
  return {
    id: overrides.id ?? 'task-1',
    taskNumber: overrides.taskNumber ?? null,
    taskCode: overrides.taskCode ?? '',
    createdBy: overrides.createdBy ?? { id: 'user-1', name: 'Alice', email: 'alice@example.com', createdAt: '2026-05-01T00:00:00.000Z' },
    title: overrides.title ?? 'Untitled task',
    description: overrides.description ?? '',
    dueDate: overrides.dueDate ?? '',
    status: overrides.status ?? TaskStatus.TODO,
    assignedTo: overrides.assignedTo ?? { id: 'user-1', name: 'Alice', email: 'alice@example.com', createdAt: '2026-05-01T00:00:00.000Z' },
    labels: overrides.labels ?? [],
    createdAt: overrides.createdAt ?? '2026-05-24T09:30:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-05-24T09:30:00.000Z',
    projectId: overrides.projectId ?? 'project-1',
    projectName: overrides.projectName ?? 'Project One',
    previewImageUrl: overrides.previewImageUrl ?? undefined,
  };
}

test('buildTimelineGroups sorts tasks by createdAt ascending and groups them by local day key', () => {
  const timeline = buildTimelineGroups([
    createTask({ id: 'task-1', title: 'Morning note', createdAt: '2026-05-24T08:00:00' }),
    createTask({ id: 'task-2', title: 'Evening note', createdAt: '2026-05-24T20:00:00' }),
    createTask({ id: 'task-3', title: 'Yesterday note', createdAt: '2026-05-23T18:00:00' }),
  ]);

  assert.deepEqual(timeline.map((group) => group.dateKey), ['2026-05-23', '2026-05-24']);
  assert.deepEqual(timeline[0]?.tasks.map((task) => task.id), ['task-3']);
  assert.deepEqual(timeline[1]?.tasks.map((task) => task.id), ['task-1', 'task-2']);
});

test('buildTimelineMonths returns a contiguous month range covering the grouped dates', () => {
  const months = buildTimelineMonths(['2026-03-14', '2026-05-24']);

  assert.deepEqual(
    months.map((month) => month.key),
    ['2026-03', '2026-04', '2026-05']
  );
});

test('buildTimelineDateCounts records how many tasks land on each local day', () => {
  const counts = buildTimelineDateCounts([
    createTask({ id: 'task-1', createdAt: '2026-05-24T08:00:00' }),
    createTask({ id: 'task-2', createdAt: '2026-05-24T20:00:00' }),
    createTask({ id: 'task-3', createdAt: '2026-05-23T18:00:00' }),
  ]);

  assert.equal(counts.get('2026-05-24'), 2);
  assert.equal(counts.get('2026-05-23'), 1);
  assert.equal(counts.get('2026-05-22'), undefined);
});

test('resolveTimelineSelectedDateKey falls back to the newest available group when the current selection is missing', () => {
  assert.equal(
    resolveTimelineSelectedDateKey('2026-05-24', ['2026-05-18', '2026-05-22', '2026-05-25'], '2026-05-21'),
    '2026-05-22'
  );
});

test('resolveTimelineSelectedDateKey keeps the current date when it already exists in the groups', () => {
  assert.equal(
    resolveTimelineSelectedDateKey('2026-05-23', ['2026-05-23', '2026-05-22'], '2026-05-21'),
    '2026-05-23'
  );
});