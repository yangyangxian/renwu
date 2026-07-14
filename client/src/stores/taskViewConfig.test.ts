import test from 'node:test';
import assert from 'node:assert/strict';

import { TaskDateRange, TaskSortField, TaskSortOrder, TaskStatus, TaskViewMode, TaskViewResDto } from '@fullstack/common';

import {
  createPersonalTaskViewConfig,
  createProjectTaskViewConfig,
  defaultTaskViewConfig,
  isSavedTaskViewContextReady,
  isTaskViewHomeContextReady,
  normalizeTaskViewConfig,
  resolveProjectPageDisplayViewConfig,
  resolveSavedTaskViewDisplayConfig,
  useZustandTaskViewStore,
} from './useTaskViewStore';

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

test('normalizeTaskViewConfig preserves filterLabelSetLabelIds', () => {
  assert.deepEqual(
    normalizeTaskViewConfig({
      projectId: 'project-1',
      viewMode: TaskViewMode.LIST,
      filterLabelSetId: 'filter-label-set-1',
      filterLabelSetLabelIds: ['label-1', 'label-2'],
    }).filterLabelSetLabelIds,
    ['label-1', 'label-2']
  );
});

test('normalizeTaskViewConfig preserves multi label filters', () => {
  const normalized = normalizeTaskViewConfig({
    projectId: 'project-1',
    viewMode: TaskViewMode.LIST,
    filterLabelIds: ['label-1', 'label-2'],
    filterLabelSetLabelIdsBySet: {
      'label-set-1': ['label-3'],
      'label-set-2': ['label-4', 'label-5'],
    },
  });

  assert.deepEqual(normalized.filterLabelIds, ['label-1', 'label-2']);
  assert.deepEqual(normalized.filterLabelSetLabelIdsBySet, {
    'label-set-1': ['label-3'],
    'label-set-2': ['label-4', 'label-5'],
  });
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
    filterLabelSetLabelIds: ['label-1'],
    groupByLabelSetId: 'group-label-set-1',
  });

  assert.deepEqual(sanitized.status, defaultTaskViewConfig.status);
  assert.equal(sanitized.sortField, defaultTaskViewConfig.sortField);
  assert.equal(sanitized.sortOrder, defaultTaskViewConfig.sortOrder);
  assert.equal(sanitized.filterLabelId, 'filter-label-1');
  assert.equal(sanitized.filterLabelSetId, 'filter-label-set-1');
  assert.deepEqual(sanitized.filterLabelSetLabelIds, ['label-1']);
  assert.equal(sanitized.groupByLabelSetId, 'group-label-set-1');
});

test('resolveProjectPageDisplayViewConfig restores project home config instead of inheriting a saved view mode', () => {
  const projectHomeConfig = createProjectTaskViewConfig('project-1', {
    viewMode: TaskViewMode.BOARD,
    searchTerm: 'alpha',
    filterLabelId: 'label-1',
  });

  const resolved = resolveProjectPageDisplayViewConfig('project-1', {
    projectHomeViewConfig: projectHomeConfig,
  });

  assert.deepEqual(resolved, projectHomeConfig);
});

test('resolveProjectPageDisplayViewConfig falls back to the default project board view', () => {
  const resolved = resolveProjectPageDisplayViewConfig('project-1');

  assert.equal(resolved.projectId, 'project-1');
  assert.equal(resolved.viewMode, TaskViewMode.BOARD);
  assert.deepEqual(resolved.status, defaultTaskViewConfig.status);
});

test('createProjectTaskViewConfig keeps the current project scope even when overrides contain a stale projectId', () => {
  const resolved = createProjectTaskViewConfig('project-1', {
    projectId: 'stale-project',
    viewMode: TaskViewMode.TABLE,
    filterLabelSetId: 'label-set-1',
  });

  assert.equal(resolved.projectId, 'project-1');
  assert.equal(resolved.viewMode, TaskViewMode.TABLE);
  assert.equal(resolved.filterLabelSetId, 'label-set-1');
});

test('route readiness rejects a stale saved-view context', () => {
  const personalTableView = {
    id: 'personal-view',
    projectId: null,
    viewConfig: createPersonalTaskViewConfig({
      viewMode: TaskViewMode.TABLE,
    }),
  };
  const projectBoardView = {
    id: 'project-view',
    projectId: 'project-1',
    viewConfig: createProjectTaskViewConfig('project-1', {
      viewMode: TaskViewMode.BOARD,
    }),
  };

  const personalConfig = resolveSavedTaskViewDisplayConfig(personalTableView);

  assert.equal(
    isSavedTaskViewContextReady(
      personalTableView,
      { kind: 'saved', viewId: projectBoardView.id },
      projectBoardView,
      resolveSavedTaskViewDisplayConfig(projectBoardView)
    ),
    false
  );
  assert.equal(
    isSavedTaskViewContextReady(
      personalTableView,
      { kind: 'saved', viewId: personalTableView.id },
      personalTableView,
      personalConfig
    ),
    true
  );
  assert.equal(
    isTaskViewHomeContextReady(
      'personal',
      { kind: 'saved', viewId: personalTableView.id },
      personalTableView,
      personalConfig
    ),
    false
  );
});

test('late writes from a previous route revision cannot overwrite the active saved view', () => {
  const initialState = useZustandTaskViewStore.getState();
  const personalTableView = new TaskViewResDto(
    'personal-view',
    'user-1',
    'Personal table',
    createPersonalTaskViewConfig({ viewMode: TaskViewMode.TABLE })
  );
  const projectBoardView = new TaskViewResDto(
    'project-view',
    'user-1',
    'Project board',
    createProjectTaskViewConfig('project-1', { viewMode: TaskViewMode.BOARD }),
    'project-1'
  );

  try {
    useZustandTaskViewStore.setState({
      currentSelectedTaskView: null,
      currentTaskViewContext: { kind: 'home', projectId: 'all' },
      currentTaskViewRevision: 0,
      currentDisplayViewConfig: defaultTaskViewConfig,
    });

    useZustandTaskViewStore.getState().selectTaskView(personalTableView);
    useZustandTaskViewStore.getState().selectTaskView(projectBoardView);
    const staleProjectRevision = useZustandTaskViewStore.getState().currentTaskViewRevision;
    useZustandTaskViewStore.getState().selectTaskView(personalTableView);

    useZustandTaskViewStore.getState().setCurrentDisplayViewConfig(
      resolveSavedTaskViewDisplayConfig(projectBoardView),
      staleProjectRevision
    );
    useZustandTaskViewStore.getState().setCurrentDisplayViewConfigViewMode(
      TaskViewMode.BOARD,
      staleProjectRevision
    );

    const finalState = useZustandTaskViewStore.getState();
    assert.equal(finalState.currentSelectedTaskView?.id, personalTableView.id);
    assert.deepEqual(finalState.currentTaskViewContext, {
      kind: 'saved',
      viewId: personalTableView.id,
    });
    assert.equal(finalState.currentDisplayViewConfig.projectId, 'personal');
    assert.equal(finalState.currentDisplayViewConfig.viewMode, TaskViewMode.TABLE);
  } finally {
    useZustandTaskViewStore.setState({
      currentSelectedTaskView: initialState.currentSelectedTaskView,
      currentTaskViewContext: initialState.currentTaskViewContext,
      currentTaskViewRevision: initialState.currentTaskViewRevision,
      currentDisplayViewConfig: initialState.currentDisplayViewConfig,
    });
  }
});
