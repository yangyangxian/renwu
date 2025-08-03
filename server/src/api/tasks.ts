import express from 'express';
import { taskService } from '../services/TaskService';
import { TaskResDto, TaskUpdateReqDto, TaskCreateReqDto, ApiResponse, PermissionAction, PermissionResourceType, ViewConfig } from '@fullstack/common';
import { TaskViewCreateReqDto, TaskViewUpdateReqDto, TaskViewResDto } from '@fullstack/common';
import { mapObject } from '../utils/mappers';
import { createApiResponse } from '../utils/apiUtils';
import logger from '../utils/logger';
import { requirePermission } from '../middlewares/permissionMiddleware';

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
  (req, res, next) => requirePermission(
    PermissionAction.DELETE_OTHERS_TASK,
    PermissionResourceType.TASK,
    req.params.taskId
  )(req, res, next),
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

router.get('/project/id/:projectId',
  async (
    req: express.Request<{ projectId: string }, {}, {}, {}>,
    res: express.Response<ApiResponse<TaskResDto[]>>,
    next: express.NextFunction
  ) => {
    const { projectId } = req.params;
    const tasks = await taskService.getTasksByProjectId(projectId);
    const data: TaskResDto[] = tasks.map(task => mapObject(task, new TaskResDto()));
    res.json(createApiResponse<TaskResDto[]>(data));
  }
);

publicRouter.get('/id/:taskId',
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

/**
 * @route GET /api/tasks/views
 * @returns {TaskViewResDto[]} 200 - List of task views for the current user
 */
router.get(
  '/views',
  async (
    req: express.Request,
    res: express.Response<ApiResponse<TaskViewResDto[]>>,
    next: express.NextFunction
  ) => {
    try {
      const userId = req.user!.userId;
      const views = await taskService.getTaskViewsByUser(userId);
      const data: TaskViewResDto[] = views.map(v => new TaskViewResDto(v.id, v.userId, v.name, v.viewConfig));
      res.json(createApiResponse<TaskViewResDto[]>(data));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route POST /api/tasks/views
 * @param {TaskViewCreateReqDto} req.body - Task view creation data
 * @returns {TaskViewResDto} 200 - Created task view
 */
router.post('/views', async (
  req: express.Request<{}, {}, TaskViewCreateReqDto>,
  res: express.Response<ApiResponse<TaskViewResDto>>,
  next
) => {
  try {
    const userId = req.user!.userId;
    const { name, viewConfig } = req.body;
    const created = await taskService.createTaskView(userId, name, viewConfig);
    logger.debug('Created task view:', created);
    const dto: TaskViewResDto = new TaskViewResDto(created.id, created.userId, created.name, created.viewConfig as ViewConfig);
    logger.debug('Created task view DTO:', dto);
    res.json(createApiResponse<TaskViewResDto>(dto));
  } catch (err) {
    next(err);
  }
});

/**
 * @route PUT /api/tasks/views/:viewId
 * @param {TaskViewUpdateReqDto} req.body - Task view update data
 * @returns {TaskViewResDto} 200 - Updated task view
 */
router.put('/views/:viewId', async (
  req: express.Request<{ viewId: string }, {}, TaskViewUpdateReqDto>,
  res: express.Response<ApiResponse<TaskViewResDto>>,
  next
) => {
  try {
    const userId = req.user!.userId;
    const { viewId } = req.params;
    const { name, viewConfig } = req.body;
    const updated = await taskService.updateTaskView(userId, viewId, { name, viewConfig });
    res.json(createApiResponse<TaskViewResDto>(
      new TaskViewResDto(updated.id, updated.userId, updated.name, updated.viewConfig as ViewConfig)));
  } catch (err) {
    next(err);
  }
});

/**
 * @route DELETE /api/tasks/views/:viewId
 * @returns {null} 200 - Task view deleted
 */
router.delete('/views/:viewId', async (
  req: express.Request<{ viewId: string }>,
  res: express.Response<ApiResponse<null>>,
  next
) => {
  try {
    const userId = req.user!.userId;
    const { viewId } = req.params;
    await taskService.deleteTaskView(userId, viewId);
    res.json(createApiResponse<null>(null));
  } catch (err) {
    next(err);
  }
});

export default router;
export { publicRouter };
