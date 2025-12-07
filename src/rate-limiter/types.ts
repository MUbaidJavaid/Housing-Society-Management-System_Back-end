// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Error message
  statusCode?: number; // HTTP status code for rate limit
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (req: any) => string; // Function to generate rate limit key
  skip?: (req: any) => boolean; // Function to skip rate limiting
  onLimitReached?: (req: any) => void; // Callback when limit is reached
  strategy?: 'sliding-window' | 'fixed-window' | 'leaky-bucket';
  scope?: 'ip' | 'user' | 'ip-user-combined' | 'global';
}

// Redis configuration
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
  retryStrategy?: (times: number) => number | null;
}

// Rate limit result
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp in milliseconds
  retryAfter?: number; // Seconds to wait before retrying
}

// Rate limit headers
export interface RateLimitHeaders {
  'X-RateLimit-Limit': number;
  'X-RateLimit-Remaining': number;
  'X-RateLimit-Reset': number;
  'Retry-After'?: number;
}

// Rate limiting strategy
export type RateLimitStrategy =
  | 'fixed-window' // Simple fixed window counter
  | 'sliding-window' // Sliding window with Redis sorted sets
  | 'token-bucket' // Token bucket algorithm
  | 'leaky-bucket'; // Leaky bucket algorithm

// Rate limit scope
export type RateLimitScope =
  | 'ip' // Limit by IP address
  | 'user' // Limit by user ID
  | 'global' // Global limit
  | 'endpoint' // Limit by endpoint
  | 'ip-user-combined'; // Combined IP and user

// Rate limit configuration per route
export interface RouteRateLimitConfig {
  path: string;
  method?: string | string[];
  strategy?: RateLimitStrategy;
  scope?: RateLimitScope;
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
}
