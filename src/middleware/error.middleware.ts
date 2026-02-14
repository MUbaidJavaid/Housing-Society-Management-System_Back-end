// src/middleware/error.middleware.ts
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppLogger } from '../core/logger';

const logger = new AppLogger('ErrorMiddleware');

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Errors from validation middlewares (e.g. express-validator) that
  // attach a statusCode and optional data payload
  const anyError = error as any;
  if (anyError.statusCode && typeof anyError.statusCode === 'number') {
    return res.status(anyError.statusCode).json({
      success: false,
      error: error.message,
      ...(anyError.data && { data: anyError.data }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Validation failed',
      details: error.message,
    });
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: 'Duplicate key error',
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Invalid token',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Token expired',
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error:', error);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      message: error.message,
      stack: error.stack,
    }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
};
