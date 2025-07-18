import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/utils/APIClient";
import { TaskResDto, TaskCreateReqDto, TaskUpdateReqDto } from '@fullstack/common';
import { getMyTasks, getTasks, updateTaskById, deleteTaskById, getTasksByProjectId } from "@/apiRequests/apiEndpoints";
import { withToast } from "@/utils/toastUtils";
import logger from "@/utils/logger";

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<TaskResDto[]>([]);

  const fetchTasks = useCallback(async () => {
    let fetchedTasks: TaskResDto[] = [];
    if (projectId) {
      fetchedTasks = await apiClient.get<TaskResDto[]>(getTasksByProjectId(projectId));
    } else {
      fetchedTasks = await apiClient.get<TaskResDto[]>(getMyTasks());
    }
    logger.debug('Fetched tasks:', fetchedTasks);
    setTasks(fetchedTasks);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const submitTask = async (task: any) => {
    if (task.id) {
      await withToast(
        async () => {
          const updatePayload: TaskUpdateReqDto = {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            status: task.status,
            assignedTo: typeof task.assignedTo === 'object' ? task.assignedTo?.id : task.assignedTo,
            projectId: task.projectId,
          };
          await apiClient.put<TaskUpdateReqDto, TaskResDto>(updateTaskById(task.id), updatePayload);
          await fetchTasks();
        },
        {
          success: 'Task updated!',
          error: 'Failed to update task.'
        }
      );
    } else {
      await withToast(
        async () => {
          const createPayload: TaskCreateReqDto = {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            status: task.status,
            assignedTo: typeof task.assignedTo === 'object' ? task.assignedTo?.id : task.assignedTo,
            projectId: task.projectId,
            createdBy: task.createdBy
          };
          await apiClient.post<TaskCreateReqDto, TaskResDto>(getTasks(), createPayload);
          await fetchTasks();
        },
        {
          success: 'Task added!',
          error: 'Failed to create task.'
        }
      );
    }
  };

  const deleteTask = async (taskId: string) => {
    await withToast(
      async () => {
        await apiClient.delete(deleteTaskById(taskId));
        await fetchTasks();
      },
      {
        success: 'Task deleted!',
        error: 'Failed to delete task.'
      }
    );
  };

  return {
    tasks,
    setTasks,
    fetchTasks,
    submitTask,
    deleteTask,
  };
}
