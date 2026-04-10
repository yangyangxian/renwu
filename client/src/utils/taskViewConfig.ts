import {
  TaskDateRange,
  TaskSortField,
  TaskSortOrder,
  TaskStatus,
  TaskViewMode,
  ViewConfig,
} from '@fullstack/common';

export const defaultTaskViewConfig: ViewConfig = {
  projectId: 'all',
  dateRange: TaskDateRange.ALL_TIME,
  searchTerm: '',
  status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
  sortField: TaskSortField.DUE_DATE,
  sortOrder: TaskSortOrder.ASC,
  viewMode: TaskViewMode.BOARD,
  groupByLabelSetId: null,
};

export function normalizeTaskViewConfig(view: Partial<ViewConfig>): ViewConfig {
  return {
    ...defaultTaskViewConfig,
    ...view,
    status: view.status ?? defaultTaskViewConfig.status,
  };
}