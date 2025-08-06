import { useCallback } from 'react';
import { create } from 'zustand';
import { TaskViewCreateReqDto, TaskViewResDto, ViewConfig } from '@fullstack/common';
import { apiClient } from '@/utils/APIClient';

interface TaskViewStoreState {
  taskViews: TaskViewResDto[];
  loading: boolean;
  error: string | null;
  currentSelectedTaskView: TaskViewResDto | null;
  setCurrentSelectedTaskView: (view: TaskViewResDto | null) => void;
  setTaskViews: (views: TaskViewResDto[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const useZustandTaskViewStore = create<TaskViewStoreState>((set) => ({
  taskViews: [],
  loading: false,
  error: null,
  setTaskViews: (views) => set({ taskViews: views }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  currentSelectedTaskView: null,
  setCurrentSelectedTaskView: (view) => set({ currentSelectedTaskView: view }),
}));

export function useTaskViewStore() {
  const { taskViews, loading, error, setTaskViews, setLoading, setError, 
    currentSelectedTaskView, setCurrentSelectedTaskView } = useZustandTaskViewStore();

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
      const created = await apiClient.post<TaskViewCreateReqDto, TaskViewResDto>('/api/tasks/views', reqBody);
      setTaskViews([...taskViews, created]);
      return created;
    } catch (err: any) {
      setError(err?.message || 'Failed to create task view');
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
    currentSelectedTaskView,
    setCurrentSelectedTaskView,
    applyTaskView,
  };
}
