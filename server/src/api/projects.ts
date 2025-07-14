import express, { NextFunction, Request, Response } from 'express';
import { projectService } from '../services/ProjectService';
import { CustomError } from '../classes/CustomError';
import { createApiResponse } from '../utils/apiUtils';
import { mapObject } from '../utils/mappers';
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
    res.json(createApiResponse<ProjectResDto>(dto));
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

router.get('/:id', async (req: Request<{ id: string }>, res: Response<ApiResponse<ProjectResDto | null>>, next: NextFunction) => {
    const { id } = req.params;
    if (!id) {
      throw new CustomError('Project ID is required', ErrorCodes.NO_DATA);
    }

    // Fetch project by ID
    const project = await projectService.getProjectById(id);
    if (!project) {
      // Return 200 with data: null (not an error, just not found)
      res.json(createApiResponse<ProjectResDto | null>(null));
      return;
    }
    const dto = mapObject(project, new ProjectResDto());
    dto.members = project.members;
    res.json(createApiResponse<ProjectResDto>(dto));
  }
);

// PUT /api/projects/:id - update project details (name, description)
router.put(
  '/:id',
  async (
    req: Request<{ id: string }, {}, { name?: string; description?: string }>,
    res: Response<ApiResponse<ProjectResDto>>,
    next: NextFunction
  ) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, description } = req.body;

    if (!id) {
      throw new CustomError('Project ID is required', ErrorCodes.NO_DATA);
    }

    if (name && (typeof name !== 'string' || !name.trim())) {
      throw new CustomError('Project name must be a non-empty string', ErrorCodes.NO_DATA);
    }

    // Update project details
    const updatedProject = await projectService.updateProject(id, {
      name: name?.trim(),
      description: description || undefined,
    });

    if (!updatedProject) {
      throw new CustomError('Project not found or update failed', ErrorCodes.NOT_FOUND);
    }

    const dto = mapObject(updatedProject, new ProjectResDto());
    dto.members = updatedProject.members;
    res.json(createApiResponse<ProjectResDto>(dto));
  }
);

export default router;
