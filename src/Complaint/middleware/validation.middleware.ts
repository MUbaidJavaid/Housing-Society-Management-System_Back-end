// This file should NOT import anything from routes
import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    const error = new Error(`Validation failed: ${JSON.stringify(errorMessages)}`);
    (error as any).statusCode = 400;
    (error as any).data = { errors: errorMessages };
    throw error;
  }
  next();
};
