import { useCallback } from 'react';
import { create } from 'zustand';
import { TaskSortField, TaskSortOrder, TaskViewCreateReqDto, TaskViewMode, TaskViewResDto, 
  ViewConfig, TaskDateRange, 
  TaskStatus} from '@fullstack/common';
import { apiClient } from '@/utils/APIClient';
import { updateTaskViewById, createTaskView as createTaskViewEndpoint, deleteTaskViewById } from '@/apiRequests/apiEndpoints';

interface TaskViewStoreState {
  taskViews: TaskViewResDto[];
  loading: boolean;
  error: string | null;
  currentSelectedTaskView: TaskViewResDto | null;
  setCurrentSelectedTaskView: (view: TaskViewResDto | null) => void;
  setTaskViews: (views: TaskViewResDto[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  currentDisplayViewConfig: ViewConfig;
  setCurrentDisplayViewConfig: (view: ViewConfig) => void;
  setCurrentDisplayViewConfigViewMode: (viewMode: TaskViewMode) => void;
}

const defaultDisplayViewConfig: ViewConfig = {
  projectId: 'all',
  dateRange: TaskDateRange.ALL_TIME,
  searchTerm: '',
  status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
  sortField: TaskSortField.DUE_DATE,
  sortOrder: TaskSortOrder.ASC,
  viewMode: TaskViewMode.BOARD
};

const useZustandTaskViewStore = create<TaskViewStoreState>((set) => ({
  taskViews: [],
  loading: false,
  error: null,
  setTaskViews: (views) => set({ taskViews: views }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  currentSelectedTaskView: null,
  setCurrentSelectedTaskView: (view) => set({ currentSelectedTaskView: view }),
  currentDisplayViewConfig: defaultDisplayViewConfig,
  setCurrentDisplayViewConfig: (view) => set({ currentDisplayViewConfig: view }),
  setCurrentDisplayViewConfigViewMode: (viewMode: TaskViewMode) => set((state) => ({
    currentDisplayViewConfig: {
      ...state.currentDisplayViewConfig,
      viewMode
    }
  })), // This function allows updating just the viewMode in the currentDisplayViewConfig
}));

export function useTaskViewStore() {
  const { taskViews, loading, error, setTaskViews, setLoading, setError, 
    currentSelectedTaskView, setCurrentSelectedTaskView, currentDisplayViewConfig, 
    setCurrentDisplayViewConfig, setCurrentDisplayViewConfigViewMode } = useZustandTaskViewStore();
    
  const deleteTaskView = useCallback(async (viewId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(deleteTaskViewById(viewId));
      setTaskViews(taskViews.filter(tv => tv.id !== viewId));
      if (currentSelectedTaskView && currentSelectedTaskView.id === viewId) {
        setCurrentSelectedTaskView(null);
        setCurrentDisplayViewConfig(defaultDisplayViewConfig);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete task view');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [taskViews, setTaskViews, setLoading, setError, currentSelectedTaskView, setCurrentSelectedTaskView, setCurrentDisplayViewConfig, defaultDisplayViewConfig]);

  const fetchTaskViews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<TaskViewResDto[]>('/api/tasks/views');
      setTaskViews(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch task views');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setTaskViews]);


  const createTaskView = useCallback(async (name: string, viewConfig: ViewConfig): Promise<TaskViewResDto> => {
    setLoading(true);
    setError(null);
    try {
      const reqBody: TaskViewCreateReqDto = { name, viewConfig };
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

  const updateTaskView = useCallback(async (viewId: string, name: string, viewConfig: ViewConfig): Promise<TaskViewResDto> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await apiClient.put<{ name: string; viewConfig: ViewConfig }, TaskViewResDto>(
        updateTaskViewById(viewId),
        { name, viewConfig }
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
    return viewConfig;
  }, []);

  return {
    taskViews,
    loading,
    error,
    fetchTaskViews,
    createTaskView,
    updateTaskView,
    deleteTaskView,
    currentSelectedTaskView,
    setCurrentSelectedTaskView,
    currentDisplayViewConfig,
    setCurrentDisplayViewConfig,
    applyTaskView,
    defaultDisplayViewConfig,
    setCurrentDisplayViewConfigViewMode
  };
}
