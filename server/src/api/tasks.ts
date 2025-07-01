import express from 'express';
import { taskService } from '../services/TaskService.js';
import { CustomError } from '../classes/CustomError.js';
import { ErrorCodes, TaskResDto } from '@fullstack/common';
import { mapObject } from '../utils/mappers.js';
import { createApiResponse } from '../utils/apiUtils.js';

const router = express.Router();

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
