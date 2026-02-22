import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { authMemberService } from '../services/auth-member.service';
import {
  ChangePasswordRequest,
  LoginCredentials,
  ProfileUpdate,
  ResendVerificationRequest,
  ResetPasswordConfirm,
  ResetPasswordRequest,
  SignupCredentials,
  VerifyEmailRequest,
} from '../types/types-auth-member';

// Line 30 in auth-member.controller.ts
const handleError = (error: any, next: NextFunction) => {
  if (error.message.includes('already exists') || error.message.includes('already has')) {
    next(new AppError(409, error.message));
  } else if (error.message.includes('Invalid') || error.message.includes('not found')) {
    next(new AppError(400, error.message));
  } else if (error.message.includes('locked') || error.message.includes('attempts')) {
    next(new AppError(423, error.message));
  } else if (error.message.includes('credentials') || error.message.includes('password')) {
    next(new AppError(401, error.message));
  } else if (error.message.includes('expired')) {
    next(new AppError(410, error.message));
  } else {
    next(new AppError(500, error.message)); // <-- THIS IS LINE 30!
  }
};

export const authMemberController = {
  // Member signup
  signup: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const credentials: SignupCredentials = req.body;

      // Additional validation
      if (!credentials.memNic || !credentials.memContEmail || !credentials.password) {
        throw new AppError(400, 'memNic, Email, and Password are required');
      }

      const result = await authMemberService.signup(credentials);

      res.status(201).json({
        success: true,
        data: {
          member: result.member,
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            expiresIn: result.tokens.expiresIn,
          },
        },
        message: 'Account created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Member login
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const credentials: LoginCredentials = req.body;

      if (!credentials.memContEmail || !credentials.password) {
        throw new AppError(400, 'Email and password are required');
      }

      const result = await authMemberService.login(credentials);

      res.json({
        success: true,
        data: {
          member: result.member,
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            expiresIn: result.tokens.expiresIn,
          },
        },
        message: 'Login successful',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Forgot password
  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier }: ResetPasswordRequest = req.body;

      if (!identifier || !identifier.trim()) {
        throw new AppError(400, 'Email is required');
      }

      const result = await authMemberService.forgotPassword(identifier);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Reset password
  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: ResetPasswordConfirm = req.body;

      if (!data.token || !data.newPassword) {
        throw new AppError(400, 'Token and new password are required');
      }

      if (data.newPassword.length < 6) {
        throw new AppError(400, 'Password must be at least 6 characters');
      }

      await authMemberService.resetPassword(data);

      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Change password (authenticated)
  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = (req as any).user?.userId;
      const data: ChangePasswordRequest = req.body;

      if (!memberId) {
        throw new AppError(401, 'Authentication required');
      }

      if (!data.currentPassword || !data.newPassword) {
        throw new AppError(400, 'Current and new password are required');
      }

      if (data.newPassword.length < 6) {
        throw new AppError(400, 'New password must be at least 6 characters');
      }

      await authMemberService.changePassword(memberId, data);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Get profile
  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = (req as any).user?.userId;

      if (!memberId) {
        throw new AppError(401, 'Authentication required');
      }

      const profile = await authMemberService.getProfile(memberId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Update profile
  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memberId = (req as any).user?.userId;
      const data: ProfileUpdate = req.body;

      if (!memberId) {
        throw new AppError(401, 'Authentication required');
      }

      const updatedProfile = await authMemberService.updateProfile(memberId, data);

      res.json({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Verify email
  verifyEmail: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token }: VerifyEmailRequest = req.body;

      if (!token) {
        throw new AppError(400, 'Verification token is required');
      }

      await authMemberService.verifyEmail(token);

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Resend verification email
  resendVerification: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier }: ResendVerificationRequest = req.body;

      if (!identifier) {
        throw new AppError(400, 'memNic or Email is required');
      }

      await authMemberService.resendVerification(identifier);

      res.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Refresh token
  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError(400, 'Refresh token is required');
      }

      const tokens = await authMemberService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: tokens,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // Logout
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError(400, 'Refresh token is required');
      }

      await authMemberService.logout(refreshToken);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
