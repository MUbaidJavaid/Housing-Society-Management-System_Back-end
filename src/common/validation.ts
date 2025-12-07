// src/common/validation.ts
import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

export const validate = (schema: ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = (error as any).issues.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      next(error);
    }
  };
};

// Example validation schemas
import { z } from 'zod';

export const authSchemas = {
  register: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
      name: z.string().min(2, 'Name must be at least 2 characters'),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  refreshToken: z.object({
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
  }),
};
