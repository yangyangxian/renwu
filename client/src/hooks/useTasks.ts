import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/utils/APIClient";
import { TaskResDto, TaskCreateReqDto, TaskUpdateReqDto } from '@fullstack/common';
import { getMyTasks, getTasks, updateTaskById, deleteTaskById } from "@/apiRequests/apiEndpoints";

export function useTasks() {
  const [tasks, setTasks] = useState<TaskResDto[]>([]);

  const fetchTasks = useCallback(async () => {
      const data = await apiClient.get<TaskResDto[]>(getMyTasks());
      setTasks(data);
  }, []);

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const submitTask = async (task: any) => {
    if (task.id) {
      const updatePayload: TaskUpdateReqDto = {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        assignedTo: task.assignedTo,
        projectId: task.projectId,
      };
      await apiClient.put<TaskUpdateReqDto, TaskResDto>(updateTaskById(task.id), updatePayload);
      await fetchTasks();
    } else {
      const createPayload: TaskCreateReqDto = {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        assignedTo: task.assignedTo,
        projectId: task.projectId,
        createdBy: task.createdBy
      };
      await apiClient.post<TaskCreateReqDto, TaskResDto>(getTasks(), createPayload);
      await fetchTasks();
    }
  };

  const deleteTask = async (taskId: string) => {
    await apiClient.delete(deleteTaskById(taskId));
    await fetchTasks();
  };

  return {
    tasks,
    setTasks,
    fetchTasks,
    submitTask,
    deleteTask,
  };
}
