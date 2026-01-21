import crypto from 'crypto';
import { Types } from 'mongoose';
import { emailService } from '../../core/email';
import logger from '../../core/logger';
import { PhoneService } from '../../core/phone.utils';
import Token from '../../database/models/Token';
import User, { UserStatus } from '../../database/models/User';
import Member from '../../Member/models/models-member';
import { AppError } from '../../middleware/error.middleware';
import { jwtService } from '../jwt';
import { passwordValidator } from '../password';
import {
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  TokenPair,
  UserRole,
} from '../types';
/**
import { number } from 'zod/v4';
 * Authentication service - Updated for your models
 */

interface TempUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  otp: string;
  otpExpires: Date;
  signUpIp?: string;
  createdAt: Date;
  attempts: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}
export class AuthService {
  private loginAttempts = new Map<string, { count: number; lockUntil: number }>();

  /**
   * Register a new user
   */
  private tempUserStore = new Map<string, TempUserData>();
  private rateLimitStore = new Map<string, RateLimitRecord>();

  constructor() {
    // Start cleanup interval for rate limits
    // this.startCleanupInterval();
  }

  // private cleanupExpiredRateLimits(): void {
  //   const now = Date.now();
  //   for (const [key, record] of this.rateLimitStore.entries()) {
  //     if (record.resetTime < now) {
  //       this.rateLimitStore.delete(key);
  //     }
  //   }
  // }

  private getRateLimit(key: string): RateLimitRecord {
    const record = this.rateLimitStore.get(key);
    if (record) {
      return record;
    }
    return { count: 0, resetTime: 0 };
  }

  private incrementRateLimit(key: string, windowMs: number = 15 * 60 * 1000): void {
    const now = Date.now();
    let record = this.rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
      // Reset or create new record
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      // Increment existing record
      record.count += 1;
    }

    this.rateLimitStore.set(key, record);
  }

  // FIX: Add "used" comment or actually use this method
  // @ts-ignore - Used in other methods
  private checkRateLimit(key: string, maxAttempts: number): boolean {
    const record = this.getRateLimit(key);
    const now = Date.now();

    if (record.resetTime < now) {
      // Reset expired record
      this.rateLimitStore.delete(key);
      return true;
    }

    return record.count < maxAttempts;
  }
  // Replace the register method with this updated version
  async register(
    registerDto: RegisterDto & {
      userAgent?: string;
      ipAddress?: string;
      signUpIp?: string;
    }
  ): Promise<{
    tempUserId?: string;
    message?: string;
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
      let validatedPhone: string | undefined = undefined;
      if (registerDto.phone && registerDto.phone.trim()) {
        const phoneValidation = PhoneService.validateAndFormat(registerDto.phone);

        if (!phoneValidation.isValid) {
          throw new AppError(400, phoneValidation.error || 'Invalid phone number');
        }

        validatedPhone = phoneValidation.formattedNumber;
      }
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create temp user data
      const tempUserData: TempUserData = {
        email: registerDto.email.toLowerCase(),
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: validatedPhone,
        otp,
        otpExpires,
        signUpIp: registerDto.ipAddress || registerDto.signUpIp,
        createdAt: new Date(),
        attempts: 0,
      };

      // Generate temp user ID
      const tempUserId = crypto.randomBytes(16).toString('hex');

      // Store in temporary store (in production, use Redis)
      this.tempUserStore.set(tempUserId, tempUserData);

      // Cleanup expired temp users
      this.cleanupExpiredTempUsers();

      // Send OTP email
      await emailService.sendVerificationEmail(
        registerDto.email.toLowerCase(),
        registerDto.firstName,
        otp
      );

      logger.info(`OTP ${otp} sent to ${registerDto.email}`);

      return {
        message: 'Verification OTP sent to your email. It expires in 10 minutes.',
        tempUserId: tempUserId,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Add this cleanup method
  private cleanupExpiredTempUsers(): void {
    const now = new Date();
    for (const [key, data] of this.tempUserStore.entries()) {
      if (data.otpExpires < now) {
        this.tempUserStore.delete(key);
      }
    }
  }

  // Update verifyRegistrationOTP method
  async verifyRegistrationOTP(
    tempUserId: string,
    otp: string
  ): Promise<{
    user: any;
    tokens: TokenPair;
  }> {
    try {
      // Get temp user data
      const tempUserData = this.tempUserStore.get(tempUserId);

      if (!tempUserData) {
        throw new AppError(400, 'OTP expired or invalid session');
      }

      // Check OTP expiry
      if (tempUserData.otpExpires < new Date()) {
        this.tempUserStore.delete(tempUserId);
        throw new AppError(400, 'OTP has expired');
      }

      // Verify OTP
      if (tempUserData.otp !== otp) {
        // Increment attempts
        tempUserData.attempts += 1;
        this.tempUserStore.set(tempUserId, tempUserData);

        if (tempUserData.attempts >= 3) {
          this.tempUserStore.delete(tempUserId);
          throw new AppError(400, 'Too many failed attempts. Please register again.');
        }

        throw new AppError(400, 'Invalid OTP');
      }

      // Check if user already exists (race condition check)
      const existingUser = await User.findByEmail(tempUserData.email);
      if (existingUser) {
        this.tempUserStore.delete(tempUserId);
        throw new AppError(409, 'User already exists');
      }

      // Create actual user
      const user = await User.create({
        email: tempUserData.email,
        password: tempUserData.password,
        firstName: tempUserData.firstName,
        lastName: tempUserData.lastName,
        phone: tempUserData.phone,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        signUpIp: tempUserData.signUpIp,
        preferences: {
          theme: 'auto',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showPhone: false,
          },
        },
      });

      // Generate tokens
      const tokens = await jwtService.generateTokenPair(
        user._id as Types.ObjectId,
        user.email,
        user.role
      );

      // Clean up temp data
      this.tempUserStore.delete(tempUserId);

      // Send welcome email
      if (process.env.SEND_WELCOME_EMAIL === 'true') {
        await emailService.sendWelcomeEmail(user.email, user.firstName);
      }

      return {
        user: user.getPublicProfile(),
        tokens,
      };
    } catch (error) {
      logger.error('Verify registration OTP error:', error);
      throw error;
    }
  }

  // Add resend OTP method
  async resendRegistrationOTP(
    tempUserId: string
  ): Promise<{ message: string; newTempUserId?: string }> {
    try {
      const tempUserData = this.tempUserStore.get(tempUserId);

      if (!tempUserData) {
        throw new AppError(400, 'Session expired. Please register again.');
      }

      // Generate new OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const newOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update temp user data
      tempUserData.otp = newOtp;
      tempUserData.otpExpires = newOtpExpires;
      tempUserData.attempts = 0;

      // Generate new temp ID for security
      const newTempUserId = crypto.randomBytes(16).toString('hex');
      this.tempUserStore.set(newTempUserId, tempUserData);
      this.tempUserStore.delete(tempUserId);

      // Send new OTP email
      await emailService.sendVerificationEmail(tempUserData.email, tempUserData.firstName, newOtp);

      logger.info(`Resent OTP ${newOtp} to ${tempUserData.email}`);

      return {
        message: 'New OTP sent to your email',
        newTempUserId,
      };
    } catch (error) {
      logger.error('Resend OTP error:', error);
      throw error;
    }
  }
  //     const userStatus =
  //       process.env.REQUIRE_EMAIL_VERIFICATION === 'true' ? UserStatus.PENDING : UserStatus.ACTIVE;

  //     // Create user with additional fields
  //     const user = await User.create({
  //       email: registerDto.email.toLowerCase(),
  //       password: registerDto.password,
  //       firstName: registerDto.firstName,
  //       lastName: registerDto.lastName,
  //       phone: registerDto.phone,
  //       role: UserRole.USER,
  //       status: userStatus,
  //       emailVerified: userStatus === UserStatus.ACTIVE,
  //       signUpIp: registerDto.ipAddress || registerDto.signUpIp,
  //       preferences: {
  //         theme: 'auto',
  //         language: 'en',
  //         notifications: {
  //           email: true,
  //           push: true,
  //           sms: false,
  //         },
  //         privacy: {
  //           profileVisibility: 'public',
  //           showEmail: false,
  //           showPhone: false,
  //         },
  //       },
  //     });

  //     // Generate tokens
  //     const tokens = await jwtService.generateTokenPair(
  //       user._id as Types.ObjectId,
  //       user.email,
  //       user.role
  //     );

  //     // Send welcome email if email is already verified
  //     if (user.emailVerified && process.env.SEND_WELCOME_EMAIL === 'true') {
  //       await this.sendWelcomeEmail(user);
  //     }

  //     // Send email verification if required
  //     if (!user.emailVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
  //       await this.sendVerificationOTP(user.email, user.firstName);
  //     }

  //     return {
  //       user: user.getPublicProfile(),
  //       tokens,
  //     };
  //   } catch (error) {
  //     logger.error('Registration error:', error);
  //     throw error;
  //   }
  // }
  // async verifyRegistrationOTP(
  //   tempUserId: string,
  //   otp: string
  // ): Promise<{
  //   user: any;
  //   tokens: TokenPair;
  // }> {
  //   try {
  //     // Get temp user data
  //     const tempUsers = (global as any).tempUsers || {};
  //     const tempUserData = tempUsers[tempUserId];

  //     if (!tempUserData) {
  //       throw new AppError(400, 'OTP expired or invalid');
  //     }

  //     // Check OTP expiry
  //     if (tempUserData.otpExpires < new Date()) {
  //       delete (global as any).tempUsers[tempUserId];
  //       throw new AppError(400, 'OTP has expired');
  //     }

  //     // Verify OTP
  //     if (tempUserData.otp !== otp) {
  //       throw new AppError(400, 'Invalid OTP');
  //     }

  //     // Check if user already exists (race condition check)
  //     const existingUser = await User.findByEmail(tempUserData.email);
  //     if (existingUser) {
  //       delete (global as any).tempUsers[tempUserId];
  //       throw new AppError(409, 'User already exists');
  //     }

  //     // Create actual user
  //     const user = await User.create({
  //       email: tempUserData.email,
  //       password: tempUserData.password,
  //       firstName: tempUserData.firstName,
  //       lastName: tempUserData.lastName,
  //       phone: tempUserData.phone,
  //       role: UserRole.USER,
  //       status: UserStatus.ACTIVE,
  //       emailVerified: true,
  //       signUpIp: tempUserData.signUpIp,
  //       preferences: {
  //         theme: 'auto',
  //         language: 'en',
  //         notifications: {
  //           email: true,
  //           push: true,
  //           sms: false,
  //         },
  //         privacy: {
  //           profileVisibility: 'public',
  //           showEmail: false,
  //           showPhone: false,
  //         },
  //       },
  //     });

  //     // Generate tokens
  //     const tokens = await jwtService.generateTokenPair(
  //       user._id as Types.ObjectId,
  //       user.email,
  //       user.role
  //     );

  //     // Clean up temp data
  //     delete (global as any).tempUsers[tempUserId];

  //     // Send welcome email
  //     if (process.env.SEND_WELCOME_EMAIL === 'true') {
  //       await emailService.sendWelcomeEmail(user.email, user.firstName);
  //     }

  //     return {
  //       user: user.getPublicProfile(),
  //       tokens,
  //     };
  //   } catch (error) {
  //     logger.error('Verify registration OTP error:', error);
  //     throw error;
  //   }
  // }
  /**
   * Login user with account lockout protection
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

      // Find user with security fields
      const user = await User.findOne({
        email: loginDto.email.toLowerCase(),
        isDeleted: false,
      }).select('+password +failedLoginAttempts +lockedUntil');

      if (!user) {
        await this.recordFailedAttempt(loginDto.email);
        throw new AppError(401, 'Invalid credentials');
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
        throw new AppError(429, `Account locked. Try again in ${remainingTime} minutes`);
      }

      // Check if user is active
      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError(403, `Account is ${user.status}. Please contact support.`);
      }

      // Verify password
      const isValidPassword = await user.comparePassword(loginDto.password);

      if (!isValidPassword) {
        // Record failed attempt
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

        // Check if should lock account
        const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
        if (user.failedLoginAttempts >= maxAttempts) {
          const lockoutDuration = parseInt(process.env.LOCKOUT_DURATION || '15');
          user.lockedUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);
          user.failedLoginAttempts = 0;

          // Send security alert
          await this.sendSecurityAlert(user.email, ipAddress);
        }

        await user.save();
        throw new AppError(401, 'Invalid credentials');
      }

      // Reset failed attempts on successful login
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      user.lastLogin = new Date();
      user.lastLoginIp = ipAddress;
      await user.save();

      // Generate tokens
      const tokens = await jwtService.generateTokenPair(
        user._id as Types.ObjectId,
        user.email,
        user.role
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
   * Send email verification OTP
   */
  async sendVerificationOTP(email: string, _firstname?: string): Promise<{ message: string }> {
    try {
      const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

      if (!user) {
        // Return generic success to prevent email enumeration
        return { message: 'If an account exists, verification OTP has been sent to your email.' };
        // console.log('User not found for email verification OTP:', email);
      }

      if (user.emailVerified) {
        throw new AppError(400, 'Email already verified');
      }
      // Generate and store OTP
      const otp = emailService.generateOTP();
      console.log('Generated OTP:', otp);
      user.emailVerificationOTP = otp;
      user.emailVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      // Send email
      const userName = user.firstName;
      await emailService.sendVerificationEmail(user.email, userName, otp);

      return { message: 'Verification OTP sent successfully' };
    } catch (error) {
      logger.error('Send verification OTP error:', error);
      throw error;
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmailWithOTP(email: string, otp: string): Promise<void> {
    try {
      const user = await User.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
      }).select('+emailVerificationOTP +emailVerificationOTPExpires');

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      if (user.emailVerified) {
        throw new AppError(400, 'Email already verified');
      }

      // Check OTP
      if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires) {
        throw new AppError(400, 'No verification OTP found');
      }

      if (user.emailVerificationOTP !== otp) {
        throw new AppError(400, 'Invalid OTP');
      }

      if (user.emailVerificationOTPExpires < new Date()) {
        throw new AppError(400, 'OTP has expired');
      }

      // Verify email
      user.emailVerified = true;
      user.status = UserStatus.ACTIVE;
      user.emailVerificationOTP = undefined;
      user.emailVerificationOTPExpires = undefined;
      await user.save();

      // Send welcome email
      await this.sendWelcomeEmail(user);
    } catch (error) {
      logger.error('Verify email OTP error:', error);
      throw error;
    }
  }

  /**
   * Send password reset OTP
   */
  // async sendPasswordResetOTP(email: string): Promise<{ message: string }> {
  //   try {
  //     const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

  //     if (!user) {
  //       // Return generic success to prevent email enumeration
  //       return { message: 'If an account exists, password reset OTP has been sent to your email.' };
  //     }

  //     // Generate and store OTP
  //     const otp = emailService.generateOTP();
  //     user.passwordResetOTP = otp;
  //     user.passwordResetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  //     await user.save();

  //     // Send email
  //     await emailService.sendPasswordResetEmail(user.email, user.firstName, otp);

  //     return { message: 'Password reset OTP sent successfully' };
  //   } catch (error) {
  //     logger.error('Send password reset OTP error:', error);
  //     throw error;
  //   }
  // }
  /**
   * Reset password with OTP
   */
  // Update the resetPasswordWithOTP method with additional security
  async resetPasswordWithOTP(email: string, otp: string, newPassword: string): Promise<void> {
    try {
      const user = await User.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
      }).select('+passwordResetOTP +passwordResetOTPExpires +password +passwordResetAttempts');

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Check if OTP exists and is not expired
      if (!user.passwordResetOTP || !user.passwordResetOTPExpires) {
        throw new AppError(400, 'No password reset OTP found');
      }

      // Check OTP expiry
      if (user.passwordResetOTPExpires < new Date()) {
        user.passwordResetOTP = undefined;
        user.passwordResetOTPExpires = undefined;
        user.passwordResetAttempts = 0;
        await user.save();
        throw new AppError(400, 'OTP has expired. Please request a new one.');
      }
      const currentAttempts = user.passwordResetAttempts || 0;
      // Check OTP attempts
      if (currentAttempts >= 3) {
        user.passwordResetOTP = undefined;
        user.passwordResetOTPExpires = undefined;
        user.passwordResetAttempts = 0;
        await user.save();
        throw new AppError(429, 'Too many failed attempts. Please request a new OTP.');
      }

      // Verify OTP
      if (user.passwordResetOTP !== otp) {
        user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
        await user.save();
        throw new AppError(400, 'Invalid OTP');
      }

      // Check if new password is same as old
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        throw new AppError(400, 'New password cannot be the same as old password');
      }

      // Validate new password
      const passwordValidation = passwordValidator.validate(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(400, `Invalid password: ${passwordValidation.errors.join(', ')}`);
      }

      // Update password
      user.password = newPassword;
      user.passwordResetOTP = undefined;
      user.passwordResetOTPExpires = undefined;
      user.passwordResetAttempts = 0;
      user.lastPasswordChange = new Date();
      await user.save();

      // Logout from all devices
      await this.logoutAll(user._id as Types.ObjectId);

      // Send confirmation email
      await this.sendPasswordResetConfirmation(user);

      logger.info(`Password reset successful for user: ${user.email}`);
    } catch (error) {
      logger.error('Reset password OTP error:', error);
      throw error;
    }
  }

  // Add rate limiting to sendPasswordResetOTP
  async sendPasswordResetOTP(email: string): Promise<{ message: string }> {
    try {
      // Rate limiting check
      const rateLimitKey = `pwd_reset:${email}`;
      const now = Date.now();
      // const _windowMs = 15 * 60 * 1000; // 15 minutes
      const maxAttempts = 3;

      // Check rate limit (you'd implement this with Redis in production)
      // For now, using in-memory store
      const attempts = this.getRateLimit(rateLimitKey);
      if (attempts.count >= maxAttempts && now < attempts.resetTime) {
        throw new AppError(429, 'Too many password reset attempts. Please try again later.');
      }

      const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

      if (!user) {
        // Still increment rate limit to prevent email enumeration
        this.incrementRateLimit(rateLimitKey);
        return {
          message: 'If an account exists, password reset OTP has been sent to your email.',
        };
      }

      // Generate and store OTP
      const otp = emailService.generateOTP();
      user.passwordResetOTP = otp;
      user.passwordResetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.passwordResetAttempts = 0;
      await user.save();

      // Send email
      await emailService.sendPasswordResetEmail(user.email, user.firstName, otp);

      // Update rate limit
      this.incrementRateLimit(rateLimitKey);

      logger.info(`Password reset OTP ${otp} sent to ${user.email}`);

      return { message: 'Password reset OTP sent successfully' };
    } catch (error) {
      logger.error('Send password reset OTP error:', error);
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
      const isValid = await user.comparePassword(changePasswordDto.currentPassword);

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
      user.lastPasswordChange = new Date();
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
   * Get user sessions
   */
  async getUserSessions(userId: Types.ObjectId): Promise<any[]> {
    try {
      const sessions = await Token.findActiveTokens(userId);

      return sessions.map(session => ({
        id: session.sessionId,
        type: session.type,
        deviceInfo: session.deviceInfo,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
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
        isRevoked: false,
      });

      if (!session) {
        throw new AppError(404, 'Session not found');
      }

      await session.revoke();
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
    await emailService.sendWelcomeEmail(user.email, user.firstName);
  }
  private async sendSecurityAlert(email: string, ip?: string): Promise<void> {
    await emailService.sendSecurityAlert(email, ip);
  }

  private async sendPasswordChangeNotification(user: any): Promise<void> {
    await emailService.sendPasswordChangeNotification(user.email, user.firstName);
  }

  private async sendPasswordResetConfirmation(user: any): Promise<void> {
    await emailService.sendPasswordResetConfirmation(user.email, user.firstName);
  }

  // Export singleton instance
  // authService = new AuthService();
}

export class AuthMemberService {
  async register(dto: RegisterDto) {
    const exists = await Member.findOne({ memNic: dto.memNic });
    if (exists) throw new Error('Member already exists');

    const member = await Member.create(dto);
    return member;
  }

  async login(dto: LoginDto) {
    const member = await Member.findOne({ memNic: dto.memNic }).select('+password');
    if (!member) throw new Error('Invalid credentials');

    if (member.lockUntil && member.lockUntil > new Date()) {
      throw new Error('Account locked. Try later.');
    }

    const valid = await member.comparePassword(dto.password);
    if (!valid) {
      await member.incrementLoginAttempts();
      throw new Error('Invalid credentials');
    }

    await member.resetLoginAttempts();

    const tokens = await jwtService.generateTokenPair(
      member._id,
      member.memContEmail || 'unknown@email.com',
      UserRole.MEMBER
    );

    return {
      success: true,
      tokens,
      member: {
        id: member._id,
        memName: member.memName,
      },
    };
  }

  async forgotPassword(memNic: string) {
    const member = await Member.findOne({ memNic });
    if (!member) return true; // silent

    const token = crypto.randomBytes(32).toString('hex');

    member.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    member.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await member.save();
    const otp = crypto.randomInt(100000, 999999).toString();

    member.resetPasswordToken = otp;
    member.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await member.save();

    await emailService.sendPasswordResetEmail(member.memContEmail!, member.memName, otp);
    return true;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashed = crypto.createHash('sha256').update(dto.token).digest('hex');

    const member = await Member.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!member) throw new Error('Invalid or expired token');

    member.password = dto.password;
    member.resetPasswordToken = undefined;
    member.resetPasswordExpires = undefined;

    await member.save();
    return true;
  }
}
export const authMemberService = new AuthMemberService();
export const authService = new AuthService();
