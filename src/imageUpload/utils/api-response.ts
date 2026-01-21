// backend/src/shared/utils/api-response.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export function createApiResponse<T = any>(data: T, message: string = 'Success'): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}
