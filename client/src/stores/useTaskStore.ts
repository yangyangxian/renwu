import { useCallback } from 'react';
import { create } from 'zustand';
import { TaskResDto, TaskCreateReqDto, TaskUpdateReqDto } from '@fullstack/common';
import { apiClient } from '@/utils/APIClient';
import { 
  getMyTasks, 
  getTasksByProjectId, 
  getTasks, 
  updateTaskById as updateTaskByIdEndpoint, 
  deleteTaskById as deleteTaskByIdEndpoint, 
  getTaskById 
} from '@/apiRequests/apiEndpoints';

// Internal Zustand store - only for state management
interface TaskStoreState {
  tasks: TaskResDto[];
  projectTasks: TaskResDto[];
  currentTask: TaskResDto | null;
  loading: boolean;
  projectLoading: boolean;
  error: string | null;
  projectError: string | null;
  setTasks: (tasks: TaskResDto[]) => void;
  setProjectTasks: (tasks: TaskResDto[]) => void;
  setCurrentTask: (task: TaskResDto | null) => void;
  setLoading: (loading: boolean) => void;
  setProjectLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProjectError: (error: string | null) => void;
}

const useZustandTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  projectTasks: [],
  currentTask: null,
  loading: false,
  projectLoading: false,
  error: null,
  projectError: null,
  setTasks: (tasks) => set({ tasks }),
  setProjectTasks: (tasks) => set({ projectTasks: tasks }),
  setCurrentTask: (task) => set({ currentTask: task }),
  setLoading: (loading) => set({ loading }),
  setProjectLoading: (loading) => set({ projectLoading: loading }),
  setError: (error) => set({ error }),
  setProjectError: (error) => set({ projectError: error }),
}));

export function useTaskStore() {
  const {
    tasks,
    projectTasks,
    currentTask,
    loading,
    projectLoading,
    error,
    projectError,
    setTasks,
    setProjectTasks,
    setCurrentTask,
    setLoading,
    setProjectLoading,
    setError,
    setProjectError,
  } = useZustandTaskStore();

  const fetchCurrentTask = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<TaskResDto>(getTaskById(taskId));
      setCurrentTask(data);
    } catch (err: any) {
      setCurrentTask(null);
      setError(err?.message || 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setCurrentTask]);

  const fetchMyTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<TaskResDto[]>(getMyTasks());
      setTasks(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setTasks]);

  const fetchProjectTasks = useCallback(async (projectId: string) => {
    setProjectLoading(true);
    setProjectError(null);
    try {
      const data = await apiClient.get<TaskResDto[]>(getTasksByProjectId(projectId));
      setProjectTasks(data);
    } catch (err: any) {
      setProjectError(err?.message || 'Failed to fetch project tasks');
    } finally {
      setProjectLoading(false);
    }
  }, [setProjectLoading, setProjectError, setProjectTasks]);

  // Simple state operations - pure state management
  const addTask = useCallback((task: TaskResDto) => {
    setTasks([...tasks, task]);
    setProjectTasks([...projectTasks, task]);
  }, [tasks, projectTasks, setTasks, setProjectTasks]);

  const updateTask = useCallback((task: TaskResDto) => {
    setTasks(tasks.map(t => t.id === task.id ? task : t));
    setProjectTasks(projectTasks.map(t => t.id === task.id ? task : t));
  }, [tasks, projectTasks, setTasks, setProjectTasks]);

  const removeTask = useCallback((taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setProjectTasks(projectTasks.filter(t => t.id !== taskId));
  }, [tasks, projectTasks, setTasks, setProjectTasks]);

  // Business logic methods
  const createTask = useCallback(async (taskData: any): Promise<TaskResDto> => {
    try {
      // Construct the proper TaskCreateReqDto payload, similar to the old useTasks hook
      const createPayload: TaskCreateReqDto = {
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        status: taskData.status,
        assignedTo: typeof taskData.assignedTo === 'object' ? taskData.assignedTo?.id : taskData.assignedTo,
        projectId: taskData.projectId,
        createdBy: taskData.createdBy,
      };

      // Include labels if provided (frontend uses `labelIds` state)
      if (Array.isArray(taskData.labels)) {
        if (taskData.labels.length > 0 && typeof taskData.labels[0] === 'object') {
          createPayload.labels = (taskData.labels as any[]).map(l => l.id);
        } else {
          createPayload.labels = taskData.labels as string[];
        }
      }
      if (Array.isArray(taskData.labelIds)) createPayload.labels = taskData.labelIds;

      const newTask = await apiClient.post<TaskCreateReqDto, TaskResDto>(getTasks(), createPayload);
      addTask(newTask);
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }, [addTask]);

  const updateTaskById = useCallback(async (taskId: string, updateData: any): Promise<TaskResDto> => {
    try {
      // Construct the proper TaskUpdateReqDto payload, similar to the old useTasks hook
      const updatePayload: TaskUpdateReqDto = {
        // Only include fields that are present on updateData
        ...(updateData.title !== undefined ? { title: updateData.title } : {}),
        ...(updateData.description !== undefined ? { description: updateData.description } : {}),
        ...(updateData.dueDate !== undefined ? { dueDate: updateData.dueDate } : {}),
        ...(updateData.status !== undefined ? { status: updateData.status } : {}),
        ...(updateData.projectId !== undefined ? { projectId: updateData.projectId } : {}),
        assignedTo: typeof updateData.assignedTo === 'object' ? updateData.assignedTo?.id : updateData.assignedTo,
      };

      // Include labels if provided.
      // Contract: server expects `labels` to be string[] of label IDs (including empty array to clear all).
      if (Array.isArray(updateData.labelIds)) {
        updatePayload.labels = updateData.labelIds as string[];
      } else if (Array.isArray(updateData.labels)) {
        updatePayload.labels = (updateData.labels as any[]).map((l: any) => (typeof l === 'string' ? l : l?.id)).filter(Boolean);
      }

      const updatedTask = await apiClient.put<TaskUpdateReqDto, TaskResDto>(updateTaskByIdEndpoint(taskId), updatePayload);
      updateTask(updatedTask);
      setCurrentTask(updatedTask);
      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }, [updateTask, setCurrentTask]);

  const deleteTaskById = useCallback(async (taskId: string): Promise<void> => {
    try {
      await apiClient.delete(deleteTaskByIdEndpoint(taskId));
      removeTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }, [removeTask]);

  return {
    tasks,
    projectTasks,
    currentTask,
    loading,
    projectLoading,
    error,
    projectError,
    fetchMyTasks,
    fetchProjectTasks,
    fetchCurrentTask,
    addTask,
    updateTask,
    removeTask,
    createTask,
    updateTaskById,
    deleteTaskById,
  };
}
