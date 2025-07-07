import express, { Request, Response } from 'express';
import { projectService } from '../services/ProjectService.js';
import { CustomError } from '../classes/CustomError.js';
import { createApiResponse } from '../utils/apiUtils.js';
import { mapObject } from '../utils/mappers.js';
import { ProjectCreateReqDto, ProjectResDto, ApiResponse, ErrorCodes } from '@fullstack/common';


const router = express.Router();

// POST /api/projects - create a new project and add the current user as owner
router.post(
  '/',
  async (
    req: Request<{}, {}, ProjectCreateReqDto>,
    res: Response<ApiResponse<ProjectResDto>>
  ) => {
    const userId = req.user!.userId;
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new CustomError('Project name is required', ErrorCodes.NO_DATA);
    }
    // Create project and add user as owner/member
    const project = await projectService.createProject({
      name: name.trim(),
      description: description || '',
      ownerId: userId,
    });
    const dto = mapObject(project, new ProjectResDto());
    dto.members = project.members;
    res.status(201).json(createApiResponse<ProjectResDto>(dto));
  }
);

// GET /api/projects/me - get projects for the current user
router.get('/me', async (req, res) => {
  const userId = req.user!.userId;
  const projects = await projectService.getProjectsByUserId(userId);
  // Map each project to ProjectResDto, including members
  const data: ProjectResDto[] = projects.map((project) => {
    const dto = mapObject(project, new ProjectResDto());
    dto.members = project.members;
    return dto;
  });
  res.json(createApiResponse<ProjectResDto[]>(data));
});

export default router;
