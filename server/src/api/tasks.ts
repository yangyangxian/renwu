import express from 'express';
import { taskService } from '../services/TaskService';
import { TaskResDto, TaskUpdateReqDto, TaskCreateReqDto, ApiResponse } from '@fullstack/common';
import { mapObjectDeep } from '../utils/mappers';
import { createApiResponse } from '../utils/apiUtils';

const router = express.Router();

// Create a new task
router.post('/',
  async (
    req: express.Request<{}, {}, TaskCreateReqDto>,
    res: express.Response<ApiResponse<TaskResDto>>,
    next: express.NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const createdTask = await taskService.createTask({ ...req.body, createdBy: userId });
      res.json(createApiResponse<TaskResDto>(mapObjectDeep(createdTask, new TaskResDto())));
    } catch (err) {
      next(err);
    }
  }
);

// Update a task by ID
router.put('/:taskId',
  async (
    req: express.Request<{ taskId: string }, {}, TaskUpdateReqDto>,
    res: express.Response<ApiResponse<TaskResDto>>,
    next: express.NextFunction
  ) => {
      const { taskId } = req.params;
      const updatedTask = await taskService.updateTask(taskId, req.body);
      // Map to DTO for type safety
      res.json(createApiResponse<TaskResDto>(mapObjectDeep(updatedTask, new TaskResDto())));
  }
);

// Delete a task by ID
router.delete('/:taskId',
  async (
    req: express.Request<{ taskId: string }>,
    res: express.Response<ApiResponse<null>>,
    next: express.NextFunction
  ) => {
    try {
      const { taskId } = req.params;
      await taskService.deleteTask(taskId);
      res.json(createApiResponse<null>(null));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', async (req, res, next) => {
    const userId = req.user!.userId;
    const tasks = await taskService.getTasksByUserId(userId);
    const data: TaskResDto[] = tasks.map(task => mapObjectDeep(task, new TaskResDto()));
    res.json(createApiResponse<TaskResDto[]>(data));
});

router.get('/project/:projectId',
  async (
    req: express.Request<{ projectId: string }, {}, {}, {}>,
    res: express.Response<ApiResponse<TaskResDto[]>>,
    next: express.NextFunction
  ) => {
    const { projectId } = req.params;
    const tasks = await taskService.getTasksByProjectId(projectId);
    const data: TaskResDto[] = tasks.map(task => mapObjectDeep(task, new TaskResDto()));
    res.json(createApiResponse<TaskResDto[]>(data));
  }
);

export default router;
