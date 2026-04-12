import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveSelectedTaskId } from './ListView';

test('resolveSelectedTaskId resets to the first task when the selection scope changes', () => {
  assert.equal(
    resolveSelectedTaskId({
      currentSelectedTaskId: 'task-old',
      taskIds: ['task-new-1', 'task-new-2'],
      selectionScopeChanged: true,
    }),
    'task-new-1'
  );
});

test('resolveSelectedTaskId preserves the current task when it is still valid and scope is unchanged', () => {
  assert.equal(
    resolveSelectedTaskId({
      currentSelectedTaskId: 'task-2',
      taskIds: ['task-1', 'task-2'],
      selectionScopeChanged: false,
    }),
    'task-2'
  );
});

test('resolveSelectedTaskId falls back to the first task when the current selection is not in the list', () => {
  assert.equal(
    resolveSelectedTaskId({
      currentSelectedTaskId: 'missing-task',
      taskIds: ['task-1', 'task-2'],
      selectionScopeChanged: false,
    }),
    'task-1'
  );
});

test('resolveSelectedTaskId returns null when the list is empty', () => {
  assert.equal(
    resolveSelectedTaskId({
      currentSelectedTaskId: 'task-old',
      taskIds: [],
      selectionScopeChanged: true,
    }),
    null
  );
});

test('resolveSelectedTaskId immediately prefers the new scope first task even when the old selection still exists locally', () => {
  assert.equal(
    resolveSelectedTaskId({
      currentSelectedTaskId: 'task-old',
      taskIds: ['task-new-1', 'task-new-2'],
      selectionScopeChanged: true,
    }),
    'task-new-1'
  );
});