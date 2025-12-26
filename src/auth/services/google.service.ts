import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Types } from 'mongoose';
import { emailService } from '../../core/email';
import User, { UserRole, UserStatus } from '../../database/models/User';
import { jwtService } from '../jwt'; // Import the instance, not the class

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface GoogleAuthResult {
  user: any;
  tokens: any;
  isNewUser: boolean;
}

export class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    console.log('Google Auth Configuration:', {
      clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      redirectUriActual: 'http://localhost:3000/auth/google/callback',
    });
    this.client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
  }

  // Get Google OAuth URL
  getAuthUrl(state?: string): string {
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

    console.log('Using redirect URI:', redirectUri);

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];
    const url = this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state || 'default',
      redirect_uri: redirectUri,
      include_granted_scopes: true,
    });

    console.log('Generated Google Auth URL with redirect URI:', redirectUri);
    return url;
    // return this.client.generateAuthUrl({
    //   access_type: 'offline',
    //   scope: scopes,
    //   prompt: 'consent',
    //   state: state || 'default',
    // });
  }

  // Exchange code for tokens and get user info
  async getGoogleUser(code: string): Promise<GoogleUserInfo> {
    try {
      console.log('Exchanging authorization code for tokens...');

      // Exchange code for tokens
      const { tokens } = await this.client.getToken(code);

      console.log('Tokens received:', {
        hasAccessToken: !!tokens.access_token,
        hasIdToken: !!tokens.id_token,
        hasRefreshToken: !!tokens.refresh_token,
        tokenType: tokens.token_type,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      });

      this.client.setCredentials(tokens);

      // Verify the ID token
      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('Invalid Google ID token');
      }

      // Verify the token is issued by Google and for our app
      const aud = payload.aud;
      if (aud !== process.env.GOOGLE_CLIENT_ID) {
        throw new Error('Invalid token audience');
      }

      // Check token expiry
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        throw new Error('Google token expired');
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        avatar: payload.picture,
      };
    } catch (error: any) {
      // console.error('Google authentication error:', error);

      console.error('Google authentication error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        stack: error.stack,
      });

      // Specific handling for invalid_grant error
      if (error.message?.includes('invalid_grant')) {
        throw new Error(
          'Authorization code expired or already used. ' +
            'Please try signing in with Google again.'
        );
      }

      throw new Error('Failed to authenticate with Google');
    }
  }

  // Authenticate or register Google user
  async authenticateGoogleUser(
    googleUser: GoogleUserInfo,
    _userAgent?: string,
    _ipAddress?: string
  ): Promise<GoogleAuthResult> {
    try {
      // Check if user exists with Google ID
      let user = await User.findOne({
        googleId: googleUser.googleId,
        isDeleted: false,
      }).select('+status +emailVerified');

      let isNewUser = false;

      // If not found by Google ID, check by email
      if (!user) {
        user = await User.findOne({
          email: googleUser.email.toLowerCase(),
          isDeleted: false,
        }).select('+status +emailVerified');

        if (user) {
          // Link Google account to existing user
          // Only link if user doesn't already have a Google account linked
          if (!user.googleId) {
            user.googleId = googleUser.googleId;
            user.avatar = googleUser.avatar || user.avatar;
            // Mark email as verified since Google verifies emails
            if (!user.emailVerified) {
              user.emailVerified = true;
            }
            await user.save();
          }
        } else {
          // Create new user - IMPORTANT: Generate random password for OAuth users
          const randomPassword = crypto.randomBytes(32).toString('hex');

          user = await User.create({
            email: googleUser.email.toLowerCase(),
            googleId: googleUser.googleId,
            firstName: googleUser.firstName || 'Google',
            lastName: googleUser.lastName || 'User',
            avatar: googleUser.avatar,
            // For Google OAuth users, we store a hashed random password
            password: randomPassword, // Will be hashed by User model's pre-save hook
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            emailVerified: true, // Google emails are verified
          });

          isNewUser = true;

          // Send welcome email
          await emailService.sendWelcomeEmail(user.email, user.firstName);
        }
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new Error(`Account is ${user.status}. Please contact support.`);
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token pair using JWT service instance
      const tokenPair = await jwtService.generateTokenPair(
        user._id as Types.ObjectId,
        user.email,
        user.role as UserRole
      );

      return {
        user: user.getPublicProfile(),
        tokens: {
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
        },
        isNewUser,
      };
    } catch (error) {
      console.error('Google user authentication error:', error);
      throw error;
    }
  }

  // async authenticateGoogleUser(
  //   googleUser: GoogleUserInfo,
  //   _userAgent?: string,
  //   _ipAddress?: string
  // ): Promise<GoogleAuthResult> {
  //   try {
  //     // Google user data کو process کریں
  //     const processedUser = {
  //       ...googleUser,
  //       // Ensure firstName and lastName are not empty
  //       firstName: googleUser.firstName?.trim() || 'Google',
  //       lastName: googleUser.lastName?.trim() || 'User',
  //       email: googleUser.email.toLowerCase(),
  //     };

  //     console.log('Processed Google user:', processedUser);

  //     // Check if user exists with Google ID
  //     let user = await User.findOne({
  //       googleId: processedUser.googleId,
  //       isDeleted: false,
  //     }).select('+status +emailVerified');

  //     let isNewUser = false;

  //     // If not found by Google ID, check by email
  //     if (!user) {
  //       user = await User.findOne({
  //         email: processedUser.email,
  //         isDeleted: false,
  //       }).select('+status +emailVerified');

  //       if (user) {
  //         // Link Google account to existing user
  //         if (!user.googleId) {
  //           user.googleId = processedUser.googleId;
  //           user.avatar = processedUser.avatar || user.avatar;
  //           if (!user.emailVerified) {
  //             user.emailVerified = true;
  //           }
  //           await user.save();
  //         }
  //       } else {
  //         // Create new user
  //         const randomPassword = randomBytes(32).toString('hex');

  //         user = await User.create({
  //           email: processedUser.email,
  //           googleId: processedUser.googleId,
  //           firstName: processedUser.firstName,
  //           lastName: processedUser.lastName,
  //           avatar: processedUser.avatar,
  //           password: randomPassword,
  //           role: UserRole.USER,
  //           status: UserStatus.ACTIVE,
  //           emailVerified: true,
  //         });

  //         isNewUser = true;

  //         // Send welcome email
  //         await emailService.sendWelcomeEmail(user.email, user.firstName);
  //       }
  //     }

  //     // Check if user is active
  //     if (user.status !== UserStatus.ACTIVE) {
  //       throw new Error(`Account is ${user.status}. Please contact support.`);
  //     }

  //     // Update last login
  //     user.lastLogin = new Date();
  //     await user.save();

  //     // Generate token pair
  //     const tokenPair = await jwtService.generateTokenPair(
  //       user._id as Types.ObjectId,
  //       user.email,
  //       user.role as UserRole
  //     );

  //     return {
  //       user: user.getPublicProfile(),
  //       tokens: {
  //         accessToken: tokenPair.accessToken,
  //         refreshToken: tokenPair.refreshToken,
  //       },
  //       isNewUser,
  //     };
  //   } catch (error: any) {
  //     console.error('Google user authentication error:', {
  //       message: error.message,
  //       errors: error.errors,
  //       stack: error.stack,
  //     });

  //     // Specific handling for validation errors
  //     if (error.name === 'ValidationError') {
  //       const fieldErrors = Object.keys(error.errors).map(key => ({
  //         field: key,
  //         message: error.errors[key].message,
  //       }));

  //       console.error('Validation errors:', fieldErrors);

  //       throw new Error(`User validation failed: ${fieldErrors.map(e => e.message).join(', ')}`);
  //     }

  //     throw error;
  //   }
  // }
  // google.service.ts میں authenticateGoogleUser function
  // async authenticateGoogleUser(
  //   googleUser: GoogleUserInfo,
  //   _userAgent?: string,
  //   _ipAddress?: string
  // ): Promise<GoogleAuthResult> {
  //   try {
  //     console.log('Google user info:', {
  //       email: googleUser.email,
  //       firstName: googleUser.firstName,
  //       lastName: googleUser.lastName,
  //       hasLastName: !!googleUser.lastName,
  //       googleId: googleUser.googleId,
  //     });

  //     // Check if user exists with Google ID
  //     let user = await User.findOne({
  //       googleId: googleUser.googleId,
  //       isDeleted: false,
  //     }).select('+status +emailVerified');

  //     let isNewUser = false;

  //     // If not found by Google ID, check by email
  //     if (!user) {
  //       user = await User.findOne({
  //         email: googleUser.email.toLowerCase(),
  //         isDeleted: false,
  //       }).select('+status +emailVerified');

  //       if (user) {
  //         // Link Google account to existing user
  //         if (!user.googleId) {
  //           user.googleId = googleUser.googleId;
  //           user.avatar = googleUser.avatar || user.avatar;
  //           if (!user.emailVerified) {
  //             user.emailVerified = true;
  //           }
  //           await user.save();
  //         }
  //       } else {
  //         // Create new user - Handle missing lastName
  //         const randomPassword = randomBytes(32).toString('hex');

  //         // Use firstName as lastName if lastName is empty
  //         const userLastName = googleUser.lastName || googleUser.firstName || 'User';

  //         user = await User.create({
  //           email: googleUser.email.toLowerCase(),
  //           googleId: googleUser.googleId,
  //           firstName: googleUser.firstName || 'Google',
  //           lastName: userLastName || 'User', // Use firstName if lastName is missing
  //           avatar: googleUser.avatar,
  //           password: randomPassword,
  //           role: UserRole.USER,
  //           status: UserStatus.ACTIVE,
  //           emailVerified: true,
  //         });

  //         isNewUser = true;

  //         // Send welcome email
  //         await emailService.sendWelcomeEmail(user.email, user.firstName);
  //       }
  //     }

  //     // Check if user is active
  //     if (user.status !== UserStatus.ACTIVE) {
  //       throw new Error(`Account is ${user.status}. Please contact support.`);
  //     }

  //     // Update last login
  //     user.lastLogin = new Date();
  //     await user.save();

  //     // Generate token pair
  //     const tokenPair = await jwtService.generateTokenPair(
  //       user._id as Types.ObjectId,
  //       user.email,
  //       user.role as UserRole
  //     );

  //     return {
  //       user: user.getPublicProfile(),
  //       tokens: {
  //         accessToken: tokenPair.accessToken,
  //         refreshToken: tokenPair.refreshToken,
  //       },
  //       isNewUser,
  //     };
  //   } catch (error) {
  //     console.error('Google user authentication error:', error);
  //     throw error;
  //   }
  // }
}

export const googleAuthService = new GoogleAuthService();
