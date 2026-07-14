import { useCallback } from 'react';
import { create } from 'zustand';
import { TaskSortField, TaskSortOrder, TaskViewCreateReqDto, TaskViewMode, TaskViewResDto, 
  ViewConfig, TaskDateRange, 
  TaskStatus} from '@fullstack/common';
import { apiClient } from '@/utils/APIClient';
import { updateTaskViewById, createTaskView as createTaskViewEndpoint, deleteTaskViewById } from '@/apiRequests/apiEndpoints';
import { readProjectTaskTabMemory, writeProjectTaskTabMemory } from '@/components/projectspage/projectTaskTabMemory';

export const defaultTaskViewConfig: ViewConfig = {
  projectId: 'all',
  dateRange: TaskDateRange.ALL_TIME,
  searchTerm: '',
  status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE],
  sortField: TaskSortField.DUE_DATE,
  sortOrder: TaskSortOrder.ASC,
  viewMode: TaskViewMode.BOARD,
  filterLabelId: null,
  filterLabelIds: null,
  filterLabelSetId: null,
  filterLabelSetLabelIds: null,
  filterLabelSetLabelIdsBySet: null,
  groupByLabelSetId: null,
};

export const personalTaskViewConfig: ViewConfig = {
  ...defaultTaskViewConfig,
  projectId: 'personal',
};

export function normalizeTaskViewConfig(view: Partial<ViewConfig>): ViewConfig {
  const normalized = {
    ...defaultTaskViewConfig,
    ...view,
    status: view.status ?? defaultTaskViewConfig.status,
    filterLabelId: view.filterLabelId ?? defaultTaskViewConfig.filterLabelId,
    filterLabelIds: view.filterLabelIds ?? defaultTaskViewConfig.filterLabelIds,
    filterLabelSetId: view.filterLabelSetId ?? defaultTaskViewConfig.filterLabelSetId,
    filterLabelSetLabelIds: view.filterLabelSetLabelIds ?? defaultTaskViewConfig.filterLabelSetLabelIds,
    filterLabelSetLabelIdsBySet: view.filterLabelSetLabelIdsBySet ?? defaultTaskViewConfig.filterLabelSetLabelIdsBySet,
  };

  if (normalized.viewMode === TaskViewMode.TABLE) {
    return {
      ...normalized,
      status: defaultTaskViewConfig.status,
      sortField: defaultTaskViewConfig.sortField,
      sortOrder: defaultTaskViewConfig.sortOrder,
    };
  }

  return normalized;
}

export function createProjectTaskViewConfig(projectId: string, overrides: Partial<ViewConfig> = {}): ViewConfig {
  return normalizeTaskViewConfig({
    ...defaultTaskViewConfig,
    ...overrides,
    projectId,
  });
}

export function createPersonalTaskViewConfig(overrides: Partial<ViewConfig> = {}): ViewConfig {
  return normalizeTaskViewConfig({
    ...personalTaskViewConfig,
    ...overrides,
    projectId: 'personal',
  });
}

export function resolveSavedTaskViewDisplayConfig(
  view: Pick<TaskViewResDto, 'projectId' | 'viewConfig'>
): ViewConfig {
  return view.projectId
    ? createProjectTaskViewConfig(view.projectId, view.viewConfig)
    : createPersonalTaskViewConfig(view.viewConfig);
}

export type TaskViewContext =
  | { kind: 'saved'; viewId: string }
  | { kind: 'home'; projectId: string };

export function isSavedTaskViewContextReady(
  view: Pick<TaskViewResDto, 'id' | 'projectId'>,
  currentTaskViewContext: TaskViewContext,
  currentSelectedTaskView: Pick<TaskViewResDto, 'id'> | null,
  currentDisplayViewConfig: ViewConfig
): boolean {
  const expectedProjectId = view.projectId ?? 'personal';
  return currentTaskViewContext.kind === 'saved'
    && currentTaskViewContext.viewId === view.id
    && currentSelectedTaskView?.id === view.id
    && currentDisplayViewConfig.projectId === expectedProjectId;
}

export function isTaskViewHomeContextReady(
  projectId: string,
  currentTaskViewContext: TaskViewContext,
  currentSelectedTaskView: Pick<TaskViewResDto, 'id'> | null,
  currentDisplayViewConfig: ViewConfig
): boolean {
  return currentTaskViewContext.kind === 'home'
    && currentTaskViewContext.projectId === projectId
    && currentSelectedTaskView === null
    && currentDisplayViewConfig.projectId === projectId;
}

export function resolveProjectPageDisplayViewConfig(
  projectId: string,
  options: {
    activeProjectViewConfig?: Partial<ViewConfig> | null;
    projectHomeViewConfig?: Partial<ViewConfig> | null;
  } = {}
): ViewConfig {
  if (options.activeProjectViewConfig) {
    return createProjectTaskViewConfig(projectId, options.activeProjectViewConfig);
  }

  if (options.projectHomeViewConfig) {
    return createProjectTaskViewConfig(projectId, options.projectHomeViewConfig);
  }

  return createProjectTaskViewConfig(projectId);
}

export function sanitizeTaskViewConfigForPersistence(view: Partial<ViewConfig>): ViewConfig {
  return normalizeTaskViewConfig(view);
}

interface TaskViewStoreState {
  taskViews: TaskViewResDto[];
  taskViewsLoaded: boolean;
  loading: boolean;
  error: string | null;
  currentSelectedTaskView: TaskViewResDto | null;
  currentTaskViewContext: TaskViewContext;
  currentTaskViewRevision: number;
  setCurrentSelectedTaskView: (view: TaskViewResDto | null) => void;
  selectTaskView: (view: TaskViewResDto) => void;
  showTaskViewHome: (view: ViewConfig) => void;
  setTaskViews: (views: TaskViewResDto[]) => void;
  setTaskViewsLoaded: (loaded: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  projectHomeViewConfigs: Record<string, ViewConfig>;
  getProjectHomeViewConfig: (projectId: string) => ViewConfig | null;
  setProjectHomeViewConfig: (projectId: string, view: ViewConfig) => void;
  currentDisplayViewConfig: ViewConfig;
  setCurrentDisplayViewConfig: (view: ViewConfig, expectedRevision: number) => void;
  setCurrentDisplayViewConfigViewMode: (viewMode: TaskViewMode, expectedRevision: number) => void;
}

const defaultDisplayViewConfig: ViewConfig = defaultTaskViewConfig;

/** @internal Exported only for deterministic store regression tests. */
export const useZustandTaskViewStore = create<TaskViewStoreState>((set, get) => ({
  taskViews: [],
  taskViewsLoaded: false,
  loading: false,
  error: null,
  setTaskViews: (views) => set({ taskViews: views }),
  setTaskViewsLoaded: (loaded) => set({ taskViewsLoaded: loaded }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  projectHomeViewConfigs: {},
  getProjectHomeViewConfig: (projectId) => {
    const inMemoryConfig = get().projectHomeViewConfigs[projectId];
    if (inMemoryConfig) {
      return inMemoryConfig;
    }

    const storedMemory = readProjectTaskTabMemory(projectId);
    return storedMemory ? createProjectTaskViewConfig(projectId, storedMemory) : null;
  },
  setProjectHomeViewConfig: (projectId, view) => set((state) => {
    const nextConfig = createProjectTaskViewConfig(projectId, view);
    writeProjectTaskTabMemory(projectId, nextConfig);

    return {
      projectHomeViewConfigs: {
        ...state.projectHomeViewConfigs,
        [projectId]: nextConfig,
      },
    };
  }),
  currentSelectedTaskView: null,
  currentTaskViewContext: { kind: 'home', projectId: defaultDisplayViewConfig.projectId },
  currentTaskViewRevision: 0,
  setCurrentSelectedTaskView: (view) => set({ currentSelectedTaskView: view }),
  selectTaskView: (view) => set((state) => ({
    currentSelectedTaskView: view,
    currentTaskViewContext: { kind: 'saved', viewId: view.id },
    currentTaskViewRevision: state.currentTaskViewRevision + 1,
    currentDisplayViewConfig: resolveSavedTaskViewDisplayConfig(view),
  })),
  showTaskViewHome: (view) => set((state) => {
    const nextConfig = normalizeTaskViewConfig(view);
    return {
      currentSelectedTaskView: null,
      currentTaskViewContext: { kind: 'home', projectId: nextConfig.projectId },
      currentTaskViewRevision: state.currentTaskViewRevision + 1,
      currentDisplayViewConfig: nextConfig,
    };
  }),
  currentDisplayViewConfig: defaultDisplayViewConfig,
  setCurrentDisplayViewConfig: (view, expectedRevision) => set((state) => {
    // A filter/grouping effect from an unmounted route can resolve after the
    // next saved view has already been activated. Ignore that stale write.
    if (state.currentTaskViewRevision !== expectedRevision) {
      return state;
    }

    const nextConfig = normalizeTaskViewConfig(view);

    if (nextConfig.projectId === 'personal' && !state.currentSelectedTaskView) {
      writeProjectTaskTabMemory('personal', nextConfig);

      return {
        currentDisplayViewConfig: nextConfig,
        projectHomeViewConfigs: {
          ...state.projectHomeViewConfigs,
          personal: nextConfig,
        },
      };
    }

    return { currentDisplayViewConfig: nextConfig };
  }),
  setCurrentDisplayViewConfigViewMode: (viewMode: TaskViewMode, expectedRevision: number) => set((state) => {
    if (state.currentTaskViewRevision !== expectedRevision) {
      return state;
    }

    const nextConfig = {
      ...state.currentDisplayViewConfig,
      viewMode,
    };

    if (nextConfig.projectId === 'personal' && !state.currentSelectedTaskView) {
      writeProjectTaskTabMemory('personal', nextConfig);

      return {
        currentDisplayViewConfig: nextConfig,
        projectHomeViewConfigs: {
          ...state.projectHomeViewConfigs,
          personal: nextConfig,
        },
      };
    }

    return {
      currentDisplayViewConfig: nextConfig,
    };
  }), // This function allows updating just the viewMode in the currentDisplayViewConfig
}));

export function useTaskViewStore() {
  const { taskViews, taskViewsLoaded, loading, error, setTaskViews, setTaskViewsLoaded, setLoading, setError,
    projectHomeViewConfigs, getProjectHomeViewConfig, setProjectHomeViewConfig,
    currentSelectedTaskView, currentTaskViewContext, currentTaskViewRevision, setCurrentSelectedTaskView, selectTaskView, showTaskViewHome,
    currentDisplayViewConfig, setCurrentDisplayViewConfig: setCurrentDisplayViewConfigForRevision,
    setCurrentDisplayViewConfigViewMode: setCurrentDisplayViewConfigViewModeForRevision } = useZustandTaskViewStore();

  // These wrappers deliberately capture the activation revision for this
  // render. Async callbacks retained by an old route keep the old revision and
  // are rejected by the store after navigation activates another view.
  const setCurrentDisplayViewConfig = useCallback((view: ViewConfig) => {
    setCurrentDisplayViewConfigForRevision(view, currentTaskViewRevision);
  }, [currentTaskViewRevision, setCurrentDisplayViewConfigForRevision]);

  const setCurrentDisplayViewConfigViewMode = useCallback((viewMode: TaskViewMode) => {
    setCurrentDisplayViewConfigViewModeForRevision(viewMode, currentTaskViewRevision);
  }, [currentTaskViewRevision, setCurrentDisplayViewConfigViewModeForRevision]);
    
  const deleteTaskView = useCallback(async (viewId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(deleteTaskViewById(viewId));
      setTaskViews(taskViews.filter(tv => tv.id !== viewId));
      if (currentSelectedTaskView && currentSelectedTaskView.id === viewId) {
        setCurrentSelectedTaskView(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete task view');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [taskViews, setTaskViews, setLoading, setError, currentSelectedTaskView, setCurrentSelectedTaskView]);

  const fetchTaskViews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<TaskViewResDto[]>('/api/tasks/views');
      setTaskViews(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch task views');
    } finally {
      setTaskViewsLoaded(true);
      setLoading(false);
    }
  }, [setLoading, setError, setTaskViews, setTaskViewsLoaded]);


  const createTaskView = useCallback(async (name: string, viewConfig: ViewConfig, projectId: string | null = null): Promise<TaskViewResDto> => {
    setLoading(true);
    setError(null);
    try {
      const reqBody: TaskViewCreateReqDto = {
        name,
        projectId,
        viewConfig: sanitizeTaskViewConfigForPersistence(viewConfig),
      };
      const created = await apiClient.post<TaskViewCreateReqDto, TaskViewResDto>(createTaskViewEndpoint(), reqBody);
      setTaskViews([...taskViews, created]);
      return created;
    } catch (err: any) {
      setError(err?.message || 'Failed to create task view');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [taskViews, setTaskViews, setLoading, setError]);

  const updateTaskView = useCallback(async (viewId: string, name: string, viewConfig: ViewConfig, projectId?: string | null): Promise<TaskViewResDto> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await apiClient.put<{ name: string; projectId?: string | null; viewConfig: ViewConfig }, TaskViewResDto>(
        updateTaskViewById(viewId),
        {
          name,
          projectId,
          viewConfig: sanitizeTaskViewConfigForPersistence(viewConfig),
        }
      );
      setTaskViews(taskViews.map(tv => tv.id === viewId ? updated : tv));
      if (updated.id === currentSelectedTaskView?.id) {
        setCurrentSelectedTaskView(updated);
      }
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Failed to update task view');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [taskViews, setTaskViews, setLoading, setError]);

  const applyTaskView = useCallback((viewConfig: ViewConfig) => {
    // This function will be used by components to apply a saved view configuration
    // The actual application logic will be handled by the consuming components
    return normalizeTaskViewConfig(viewConfig);
  }, []);

  return {
    taskViews,
    taskViewsLoaded,
    personalTaskViews: taskViews.filter(view => !view.projectId),
    getProjectTaskViews: (projectId: string) => taskViews.filter(view => view.projectId === projectId),
    loading,
    error,
    projectHomeViewConfigs,
    getProjectHomeViewConfig,
    setProjectHomeViewConfig,
    fetchTaskViews,
    createTaskView,
    updateTaskView,
    deleteTaskView,
    currentSelectedTaskView,
    currentTaskViewContext,
    selectTaskView,
    showTaskViewHome,
    currentDisplayViewConfig,
    setCurrentDisplayViewConfig,
    applyTaskView,
    defaultDisplayViewConfig,
    personalDisplayViewConfig: getProjectHomeViewConfig('personal') ?? personalTaskViewConfig,
    setCurrentDisplayViewConfigViewMode
  };
}
