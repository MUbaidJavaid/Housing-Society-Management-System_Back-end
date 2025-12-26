// middleware/google.auth.middleware.ts
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
export const validateGoogleCallback = (req: Request, _res: Response, next: NextFunction): void => {
  const { code, state } = req.body;

  if (!code) {
    throw new AppError(400, 'Authorization code is required');
  }

  // Validate state parameter to prevent CSRF
  if (state && !isValidState(state)) {
    throw new AppError(400, 'Invalid state parameter');
  }

  // Validate code format
  if (typeof code !== 'string' || code.length > 1000) {
    throw new AppError(400, 'Invalid authorization code');
  }

  next();
};

// State validation function
const isValidState = (state: string): boolean => {
  // Implement state validation logic
  // Could check against stored states in session or database
  return typeof state === 'string' && state.length <= 500;
};
