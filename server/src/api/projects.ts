import express, { NextFunction, Request, Response } from 'express';
import { projectService } from '../services/ProjectService';
import { userService } from '../services/UserService';
import { CustomError } from '../classes/CustomError';
import { createApiResponse } from '../utils/apiUtils';
import { mapObject } from '../utils/mappers';
import { ProjectCreateReqDto, ProjectResDto, ApiResponse, ErrorCodes } from '@fullstack/common';
import { emailService } from '../services/EmailService';
import { ProjectCreateReqSchema, ProjectUpdateReqDto, ProjectMemberRoleUpdateReqDto } from '@fullstack/common';
import { ProjectAddMemberReqDto, ProjectAddMemberResDto } from '@fullstack/common';
import logger from '../utils/logger';

const router = express.Router();

router.get('/id/:id', async (req: Request<{ id: string }>, res: Response<ApiResponse<ProjectResDto | null>>, next: NextFunction) => {
    const { id } = req.params;
    if (!id) {
      throw new CustomError('Project ID is required', ErrorCodes.NO_DATA);
    }
    // Fetch project by id
    const project = await projectService.getProjectById(id);
    if (!project) {
      res.json(createApiResponse<ProjectResDto | null>(null));
      return;
    }
    const dto = mapObject(project, new ProjectResDto());
    dto.members = project.members;
    res.json(createApiResponse<ProjectResDto>(dto));
  }
);

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
    req: Request<{ id: string }, {}, ProjectUpdateReqDto>,
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

// POST /api/projects/:projectId/members - add a member to a project
router.post(
  '/:projectId/members',
  async (
    req: Request<{ projectId: string }, {}, ProjectAddMemberReqDto>,
    res: Response<ApiResponse<ProjectAddMemberResDto>>,
    next: NextFunction
  ) => {
    const { projectId } = req.params;
    const { email, role } = req.body;
    if (!projectId || !email || !role) {
      throw new CustomError('Project ID, email, and role are required', ErrorCodes.NO_DATA);
    }
    const user = await userService.getUserByEmail(email);

    if (!user) {
      // Send invitation email to non-user
      let invited = false;
      try {
        logger.debug(`Inviting user by email: ${email}`);
        await emailService.sendEmail({
          to: email,
          subject: 'You have been invited to join a project',
          html: `<p>You have been invited to join a project on Renwu. Please sign up to join the team!</p>`,
        });
        invited = true;
      } catch (err) {
        logger.error('Failed to send invitation email:', err);
        invited = false;
      }
      // Return correct success status based on email sending result
      const dto = new ProjectAddMemberResDto();
      dto.success = invited;
      dto.invited = invited;
      res.json(createApiResponse<ProjectAddMemberResDto>(dto));
      return;
    }

    logger.debug('Adding member to project:', { projectId, userId: user.id, role });
    // Add member to project
    const success = await projectService.addMemberToProject(projectId, user.id, role);
    const dto = new ProjectAddMemberResDto();
    dto.success = success;
    res.json(createApiResponse<ProjectAddMemberResDto>(dto));
  }
);

router.put(
  '/:projectId/members/:memberId/role',
  async (
    req: Request<{ projectId: string; memberId: string }, {}, ProjectMemberRoleUpdateReqDto>,
    res: Response<ApiResponse<{ success: boolean }>>,
    next: NextFunction
  ) => {
    // projectId and memberId are UUIDs
    const { projectId, memberId } = req.params;
    const { role } = req.body;

    if (!projectId || !memberId || !role) {
      throw new CustomError('Project ID, member ID, and role are required', ErrorCodes.NO_DATA);
    }

    // Directly update member role (no permission check)
    const success = await projectService.updateMemberRole(projectId, memberId, role);

    if (!success) {
      throw new CustomError('Failed to update member role', ErrorCodes.INTERNAL_ERROR);
    }

    res.json(createApiResponse<{ success: boolean }>({ success: true }));
  }
);

export default router;
