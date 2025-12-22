import { OAuth2Client } from 'google-auth-library';
import { Types } from 'mongoose';
import { emailService } from '../../core/email';
import User, { UserRole, UserStatus } from '../../database/models/User';
import { jwtService } from '../jwt';

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
  }

  // Get Google OAuth URL
  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state || 'default',
    });
  }

  // Exchange code for tokens and get user info
  async getGoogleUser(code: string): Promise<GoogleUserInfo> {
    try {
      // Exchange code for tokens
      const { tokens } = await this.client.getToken(code);
      this.client.setCredentials(tokens);

      // Get user info
      const { data } = await this.client.request({
        url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      });

      const userInfo = data as any;

      return {
        googleId: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name || '',
        avatar: userInfo.picture,
      };
    } catch (error) {
      throw new Error('Failed to authenticate with Google');
    }
  }

  // Authenticate or register Google user
  async authenticateGoogleUser(
    googleUser: GoogleUserInfo,
    _userAgent?: string,
    _ipAddress?: string
  ): Promise<{
    user: any;
    tokens: any;
    isNewUser: boolean;
  }> {
    try {
      // Check if user exists with Google ID
      let user = await User.findOne({ googleId: googleUser.googleId, isDeleted: false });

      // If not found, check by email
      if (!user) {
        user = await User.findOne({ email: googleUser.email.toLowerCase(), isDeleted: false });

        if (user) {
          // Link Google account to existing user
          user.googleId = googleUser.googleId;
          user.avatar = googleUser.avatar || user.avatar;
          await user.save();
        }
      }

      // Create new user if not exists
      if (!user) {
        user = await User.create({
          email: googleUser.email.toLowerCase(),
          googleId: googleUser.googleId,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          avatar: googleUser.avatar,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          emailVerified: true, // Google emails are verified
        });

        // Send welcome email
        await emailService.sendWelcomeEmail(user.email, user.firstName);
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new Error(`Account is ${user.status}`);
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokens = await jwtService.generateTokenPair(
        user._id as Types.ObjectId,
        user.email,
        user.role as UserRole
      );

      return {
        user: user.getPublicProfile(),
        tokens,
        isNewUser: !user.lastLogin, // Rough check for new user
      };
    } catch (error) {
      throw error;
    }
  }
}

export const googleAuthService = new GoogleAuthService();
