import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveRenderableTaskDetail } from './taskDetailState';

test('resolveRenderableTaskDetail prefers the fetched current task when it matches the requested task', () => {
  const previewTask = { id: 'task-new', title: 'Preview task' };
  const currentTask = { id: 'task-new', title: 'Fetched task' };

  assert.deepEqual(
    resolveRenderableTaskDetail({
      requestedTaskId: 'task-new',
      currentTask,
      previewTask,
    }),
    currentTask
  );
});

test('resolveRenderableTaskDetail falls back to the selected preview task when fetched current task is stale', () => {
  const previewTask = { id: 'task-new', title: 'Preview task' };
  const staleCurrentTask = { id: 'task-old', title: 'Old task' };

  assert.deepEqual(
    resolveRenderableTaskDetail({
      requestedTaskId: 'task-new',
      currentTask: staleCurrentTask,
      previewTask,
    }),
    previewTask
  );
});

test('resolveRenderableTaskDetail returns null when neither current nor preview matches the requested task', () => {
  assert.equal(
    resolveRenderableTaskDetail({
      requestedTaskId: 'task-new',
      currentTask: null,
      previewTask: { id: 'task-other', title: 'Other task' },
    }),
    null
  );
});