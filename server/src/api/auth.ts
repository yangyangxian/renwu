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
  LoginReqSchema
} from '@fullstack/common';
import appConfig from '../appConfig.js';
import { userService } from '../services/UserService.js';

const router = Router();

// Login endpoint
router.post('/login', (req: Request<LoginReqDto>, res: Response<ApiResponse<UserResDto>>, next: NextFunction) => {
  const loginHandler = async () => {
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
  loginHandler();
});

// Signup endpoint
router.post('/signup', (req: Request<LoginReqDto>, res: Response<ApiResponse<UserResDto>>, next: NextFunction) => {
  const signupHandler = async () => {
    try {
      const { email, password }: LoginReqDto = req.body;
      if (!email || !password) {
        throw new CustomError(
          'Email and password are required',
          ErrorCodes.MISSING_CREDENTIALS
        );
      }

      // Set name to empty string on signup; user must set it later
      const user = await userService.createUser({ name: '', email, password });
      const token = createJWT({
        userId: user.id,
        email: user.email,
        name: user.name
      });
      const isSecureCookie = appConfig.envMode === 'production' && req.secure;
      res.cookie('auth-token', token, {
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
        const user = req.user; // Global auth middleware sets this
        if (!user) {
            throw new CustomError(
                'User authentication failed',
                ErrorCodes.UNAUTHORIZED
            );
        }
        // Always fetch latest user info from DB
        const dbUser = await userService.getUserByEmail(user.email);
        if (!dbUser) {
            throw new CustomError('User not found', ErrorCodes.NOT_FOUND);
        }
        const userResDto: UserResDto = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email
        };
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

export default router;
