import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/utils/APIClient";
import { TaskResDto, TaskCreateReqDto, TaskUpdateReqDto } from '@fullstack/common';
import { getMyTasks, getTasks, updateTaskById, deleteTaskById } from "@/apiRequests/apiEndpoints";

export function useTasks() {
  const [tasks, setTasks] = useState<TaskResDto[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await apiClient.get<TaskResDto[]>(getMyTasks());
      setTasks(data);
    } catch {
      // Optionally handle error
    }
  }, []);

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: TaskCreateReqDto) => {
    await apiClient.post<TaskCreateReqDto, TaskResDto>(getTasks(), task);
    await fetchTasks();
  };

  const updateTask = async (taskId: string, updatePayload: TaskUpdateReqDto) => {
    await apiClient.put<TaskUpdateReqDto, TaskResDto>(updateTaskById(taskId), updatePayload);
    await fetchTasks();
  };

  const deleteTask = async (taskId: string) => {
    await apiClient.delete(deleteTaskById(taskId));
    await fetchTasks();
  };

  return {
    tasks,
    setTasks,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
  };
}
