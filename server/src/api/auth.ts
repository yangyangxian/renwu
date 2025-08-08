import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { createJWT } from '../utils/jwt';
import { createApiResponse } from '../utils/apiUtils';
import { CustomError } from '../classes/CustomError';
import { 
  ApiResponse, 
  UserResDto, 
  LoginReqDto, 
  LogoutResDto, 
  ErrorCodes,
  LoginReqSchema,
  LoginResDto,
  ProjectRoleDto
} from '@fullstack/common';
import appConfig from '../appConfig.js';
import { userService } from '../services/UserService';
import { invitationService } from '../services/InvitationService';
import { projectService } from '../services/ProjectService';
import { PermissionService } from '../services/PermissionService';
import { getCachedValue, setCachedValue } from '../database/redisCache';
import { userInfoKey } from '../database/redisKeys';
import logger from '../utils/logger';

const router = Router();
const publicRouter = Router();

// Login endpoint
publicRouter.post('/login', (req: Request<LoginReqDto>, res: Response<ApiResponse<UserResDto>>, next: NextFunction) => {
  const loginHandler = async () => {
    res.setHeader('Cache-Control', 'private');
    try {
      const credentials : LoginReqDto = req.body;
      const result = LoginReqSchema.safeParse(credentials);
      if (!result.success) {
          throw new CustomError(result.error.issues.join(';'), ErrorCodes.INVALID_INPUT);
      }

      const user = await userService.getUserByEmail(credentials.email);
      if (!user || !user.password) {
        throw new CustomError(
          'Invalid credentials',
          ErrorCodes.INVALID_CREDENTIALS
        );
      }
      const isValidPassword = await bcrypt.compare(credentials.password, user.password!);
      if (!isValidPassword) {
        throw new CustomError(
          'Invalid credentials',
          ErrorCodes.INVALID_CREDENTIALS
        );
      }
      const token = createJWT({
        userId: user.id,
        email: user.email,
        name: user.name
      });
      const isSecureCookie = appConfig.envMode === 'production' && req.secure
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'strict',
        maxAge: appConfig.jwtMaxAge
      });
      const loginResDto = new LoginResDto({
        id: user.id,
        name: user.name,
        email: user.email,
        token
      });
      res.json(createApiResponse(loginResDto));
    } catch (error) {
      next(error);
    }
  };
  loginHandler();
});

// Signup endpoint
publicRouter.post('/signup', (req: Request<LoginReqDto>, res: Response<ApiResponse<UserResDto>>, next: NextFunction) => {
  const signupHandler = async () => {
    res.setHeader('Cache-Control', 'private');
    try {
      const { email, password, token }: LoginReqDto & { token?: string } = req.body;
      if (!email || !password) {
        throw new CustomError(
          'Email and password are required',
          ErrorCodes.MISSING_CREDENTIALS
        );
      }

      // If token is present, verify invitation before creating user
      let invitation = null;
      if (token) {
        invitation = await invitationService.validateInvitationForSignup(token, email);
      }

      // Set name to empty string on signup; user must set it later
      const user = await userService.createUser({ name: '', email, password });
      if (token && invitation) {
        await invitationService.acceptInvitation(invitation.id, email, user.id);
        // Add user to project if invited to a project
        if (invitation.projectId) {
          await projectService.addMemberToProject(
            invitation.projectId,
            user.id,
            invitation.roleId! // Use default role if not specified
          );
        }
      }

      const jwtToken = createJWT({
        userId: user.id,
        email: user.email,
        name: user.name
      });
      const isSecureCookie = appConfig.envMode === 'production' && req.secure;
      res.cookie('auth-token', jwtToken, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'strict',
        maxAge: appConfig.jwtMaxAge
      });
      
      const userResDto: UserResDto = {
        id: user.id,
        name: user.name,
        email: user.email
      };
      res.json(createApiResponse<UserResDto>(userResDto));
    } catch (error) {
      next(error);
    }
  };
  signupHandler();
});

// Get current user (auth status check) - Protected by global auth middleware
router.get('/me', async (req: Request, res: Response<ApiResponse<UserResDto>>, next: NextFunction) => {
    try {
        logger.debug('auth/me endpoint hit');
        const user = req.user;
        if (!user) throw new CustomError('User authentication failed', ErrorCodes.UNAUTHORIZED);


        const cacheKey = userInfoKey(user.email);
        let userResDto = await getCachedValue<UserResDto>(cacheKey);

        if (userResDto === undefined) {
            const dbUser = await userService.getUserByEmail(user.email);
            if (!dbUser) throw new CustomError('User not found', ErrorCodes.UNAUTHORIZED);
            userResDto = {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email
            };
            await setCachedValue(cacheKey, userResDto);
        }

        res.json(createApiResponse<UserResDto>(userResDto));
    } catch (err) {
        next(err);
    }
  });

// Logout endpoint
router.post('/logout', (req: Request, res: Response<ApiResponse<LogoutResDto>>, next: NextFunction) => {

    res.clearCookie('auth-token', {
        httpOnly: true,
        secure: appConfig.envMode === 'production',
        sameSite: 'strict'
    });

    const logoutResDto: LogoutResDto = { message: 'Logged out successfully' };
    res.json(createApiResponse<LogoutResDto>(logoutResDto));

});

// GET /api/auth/roles - fetch all project roles
router.get('/roles', async (req: Request, res: Response<ApiResponse<ProjectRoleDto[]>>) => {
    const dbRoles = await PermissionService.getAllRoles();
    const roles = dbRoles.map((r: any) => new ProjectRoleDto(r));
    res.json(createApiResponse<ProjectRoleDto[]>(roles));
});

export default router;
export { publicRouter };
