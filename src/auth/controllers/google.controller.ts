// controllers/google.controller.ts
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { googleAuthService } from '../services/google.service';

export const googleAuthController = {
  getAuthUrl: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = (req.query.state as string) || '';
      const url = googleAuthService.getAuthUrl(state);

      console.log('Generated Google URL:', url);
      res.json({
        success: true,
        data: {
          url,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  callback: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.body;
      const userAgent = req.get('user-agent');
      const ipAddress = req.ip || req.socket.remoteAddress;

      if (!code) {
        throw new AppError(400, 'Authorization code is required');
      }

      // Get Google user info from authorization code
      const googleUser = await googleAuthService.getGoogleUser(code);

      // Authenticate or register the user
      const authResult = await googleAuthService.authenticateGoogleUser(
        googleUser,
        userAgent,
        ipAddress
      );

      res.json({
        success: true,
        data: {
          user: authResult.user,
          tokens: authResult.tokens,
          isNewUser: authResult.isNewUser,
        },
        message: authResult.isNewUser
          ? 'Account created successfully with Google'
          : 'Logged in successfully with Google',
      });
    } catch (error) {
      next(error);
    }
  },
};
