import test from 'node:test';
import assert from 'node:assert/strict';

import { TaskDateRange, TaskSortField, TaskSortOrder, TaskStatus, TaskViewMode } from '@fullstack/common';

import { defaultTaskViewConfig, normalizeTaskViewConfig } from './useTaskViewStore';

test('normalizeTaskViewConfig fills missing values from defaults', () => {
  assert.deepEqual(
    normalizeTaskViewConfig({
      projectId: 'project-1',
      viewMode: TaskViewMode.TABLE,
    }),
    {
      ...defaultTaskViewConfig,
      projectId: 'project-1',
      viewMode: TaskViewMode.TABLE,
    }
  );
});

test('normalizeTaskViewConfig preserves groupByLabelSetId even when projectId is all', () => {
  const normalized = normalizeTaskViewConfig({
    projectId: 'all',
    dateRange: TaskDateRange.ALL_TIME,
    searchTerm: '',
    status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    sortField: TaskSortField.DUE_DATE,
    sortOrder: TaskSortOrder.ASC,
    viewMode: TaskViewMode.TABLE,
    groupByLabelSetId: 'label-set-1',
  });

  assert.equal(normalized.groupByLabelSetId, 'label-set-1');
  assert.deepEqual(normalized.status, defaultTaskViewConfig.status);
});

test('normalizeTaskViewConfig preserves filterLabelSetId', () => {
  assert.equal(
    normalizeTaskViewConfig({
      projectId: 'project-1',
      viewMode: TaskViewMode.LIST,
      filterLabelSetId: 'filter-label-set-1',
    }).filterLabelSetId,
    'filter-label-set-1'
  );
});

test('normalizeTaskViewConfig preserves filterLabelId', () => {
  assert.equal(
    normalizeTaskViewConfig({
      projectId: 'project-1',
      viewMode: TaskViewMode.LIST,
      filterLabelId: 'filter-label-1',
    }).filterLabelId,
    'filter-label-1'
  );
});

test('sanitizeTaskViewConfigForPersistence clears list-only controls for table views', async () => {
  const { sanitizeTaskViewConfigForPersistence } = await import('./useTaskViewStore');

  const sanitized = sanitizeTaskViewConfigForPersistence({
    projectId: 'project-1',
    viewMode: TaskViewMode.TABLE,
    status: [TaskStatus.DONE],
    sortField: TaskSortField.TITLE,
    sortOrder: TaskSortOrder.DESC,
    filterLabelId: 'filter-label-1',
    filterLabelSetId: 'filter-label-set-1',
    groupByLabelSetId: 'group-label-set-1',
  });

  assert.deepEqual(sanitized.status, defaultTaskViewConfig.status);
  assert.equal(sanitized.sortField, defaultTaskViewConfig.sortField);
  assert.equal(sanitized.sortOrder, defaultTaskViewConfig.sortOrder);
  assert.equal(sanitized.filterLabelId, 'filter-label-1');
  assert.equal(sanitized.filterLabelSetId, 'filter-label-set-1');
  assert.equal(sanitized.groupByLabelSetId, 'group-label-set-1');
});
