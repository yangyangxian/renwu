import express from 'express';
import { projectService } from '../services/ProjectService.js';
import { createApiResponse } from '../utils/apiUtils.js';
import { ProjectResDto } from '@fullstack/common';
import { mapObject } from '../utils/mappers.js';

const router = express.Router();

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
