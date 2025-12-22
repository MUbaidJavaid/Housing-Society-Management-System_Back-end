import { NextFunction, Response } from 'express';

import { AppError } from './error.middleware';
// Quick fix - define AuthRequest inline
interface AuthRequest extends Request {
  user?: {
    userId: any;
    email: string;
    role: string;
    emailVerified: boolean;
    exp?: number;
  };
}
export const requireEmailVerification = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  // Check if email is verified (you need to fetch user from DB)
  // This should be implemented based on your user model
  if (req.user.emailVerified === false) {
    throw new AppError(403, 'Email verification required');
  }

  next();
};
