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
  // If using Drizzle's join, projects will be an array of { projects: ..., project_members: ... }
  const data: ProjectResDto[] = projects.map((row: any) => mapObject(row.projects, new ProjectResDto()));
  res.json(createApiResponse<ProjectResDto[]>(data));
});

export default router;
