import { NextFunction, Request, Response } from 'express';

// Async handler wrapper for Express routes
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Async handler with specific error handling
export function asyncHandlerWithError(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  errorHandler?: (error: Error, req: Request, res: Response, next: NextFunction) => void
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error as Error, req, res, next);
      } else {
        next(error);
      }
    }
  };
}

// Async middleware handler
export function asyncMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(middleware(req, res, next)).catch(next);
  };
}

// Handle multiple async operations with error aggregation
export function asyncAll(
  handlers: Array<(req: Request, res: Response, next: NextFunction) => Promise<any>>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: Error[] = [];

    for (const handler of handlers) {
      try {
        await handler(req, res, next);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      // If there are errors, pass the first one to the error handler
      next(errors[0]);
    }
  };
}

// Timeout wrapper for async operations
export function withTimeout(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  timeoutMs: number
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      await Promise.race([fn(req, res, next), timeoutPromise]);
    } catch (error) {
      next(error);
    }
  };
}

// Retry wrapper for async operations
export function withRetry(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
    shouldRetry?: (error: Error, attempt: number) => boolean;
  } = {}
) {
  const { retries = 3, delay = 100, backoff = 2, shouldRetry = () => true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn(req, res, next);
      } catch (error) {
        lastError = error as Error;

        if (attempt === retries || !shouldRetry(error as Error, attempt)) {
          break;
        }

        // Wait before retrying
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    next(lastError!);
  };
}
