// backend/src/shared/utils/error-handler.ts
export class ApiError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details: any;

  constructor(statusCode: number, errorCode: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'ApiError';

    Error.captureStackTrace(this, this.constructor);
  }
}

export function createApiError(
  statusCode: number,
  errorCode: string,
  message: string,
  details?: any
): ApiError {
  return new ApiError(statusCode, errorCode, message, details);
}

export function handleAsync(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
