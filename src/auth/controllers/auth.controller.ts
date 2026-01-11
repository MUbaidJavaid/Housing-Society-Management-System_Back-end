import { NextFunction, Request, Response } from 'express';
import User from '../../database/models/User';
import { AppError } from '../../middleware/error.middleware';

import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';

// Error handler utility
const handleError = (error: any, next: Function) => {
  next(error);
};

// Extract token from request
const extractToken = (req: Request): string | null => {
  const body = req.body as any;
  const cookies = req.cookies as any;
  return body?.refreshToken || cookies?.refreshToken;
};

// Auth controller functions - Updated with OTP endpoints
export const authController = {
  // Add this endpoint in authController
  verifyRegistrationOTP: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tempUserId, otp } = req.body;

      if (!tempUserId || !otp) {
        throw new AppError(400, 'Temp User ID and OTP are required');
      }

      const result = await authService.verifyRegistrationOTP(tempUserId, otp);

      res.json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
        message: 'Registration verified successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Add this endpoint
  resendRegistrationOTP: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tempUserId } = req.body;

      if (!tempUserId) {
        throw new AppError(400, 'Temp User ID is required');
      }

      const result = await authService.resendRegistrationOTP(tempUserId);

      res.json({
        success: true,
        data: {
          tempUserId: result.newTempUserId,
        },
        message: result.message,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Update the register endpoint
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const registerData = {
        ...req.body,
        userAgent: req.get('user-agent') || '',
        ipAddress: req.ip || '',
      };

      const result = await authService.register(registerData);

      res.status(201).json({
        success: true,
        data: {
          tempUserId: result.tempUserId,
        },
        message: result.message,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Update login to check email verification
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body, req.get('user-agent') || '', req.ip || '');

      // Check if email is verified
      if (!result.user.emailVerified) {
        throw new AppError(403, 'Please verify your email before logging in');
      }

      // Set cookies if needed
      if (req.body?.rememberMe) {
        res.cookie('refreshToken', result.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      res.json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
        message: 'Login successful',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Send email verification OTP
   */
  sendVerificationOTP: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError(400, 'Email is required');
      }

      const result = await authService.sendVerificationOTP(email);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Verify email with OTP
   */
  verifyEmailWithOTP: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        throw new AppError(400, 'Email and OTP are required');
      }

      await authService.verifyEmailWithOTP(email, otp);

      res.json({
        success: true,
        message: 'Email verified successfully. You can now login.',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Send password reset OTP
   */
  forgotPasswordWithOTP: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError(400, 'Email is required');
      }

      const result = await authService.sendPasswordResetOTP(email);

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Reset password with OTP
   */
  resetPasswordWithOTP: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        throw new AppError(400, 'Email, OTP and new password are required');
      }

      await authService.resetPasswordWithOTP(email, otp, newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Logout user
   */
  logout: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const refreshToken = extractToken(req);

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Logout from all devices
   */
  logoutAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      await authService.logoutAll(req.user.userId);

      res.json({
        success: true,
        message: 'Logged out from all devices',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = extractToken(req);

      if (!refreshToken) {
        throw new AppError(400, 'Refresh token required');
      }

      const tokens = await authService.refreshToken({ refreshToken });

      res.json({
        success: true,
        data: tokens,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Change password
   */
  changePassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      await authService.changePassword(req.user.userId, req.body as any);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const user = await User.findById(req.user.userId);

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: user.getPublicProfile(),
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get user sessions
   */
  getUserSessions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const sessions = await authService.getUserSessions(req.user.userId);

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Revoke session
   */
  revokeSession: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      await authService.revokeSession(req.user.userId, req.params.sessionId as string);

      res.json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Validate token
   */
  validateToken: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.json({
        success: true,
        data: {
          isValid: !!req.user,
          user: req.user,
          expiresIn: req.user?.exp ? req.user.exp - Math.floor(Date.now() / 1000) : 0,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
