import { NextFunction, Request, Response } from 'express';
import logger from '../../core/logger';
import Token from '../../database/models/Token';
import User from '../../database/models/User';
import Member from '../../Member/models/models-member';
import { AppError } from '../../middleware/error.middleware';
import { jwtService } from '../jwt';
import { AuthRequest, Permission, RolePermissions, UserRole } from '../types';

/**
 * Extract token from request
 */
const extractToken = (req: Request): string | null => {
  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Check cookie
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // 3. Check query parameter
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
};
export const requireMember = (req: Request, _res: Response, next: NextFunction) => {
  if (!(req as any).user || (req as any).user.role !== UserRole.MEMBER) {
    throw new AppError(403, 'Access denied. Member account required');
  }
  next();
};
/**
 * Authentication middleware
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No authentication token provided',
        code: 'NO_TOKEN',
      });
      return;
    }

    // Verify token
    const decoded = jwtService.verifyAccessToken(token);
    // Check if user is member
    if (decoded.role === UserRole.MEMBER) {
      // For members, check if member exists and is active
      const member = await Member.findById(decoded.userId);

      if (!member || member.isDeleted || !member.isActive) {
        res.status(401).json({
          success: false,
          error: 'Member account is inactive or deleted',
          code: 'ACCOUNT_INACTIVE',
        });
        return;
      }

      // Attach member info to request
      req.user = decoded;

      next();
      return;
    }
    // Get user from database
    const user = await User.findById(decoded.userId).select('+lastLogin +status +isDeleted').exec();

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    // Check if user is active
    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE',
      });
      return;
    }

    // Check if user is deleted
    if (user.isDeleted) {
      res.status(403).json({
        success: false,
        error: 'Account has been deleted',
        code: 'ACCOUNT_DELETED',
      });
      return;
    }

    // Get session information
    const session = await Token.findOne({
      sessionId: decoded.sessionId,
      type: 'refresh',
      isRevoked: false,
    });

    if (!session) {
      res.status(401).json({
        success: false,
        error: 'Session not found or expired',
        code: 'SESSION_EXPIRED',
      });
      return;
    }

    // Attach user and session to request
    req.user = decoded;
    req.session = {
      id: decoded.sessionId,
      userId: decoded.userId,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
      createdAt: session.createdAt!,
      lastActive: new Date(),
      isRevoked: false,
    };

    // Update user's last activity
    await User.findByIdAndUpdate(decoded.userId, {
      lastLogin: new Date(),
    });

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error.message);

    // Handle specific JWT errors
    if (error.message === 'Access token expired') {
      res.status(401).json({
        success: false,
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED',
        hint: 'Use the refresh token endpoint to get a new access token',
      });
      return;
    }

    if (error.message === 'Invalid access token') {
      res.status(401).json({
        success: false,
        error: 'Invalid access token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Generic error
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
};

/**
 * Optional authentication middleware
 * (Allows public access but attaches user if authenticated)
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = jwtService.verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('+status +isDeleted').exec();

      if (user && user.status === 'active' && !user.isDeleted) {
        req.user = decoded;
      }
    }
  } catch (error) {
    // Silently fail - authentication is optional
  }

  next();
};

/**
 * Require email verification middleware
 */
export const requireEmailVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const user = await User.findById(req.user.userId);

  if (!user || !user.emailVerified) {
    res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED',
    });
    return;
  }

  next();
};

/**
 * Check if user has specific role
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        required: roles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Check if user has specific permission
 */
export const requirePermission = (...permissions: Permission[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    // In a real implementation, you'd check permissions from database
    // For now, we'll use the RolePermissions mapping
    const userRole = req.user.role as UserRole;
    const userPermissions = RolePermissions[userRole] || [];

    const hasAllPermissions = permissions.every(permission => userPermissions.includes(permission));

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions,
        current: userPermissions,
      });
      return;
    }

    next();
  };
};

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimiter = (limit: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = requests.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      requests.set(key, record);
    } else {
      record.count++;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > limit) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
};

/**
 * Check if user owns the resource
 */
export const requireOwnership = (paramName = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const resourceId = req.params[paramName] as string;

    if (req.user.userId.toString() !== resourceId && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources',
        code: 'OWNERSHIP_REQUIRED',
      });
      return;
    }

    next();
  };
};
