import express, { NextFunction, Request, Response } from 'express';
import { ProjectMemberEntity, projectService } from '../services/ProjectService';
import { userService } from '../services/UserService';
import { CustomError } from '../classes/CustomError';
import { createApiResponse } from '../utils/apiUtils';
import { mapObject } from '../utils/mappers';
import { ProjectCreateReqDto, ProjectResDto, ApiResponse, ErrorCodes, ProjectRole, ProjectMemberResDto } from '@fullstack/common';
import { emailService } from '../services/EmailService';
import { ProjectCreateReqSchema, ProjectUpdateReqDto, ProjectMemberRoleUpdateReqDto } from '@fullstack/common';
import { ProjectAddMemberReqDto, ProjectAddMemberResDto } from '@fullstack/common';
import logger from '../utils/logger';
import { invitationService } from '../services/InvitationService';

// Project API Router
// Each endpoint below is documented with its purpose, parameters, and response structure.
const router = express.Router();

/**
 * GET /api/projects/id/:id
 * Fetch a project by its ID.
 * Params: id (string, required)
 * Response: ApiResponse<ProjectResDto | null> (project details and members, or null if not found)
 */
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
    // Map members to ProjectMemberResDto, sorted alphabetically by name
    dto.members = project.members
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map((member: ProjectMemberEntity) => mapObject(member, new ProjectMemberResDto()));
    res.json(createApiResponse<ProjectResDto>(dto));
  }
);

// POST /api/projects - create a new project and add the current user as owner
/**
 * POST /api/projects
 * Create a new project and add the current user as owner/member.
 * Body: ProjectCreateReqDto (name, slug, description)
 * Response: ApiResponse<ProjectResDto> (created project details and members)
 */
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
    dto.members = project.members.map((member: ProjectMemberEntity) => mapObject(member, new ProjectMemberResDto()));
    res.json(createApiResponse<ProjectResDto>(dto));
  }
);

// GET /api/projects/me - get projects for the current user
/**
 * GET /api/projects/me
 * Get all projects for the current user.
 * Response: ApiResponse<ProjectResDto[]> (array of projects with members)
 */
router.get('/me', async (req, res) => {
  const userId = req.user!.userId;
  const projects = await projectService.getProjectsByUserId(userId);
  // Map each project to ProjectResDto, including members
  const data: ProjectResDto[] = projects.map((project) => {
    const dto = mapObject(project, new ProjectResDto());
    dto.members = project.members.map((member: ProjectMemberEntity) => mapObject(member, new ProjectMemberResDto()));
    return dto;
  });
  res.json(createApiResponse<ProjectResDto[]>(data));
});

// PUT /api/projects/:id - update project details (name, description, slug)
/**
 * PUT /api/projects/:id
 * Update project details (name, description, slug).
 * Params: id (string, required)
 * Body: ProjectUpdateReqDto (name, description, slug)
 * Response: ApiResponse<ProjectResDto> (updated project details and members)
 */
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
    dto.members = updatedProject.members.map((member: ProjectMemberEntity) => mapObject(member, new ProjectMemberResDto()));
    res.json(createApiResponse<ProjectResDto>(dto));
  }
);

// GET /api/projects/check-slug/:slug - check if slug is available
/**
 * GET /api/projects/check-slug/:slug
 * Check if a project slug is available (not used by any project).
 * Params: slug (string, required)
 * Response: ApiResponse<{ available: boolean }>
 */
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
/**
 * DELETE /api/projects/:id
 * Delete a project (only allowed for project owner).
 * Params: id (string, required)
 * Response: ApiResponse<{ success: boolean }>
 */
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
/**
 * POST /api/projects/:projectId/members
 * Add a member to a project by email and role.
 * Params: projectId (string, required)
 * Body: ProjectAddMemberReqDto (email, role)
 * Response: ApiResponse<ProjectAddMemberResDto> (success, invited)
 * If user does not exist, sends invitation email.
 */
router.post(
  '/:projectId/members',
  async (
    req: Request<{ projectId: string }, {}, ProjectAddMemberReqDto>,
    res: Response<ApiResponse<ProjectAddMemberResDto>>,
    next: NextFunction
  ) => {
    const { projectId } = req.params;
    const { email, roleId } = req.body;
    if (!projectId || !email || !roleId) {
      throw new CustomError('Project ID, email, and role are required', ErrorCodes.NO_DATA);
    }
    const user = await userService.getUserByEmail(email);

    if (!user) {
      // Insert invitation into the invitations table (token/expiration handled in service)
      let token: string = '';
      try {
        token = await invitationService.insertInvitation({
          email,
          inviterId: req.user!.userId,
          projectId,
          roleId: roleId,
        });
      } catch (err) {
        logger.error('Failed to insert invitation:', err);
        throw new CustomError('Failed to create invitation', ErrorCodes.INTERNAL_ERROR);
      }

      // Send invitation email to non-user
      let invited = false;
      try {
        logger.debug(`Inviting user by email: ${email}`);
        await emailService.sendEmail({
          to: email,
          subject: 'You have been invited to join a project',
          html: `<p>You have been invited to join a project on Renwu.<br/>Click <a href="http://localhost:5173/signup?token=${token}">here</a> to accept the invitation.</p>`,
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

    logger.debug('Adding member to project:', { projectId, userId: user.id, roleId });
    // Add member to project
    const success = await projectService.addMemberToProject(projectId, user.id, roleId);
    const dto = new ProjectAddMemberResDto();
    dto.success = success;
    res.json(createApiResponse<ProjectAddMemberResDto>(dto));
  }
);

/**
 * PUT /api/projects/:projectId/members/:memberId/role
 * Update a member's role in a project.
 * Params: projectId (string, required), memberId (string, required)
 * Body: ProjectMemberRoleUpdateReqDto (role)
 * Response: ApiResponse<{ success: boolean }>
 */
router.put(
  '/:projectId/members/:memberId/role',
  async (
    req: Request<{ projectId: string; memberId: string }, {}, ProjectMemberRoleUpdateReqDto>,
    res: Response<ApiResponse<{ success: boolean }>>,
    next: NextFunction
  ) => {
    // projectId and memberId are UUIDs
    const { projectId, memberId } = req.params;
    const { roleId, roleName } = req.body;

    if (!projectId || !memberId || !roleId || !roleName) {
      throw new CustomError('Project ID, member ID, and role are required', ErrorCodes.NO_DATA);
    }
    // Directly update member role (no permission check)
    const success = await projectService.updateMemberRole(projectId, memberId, roleId, roleName);

    if (!success) {
      throw new CustomError('Failed to update member role', ErrorCodes.INTERNAL_ERROR);
    }

    res.json(createApiResponse<{ success: boolean }>({ success: true }));
  }
);

export default router;
