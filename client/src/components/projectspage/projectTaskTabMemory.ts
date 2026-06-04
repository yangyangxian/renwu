import { TaskDateRange, TaskViewMode, type ViewConfig } from '@fullstack/common';

export type ProjectTaskTabMemory = Pick<
  ViewConfig,
  | 'dateRange'
  | 'searchTerm'
  | 'filterLabelId'
  | 'filterLabelIds'
  | 'filterLabelSetId'
  | 'filterLabelSetLabelIds'
  | 'filterLabelSetLabelIdsBySet'
  | 'viewMode'
>;

export function getProjectTaskTabMemoryStorageKey(projectId: string) {
  return `project-task-tab-memory:${projectId}`;
}

export function toProjectTaskTabMemory(view: Partial<ViewConfig>): ProjectTaskTabMemory {
  return {
    dateRange: view.dateRange ?? TaskDateRange.ALL_TIME,
    searchTerm: view.searchTerm ?? '',
    filterLabelId: view.filterLabelId ?? null,
    filterLabelIds: view.filterLabelIds ?? null,
    filterLabelSetId: view.filterLabelSetId ?? null,
    filterLabelSetLabelIds: view.filterLabelSetLabelIds ?? null,
    filterLabelSetLabelIdsBySet: view.filterLabelSetLabelIdsBySet ?? null,
    viewMode: view.viewMode ?? TaskViewMode.BOARD,
  };
}

export function readProjectTaskTabMemory(projectId: string): ProjectTaskTabMemory | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(getProjectTaskTabMemoryStorageKey(projectId));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const value = typeof parsed === 'object' && parsed !== null && 'value' in parsed
      ? parsed.value
      : parsed;

    return toProjectTaskTabMemory(value ?? {});
  } catch {
    return null;
  }
}

export function writeProjectTaskTabMemory(projectId: string, view: Partial<ViewConfig>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    getProjectTaskTabMemoryStorageKey(projectId),
    JSON.stringify({ value: toProjectTaskTabMemory(view) })
  );
}
