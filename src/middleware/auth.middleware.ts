// src/middleware/auth.middleware.ts
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
// Import the instance, not the class
import { jwtService } from '../auth/jwt'; // Import the singleton instance
import { AppLogger } from '../core/logger';

const logger = new AppLogger('AuthMiddleware');

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted - call instance method
    if (await jwtService.isTokenBlacklisted(token)) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Token has been revoked',
      });
      return;
    }

    // Verify access token - call instance method
    const payload = jwtService.verifyAccessToken(token);

    if (!payload) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    req.user = {
      userId: payload.userId.toString(),
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};
