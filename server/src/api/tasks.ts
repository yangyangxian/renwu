import express from 'express';
import { taskService } from '../services/TaskService.js';
import { CustomError } from '../classes/CustomError.js';
import { ErrorCodes, TaskResDto, TaskUpdateReqDto, TaskCreateReqDto, ApiResponse } from '@fullstack/common';
import { mapObject } from '../utils/mappers.js';
import { createApiResponse } from '../utils/apiUtils.js';

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
      res.json(createApiResponse<TaskResDto>(mapObject(createdTask, new TaskResDto())));
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
      res.json(createApiResponse<TaskResDto>(mapObject(updatedTask, new TaskResDto())));
  }
);

router.get('/me', async (req, res, next) => {
    const userId = req.user!.userId;
    const tasks = await taskService.getTasksByUserId(userId);
    if (tasks.length === 0) {
        throw new CustomError("No tasks found for this user", ErrorCodes.NOT_FOUND);
    }
    const data: TaskResDto[] = tasks.map(task => mapObject(task, new TaskResDto()));
    res.json(createApiResponse<TaskResDto[]>(data));
});

export default router;
