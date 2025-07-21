import express, { NextFunction, Request, Response } from 'express';
import { projectService } from '../services/ProjectService';
import { CustomError } from '../classes/CustomError';
import { createApiResponse } from '../utils/apiUtils';
import { mapObject } from '../utils/mappers';
import { ProjectCreateReqDto, ProjectResDto, ApiResponse, ErrorCodes } from '@fullstack/common';
import { ProjectCreateReqSchema } from '@fullstack/common';


const router = express.Router();

// POST /api/projects - create a new project and add the current user as owner
router.post(
  '/',
  async (
    req: Request<{}, {}, ProjectCreateReqDto>,
    res: Response<ApiResponse<ProjectResDto>>
  ) => {
    const userId = req.user!.userId;
    // Validate request body using Zod schema
    const parseResult = ProjectCreateReqSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
      throw new CustomError(errorMsg, ErrorCodes.INVALID_INPUT);
    }
    const { name, slug, description } = parseResult.data;
    // Create project and add user as owner/member
    const project = await projectService.createProject({
      name: name.trim(),
      slug: slug.trim(),
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

router.get('/:slug', async (req: Request<{ slug: string }>, res: Response<ApiResponse<ProjectResDto | null>>, next: NextFunction) => {
    const { slug } = req.params;
    if (!slug) {
      throw new CustomError('Project slug is required', ErrorCodes.NO_DATA);
    }

    // Fetch project by slug
    const project = await projectService.getProjectBySlug(slug);
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

// PUT /api/projects/:id - update project details (name, description, slug)
router.put(
  '/:id',
  async (
    req: Request<{ id: string }, {}, { name?: string; description?: string; slug?: string }>,
    res: Response<ApiResponse<ProjectResDto>>,
    next: NextFunction
  ) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, description, slug } = req.body;

    if (!id) {
      throw new CustomError('Project ID is required', ErrorCodes.NO_DATA);
    }

    if (name && (typeof name !== 'string' || !name.trim())) {
      throw new CustomError('Project name must be a non-empty string', ErrorCodes.NO_DATA);
    }

    if (slug && (typeof slug !== 'string' || !slug.trim())) {
      throw new CustomError('Project slug must be a non-empty string', ErrorCodes.NO_DATA);
    }

    // Update project details
    const updatedProject = await projectService.updateProject(id, {
      name: name?.trim(),
      description: description || undefined,
      slug: slug?.trim(),
    });

    if (!updatedProject) {
      throw new CustomError('Project not found or update failed', ErrorCodes.NOT_FOUND);
    }

    const dto = mapObject(updatedProject, new ProjectResDto());
    dto.members = updatedProject.members;
    res.json(createApiResponse<ProjectResDto>(dto));
  }
);

// GET /api/projects/check-slug/:slug - check if slug is available
router.get(
  '/check-slug/:slug',
  async (
    req: Request<{ slug: string }>,
    res: Response<ApiResponse<{ available: boolean }>>,
    next: NextFunction
  ) => {
    const { slug } = req.params;

    if (!slug) {
      throw new CustomError('Slug is required', ErrorCodes.NO_DATA);
    }

    try {
      const existingProject = await projectService.getProjectBySlug(slug);
      res.json(createApiResponse<{ available: boolean }>({ 
        available: !existingProject 
      }));
    } catch (error) {
      console.error('Failed to check slug availability:', error);
      throw new CustomError('Failed to check slug availability', ErrorCodes.INTERNAL_ERROR);
    }
  }
);

// DELETE /api/projects/:id - delete project
router.delete(
  '/:id',
  async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<{ success: boolean }>>,
    next: NextFunction
  ) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!id) {
      throw new CustomError('Project ID is required', ErrorCodes.NO_DATA);
    }

    // Check if user has permission to delete this project (project owner)
    const project = await projectService.getProjectById(id);
    if (!project) {
      throw new CustomError('Project not found', ErrorCodes.NOT_FOUND);
    }

    if (project.createdBy !== userId) {
      throw new CustomError('Only project owners can delete projects', ErrorCodes.UNAUTHORIZED);
    }

    // Delete the project
    const success = await projectService.deleteProject(id);
    
    if (!success) {
      throw new CustomError('Failed to delete project', ErrorCodes.INTERNAL_ERROR);
    }

    res.json(createApiResponse<{ success: boolean }>({ success: true }));
  }
);

export default router;
