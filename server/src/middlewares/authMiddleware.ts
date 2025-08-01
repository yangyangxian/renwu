import { Request, Response, NextFunction } from 'express';
import { verifyJWT, JWTPayload } from '../utils/jwt';
import { ErrorCodes } from '@fullstack/common';
import { CustomError } from '../classes/CustomError';
import logger from 'src/utils/logger';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function globalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  authenticateJWT(req, res, next);
}

function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  try {
    // Try to get token from cookie first (for browsers)
    let token = req.cookies?.['auth-token'];
    
    // If no cookie, try Authorization header (for API clients)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      const error = new CustomError(
        'Access token required',
        ErrorCodes.UNAUTHORIZED
      );
      return next(error);
    }
    
    const payload = verifyJWT(token);
    req.user = payload;
    if (!req.user || !req.user.userId) {
      const error = new CustomError(
        'Invalid access token',
        ErrorCodes.UNAUTHORIZED
      );
    }
    next();
    
  } catch (error) {
    next(error);
  }
}
