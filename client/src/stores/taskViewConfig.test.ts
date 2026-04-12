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
  assert.equal(
    normalizeTaskViewConfig({
      projectId: 'all',
      dateRange: TaskDateRange.ALL_TIME,
      searchTerm: '',
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
      sortField: TaskSortField.DUE_DATE,
      sortOrder: TaskSortOrder.ASC,
      viewMode: TaskViewMode.TABLE,
      groupByLabelSetId: 'label-set-1',
    }).groupByLabelSetId,
    'label-set-1'
  );
});