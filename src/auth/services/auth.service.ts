import { Types } from 'mongoose';
import { sendEmail } from '../../core/email';
import logger from '../../core/logger';
import Token from '../../database/models/Token';
import User, { UserStatus } from '../../database/models/User';
import { AppError } from '../../middleware/error.middleware';
import { jwtService } from '../jwt';
import { passwordService, passwordValidator } from '../password';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  TokenPair,
  UserRole,
  VerifyEmailDto,
} from '../types';
// import {UserStatus} form "../../database/models/User";

/**
 * Authentication service
 */
export class AuthService {
  private loginAttempts = new Map<string, { count: number; lockUntil: number }>();

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<{
    user: any;
    tokens: TokenPair;
  }> {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(registerDto.email);
      if (existingUser) {
        throw new AppError(409, 'User already exists');
      }

      // Validate password
      const passwordValidation = passwordValidator.validate(registerDto.password);
      if (!passwordValidation.isValid) {
        throw new AppError(400, `Invalid password: ${passwordValidation.errors.join(', ')}`);
      }
      const userStatus =
        process.env.REQUIRE_EMAIL_VERIFICATION === 'true' ? UserStatus.PENDING : UserStatus.ACTIVE;
      // Create user
      const user = await User.create({
        email: registerDto.email.toLowerCase(),
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        status: userStatus,
        role: UserRole.USER,
      });

      // Generate tokens
      const tokens = await jwtService.generateTokenPair(
        user._id as Types.ObjectId,
        user.email,
        user.role as UserRole
      );

      // Send welcome email
      if (process.env.SEND_WELCOME_EMAIL === 'true') {
        await this.sendWelcomeEmail(user);
      }

      // Send email verification if required
      if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
        await this.sendVerificationEmail(user);
      }

      return {
        user: user.getPublicProfile(),
        tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{
    user: any;
    tokens: TokenPair;
  }> {
    try {
      // Check for login attempts and lockout
      await this.checkLoginAttempts(loginDto.email);

      // Find user
      const user = await User.findByEmail(loginDto.email);
      if (!user) {
        await this.recordFailedAttempt(loginDto.email);
        throw new AppError(401, 'Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new AppError(403, `Account is ${user.status}`);
      }

      // Verify password
      const isValidPassword = await passwordService.verify(loginDto.password, user.password);

      if (!isValidPassword) {
        await this.recordFailedAttempt(loginDto.email);
        throw new AppError(401, 'Invalid credentials');
      }

      // Reset failed attempts on successful login
      this.loginAttempts.delete(loginDto.email.toLowerCase());

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokens = await jwtService.generateTokenPair(
        user._id as Types.ObjectId,
        user.email,
        user.role as UserRole
      );

      // Store session info
      await this.recordLoginSession(
        user._id as Types.ObjectId,
        tokens.refreshToken,
        userAgent,
        ipAddress
      );

      return {
        user: user.getPublicProfile(),
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Verify and decode token to get session ID
      const decoded = await jwtService.verifyRefreshToken(refreshToken);

      // Revoke the session
      await jwtService.revokeSession(decoded.sessionId);
    } catch (error: any) {
      // Don't throw error on logout - just log it
      logger.warn('Logout error (non-critical):', error.message);
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: Types.ObjectId): Promise<void> {
    try {
      await jwtService.revokeAllUserTokens(userId);
    } catch (error) {
      logger.error('Logout all error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenPair> {
    try {
      return await jwtService.refreshAccessToken(refreshTokenDto.refreshToken);
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new AppError(401, 'Failed to refresh token');
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: Types.ObjectId,
    changePasswordDto: ChangePasswordDto
  ): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Verify current password
      const isValid = await passwordService.verify(
        changePasswordDto.currentPassword,
        user.password
      );

      if (!isValid) {
        throw new AppError(400, 'Current password is incorrect');
      }

      // Validate new password
      const passwordValidation = passwordValidator.validate(changePasswordDto.newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(400, `Invalid password: ${passwordValidation.errors.join(', ')}`);
      }

      // Update password
      user.password = changePasswordDto.newPassword;
      await user.save();

      // Logout from all devices (security measure)
      await this.logoutAll(userId);

      // Send password change notification
      await this.sendPasswordChangeNotification(user);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    try {
      const user = await User.findByEmail(forgotPasswordDto.email);

      if (!user) {
        // Don't reveal if user exists or not
        return;
      }

      // Generate password reset token
      const resetToken = jwtService.generatePasswordResetToken(
        user._id as Types.ObjectId,
        user.email
      );

      // Send reset email
      await this.sendPasswordResetEmail(user, resetToken);
    } catch (error) {
      logger.error('Forgot password error:', error);
      // Don't throw - don't reveal internal errors
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      // Verify token
      const { userId, email } = jwtService.verifyPasswordResetToken(resetPasswordDto.token);

      const user = await User.findById(userId);

      if (!user || user.email !== email) {
        throw new AppError(400, 'Invalid reset token');
      }

      // Validate new password
      const passwordValidation = passwordValidator.validate(resetPasswordDto.newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(400, `Invalid password: ${passwordValidation.errors.join(', ')}`);
      }

      // Update password
      user.password = resetPasswordDto.newPassword;
      await user.save();

      // Logout from all devices
      await this.logoutAll(userId);

      // Send password reset confirmation
      await this.sendPasswordResetConfirmation(user);
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    try {
      const { userId, email } = jwtService.verifyEmailVerificationToken(verifyEmailDto.token);

      const user = await User.findById(userId);

      if (!user || user.email !== email) {
        throw new AppError(400, 'Invalid verification token');
      }

      if (user.emailVerified) {
        throw new AppError(400, 'Email already verified');
      }

      // Verify email
      user.emailVerified = true;
      user.status = UserStatus.ACTIVE;
      await user.save();

      // Send welcome email (if not sent before)
      await this.sendWelcomeEmail(user);
    } catch (error) {
      logger.error('Verify email error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    try {
      const user = await User.findByEmail(email);

      if (!user) {
        // Don't reveal if user exists
        return;
      }

      if (user.emailVerified) {
        throw new AppError(400, 'Email already verified');
      }

      await this.sendVerificationEmail(user);
    } catch (error) {
      logger.error('Resend verification email error:', error);
      throw error;
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: Types.ObjectId): Promise<any[]> {
    try {
      const sessions = await Token.find({
        userId,
        type: 'refresh',
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      return sessions.map(session => ({
        id: session.sessionId,
        deviceInfo: session.deviceInfo,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        isCurrent: false, // Would need to compare with current session
        isRevoked: session.isRevoked,
      }));
    } catch (error) {
      logger.error('Get user sessions error:', error);
      throw error;
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(userId: Types.ObjectId, sessionId: string): Promise<void> {
    try {
      const session = await Token.findOne({
        userId,
        sessionId,
        type: 'refresh',
      });

      if (!session) {
        throw new AppError(404, 'Session not found');
      }

      await jwtService.revokeSession(sessionId);
    } catch (error) {
      logger.error('Revoke session error:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async checkLoginAttempts(email: string): Promise<void> {
    const key = email.toLowerCase();
    const record = this.loginAttempts.get(key);

    if (record && record.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((record.lockUntil - Date.now()) / 1000 / 60);
      throw new AppError(429, `Account locked. Try again in ${remainingTime} minutes`);
    }
  }

  private async recordFailedAttempt(email: string): Promise<void> {
    const key = email.toLowerCase();
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
    const lockoutMinutes = parseInt(process.env.LOCKOUT_DURATION || '15');

    let record = this.loginAttempts.get(key);

    if (!record) {
      record = { count: 1, lockUntil: 0 };
      this.loginAttempts.set(key, record);
    } else {
      record.count++;
    }

    if (record.count >= maxAttempts) {
      record.lockUntil = Date.now() + lockoutMinutes * 60 * 1000;
      record.count = 0; // Reset count after lockout

      // Send security alert
      await this.sendSecurityAlert(email);
    }
  }

  private async recordLoginSession(
    _userId: Types.ObjectId,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Parse user agent for device info
      const deviceInfo = this.parseUserAgent(userAgent);

      // Update token record with session info
      await Token.findOneAndUpdate(
        { token: refreshToken },
        {
          userAgent,
          ipAddress,
          deviceInfo,
        }
      );
    } catch (error) {
      logger.warn('Failed to record login session:', error);
    }
  }

  private parseUserAgent(userAgent?: string): Record<string, any> {
    if (!userAgent) return {};

    try {
      const parser = require('ua-parser-js');
      const result = parser(userAgent);

      return {
        browser: result.browser.name,
        browserVersion: result.browser.version,
        os: result.os.name,
        osVersion: result.os.version,
        device: result.device.type || 'desktop',
        deviceModel: result.device.model,
      };
    } catch {
      return {};
    }
  }

  private async sendWelcomeEmail(user: any): Promise<void> {
    // Implementation depends on your email service
    // Example using nodemailer or sendgrid
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      data: {
        name: user.firstName,
      },
    });
  }

  private async sendVerificationEmail(user: any): Promise<void> {
    const token = jwtService.generateEmailVerificationToken(user._id as Types.ObjectId, user.email);

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      template: 'verify-email',
      data: {
        name: user.firstName,
        verificationLink,
      },
    });
  }

  private async sendPasswordResetEmail(user: any, resetToken: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      data: {
        name: user.firstName,
        resetLink,
        expiryHours: 1, // Token expires in 1 hour
      },
    });
  }

  private async sendPasswordResetConfirmation(user: any): Promise<void> {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Confirmation',
      template: 'password-reset-confirm',
      data: {
        name: user.firstName,
      },
    });
  }

  private async sendPasswordChangeNotification(user: any): Promise<void> {
    await sendEmail({
      to: user.email,
      subject: 'Password Changed',
      template: 'password-changed',
      data: {
        name: user.firstName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private async sendSecurityAlert(email: string): Promise<void> {
    await sendEmail({
      to: email,
      subject: 'Security Alert: Multiple Failed Login Attempts',
      template: 'security-alert',
      data: {
        email,
        timestamp: new Date().toISOString(),
        ip: 'Unknown', // Would need to track IP
      },
    });
  }
}

// Export singleton instance
export const authService = new AuthService();
