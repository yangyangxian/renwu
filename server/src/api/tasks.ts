import express from 'express';
import { taskService } from '../services/TaskService';
import { TaskResDto, TaskUpdateReqDto, TaskCreateReqDto, ApiResponse } from '@fullstack/common';
import { mapObject } from '../utils/mappers';
import { createApiResponse } from '../utils/apiUtils';
import logger from 'src/utils/logger';

const router = express.Router();
const publicRouter = express.Router();

// Create a new task
router.post('/',
  async (
    req: express.Request<{}, {}, TaskCreateReqDto>,
    res: express.Response<ApiResponse<TaskResDto>>,
    next: express.NextFunction
  ) => {
    try {
      logger.debug('Creating task with body:', req.params);
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


router.get('/project/:projectSlug',
  async (
    req: express.Request<{ projectSlug: string }, {}, {}, {}>,
    res: express.Response<ApiResponse<TaskResDto[]>>,
    next: express.NextFunction
  ) => {
    const { projectSlug } = req.params;
    const tasks = await taskService.getTasksByProjectSlug(projectSlug);
    const data: TaskResDto[] = tasks.map(task => mapObject(task, new TaskResDto()));
    res.json(createApiResponse<TaskResDto[]>(data));
  }
);

publicRouter.get('/:taskId',
  async (
    req: express.Request<{ taskId: string }>,
    res: express.Response<ApiResponse<TaskResDto>>,
    next: express.NextFunction
  ) => {

    try {
      const task = await taskService.getTaskById(req.params.taskId);
      res.json(createApiResponse<TaskResDto>(task ? mapObject(task, new TaskResDto()) : undefined));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
export { publicRouter };
