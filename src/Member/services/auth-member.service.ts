import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { jwtService } from '../../auth/jwt';
import { TokenPair, UserRole } from '../../auth/types';
import emailService from '../../core/email';

import Member from '../models/models-member';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginCredentials,
  ProfileUpdate,
  ResetPasswordConfirm,
  SignupCredentials,
} from '../types/types-auth-member';

export const authMemberService = {
  /**
   * Member signup - Pre-registered members only
   *
   * Business Logic:
   * 1. CNIC and Email must BOTH be provided and match an existing record
   * 2. Member must exist in DB (created by admin)
   * 3. Member must NOT have a password set yet
   * 4. isActive must be true, isDeleted must be false
   * 5. Both CNIC (case-insensitive) and Email (case-insensitive) must match
   */
  async signup(data: SignupCredentials): Promise<AuthResponse> {
    const { memNic, memContEmail, password } = data;

    // Validate required fields
    if (!memNic || !memNic.trim()) {
      throw new Error('CNIC is required');
    }

    if (!memContEmail || !memContEmail.trim()) {
      throw new Error('Email is required');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Normalize input for matching
    const normalizedNic = memNic.trim().toUpperCase();
    const normalizedEmail = memContEmail.trim().toLowerCase();

    // Query: Find member matching BOTH CNIC AND Email
    const member = await Member.findOne({
      memNic: normalizedNic,
      memContEmail: normalizedEmail,
      isDeleted: false,
      isActive: true,
    }).select('+password');

    // No member found with this CNIC + Email combination
    if (!member) {
      throw new Error('Member not found or not eligible for signup. Please verify CNIC and email.');
    }

    // Member already has a password set (already signed up)
    if (member.password) {
      throw new Error('This account already has a password set. Use login or forgot password.');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update member: set password and mark as activated
    member.password = hashedPassword;
    member.emailVerified = false; // Email needs verification after signup
    member.lastLogin = new Date();
    member.updatedAt = new Date();

    await member.save();

    // Generate tokens (memContEmail is guaranteed to exist at this point from validation above)
    const tokens = await jwtService.generateTokenPair(
      member._id,
      member.memContEmail as string,
      UserRole.MEMBER
    );

    return {
      member: this.formatMemberResponse(member),
      tokens,
    };
  },

  /**
   * Member login with Email (CNIC or Email identifier)
   */
  /**
   * Member login with Email (case-insensitive) + Password
   * Accepts Email identifier
   */
  async login(loginCredentials: LoginCredentials): Promise<{ member: any; tokens: TokenPair }> {
    const { email, password } = loginCredentials;

    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }

    if (!password || password.length < 8) {
      throw new Error('Password is required');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find member by email
    const member = await Member.findOne({
      memContEmail: normalizedEmail,
      isDeleted: false,
      isActive: true,
    }).select('+password +lockUntil +loginAttempts');

    if (!member) {
      throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (member.lockUntil && member.lockUntil > new Date()) {
      const remainingTime = Math.ceil((member.lockUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Account is temporarily locked. Try again in ${remainingTime} minutes.`);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, member.password || '');
    if (!isPasswordValid) {
      // Increment login attempts
      member.loginAttempts = (member.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (member.loginAttempts >= 5) {
        member.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await member.save();
        throw new Error('Too many failed login attempts. Account locked for 15 minutes.');
      }

      await member.save();
      throw new Error('Invalid email or password');
    }

    // Reset login attempts on successful login
    member.loginAttempts = 0;
    member.lockUntil = undefined;
    member.lastLogin = new Date();
    member.updatedAt = new Date();
    await member.save();

    // Generate tokens (memContEmail is guaranteed to exist since we found by email)
    const tokens = await jwtService.generateTokenPair(
      member._id,
      member.memContEmail as string,
      UserRole.MEMBER
    );

    return {
      member: this.formatMemberResponse(member),
      tokens,
    };
  },
  /**
   * Request password reset - Send OTP token
   * For security reasons, we don't reveal if email exists
   */
  async forgotPassword(identifier: string): Promise<{ message: string }> {
    if (!identifier || !identifier.trim()) {
      throw new Error('Email is required');
    }

    const normalizedEmail = identifier.trim().toLowerCase();

    // Find member by email (case-insensitive)
    const member = await Member.findOne({
      memContEmail: normalizedEmail,
      isDeleted: false,
      isActive: true,
    });

    // Return generic message for security (doesn't reveal if email exists)
    if (!member) {
      return {
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token (JWT-based) - pass both userId and email
    const resetToken = jwtService.generatePasswordResetToken(
      member._id as Types.ObjectId,
      normalizedEmail
    );

    // Store token and expiration in member
    member.resetPasswordToken = resetToken;
    member.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await member.save({ validateBeforeSave: false });

    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordResetEmail(
      member.memContEmail as string,
      member.memName,
      resetUrl
    );

    return {
      message: 'If an account with this email exists, a password reset link has been sent.',
    };
  },
  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordConfirm): Promise<void> {
    const { token, newPassword } = data;

    // Verify token
    const decoded = jwtService.verifyPasswordResetToken(token);

    // Find member
    const member = await Member.findOne({
      _id: decoded.userId,
      isDeleted: false,
      isActive: true,
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!member) {
      throw new Error('Member not found or account is inactive');
    }

    // Verify token matches
    if (member.resetPasswordToken !== token) {
      throw new Error('Invalid reset token');
    }

    // Check token expiration
    if (!member.resetPasswordExpires || member.resetPasswordExpires < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    member.password = await bcrypt.hash(newPassword, salt);
    member.resetPasswordToken = undefined;
    member.resetPasswordExpires = undefined;

    await member.save();
  },

  /**
   * Change password (requires current password)
   */
  async changePassword(memberId: Types.ObjectId, data: ChangePasswordRequest): Promise<void> {
    const { currentPassword, newPassword } = data;

    const member = await Member.findById(memberId).select('+password');

    if (!member) {
      throw new Error('Member not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, member.password || '');
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    member.password = await bcrypt.hash(newPassword, salt);
    await member.save();
  },

  /**
   * Get member profile
   */
  async getProfile(memberId: Types.ObjectId): Promise<any> {
    const member = await Member.findById(memberId)
      .populate('statusId', 'statusName')
      .populate('cityId', 'cityName');

    if (!member || member.isDeleted) {
      throw new Error('Member not found');
    }

    return this.formatMemberResponse(member);
  },

  /**
   * Update member profile
   */
  async updateProfile(memberId: Types.ObjectId, data: ProfileUpdate): Promise<any> {
    const member = await Member.findById(memberId);

    if (!member || member.isDeleted) {
      throw new Error('Member not found');
    }

    // Allowed fields for self-update
    const allowedFields = [
      'memName',
      'memContMob',
      'memContEmail',
      'memAddr1',
      'memAddr2',
      'memAddr3',
      'memZipPost',
      'gender',
      'dateOfBirth',
      'memOccupation',
    ];

    // Filter update data
    const filteredUpdate: any = {};
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdate[key] = (data as any)[key];
      }
    });

    // If email is being changed, reset verification status
    if (filteredUpdate.memContEmail && filteredUpdate.memContEmail !== member.memContEmail) {
      filteredUpdate.emailVerified = false;

      // Check if new email already exists
      const existingMember = await Member.findOne({
        memContEmail: filteredUpdate.memContEmail.toLowerCase(),
        _id: { $ne: memberId },
        isDeleted: false,
      });

      if (existingMember) {
        throw new Error('Email already in use');
      }

      // Generate new verification token
      const verificationToken = jwtService.generateEmailVerificationToken(
        memberId,
        filteredUpdate.memContEmail
      );

      filteredUpdate.emailVerificationToken = verificationToken;
      filteredUpdate.emailVerificationExpires = new Date(Date.now() + 24 * 3600000);
    }

    const updatedMember = await Member.findByIdAndUpdate(
      memberId,
      { $set: filteredUpdate },
      { new: true, runValidators: true }
    )
      .populate('statusId', 'statusName')
      .populate('cityId', 'cityName');

    // Send verification email if email was updated
    if (filteredUpdate.memContEmail && filteredUpdate.memContEmail !== member.memContEmail) {
      async function sendVerificationEmail(email: string, name: string, otp: string) {
        return emailService.sendVerificationEmail(email, name, otp);
      }
    }

    return this.formatMemberResponse(updatedMember);
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    const decoded = jwtService.verifyEmailVerificationToken(token);

    const member = await Member.findOne({
      _id: decoded.userId,
      memContEmail: decoded.email,
      isDeleted: false,
    });

    if (!member) {
      throw new Error('Member not found');
    }

    if (member.emailVerified) {
      throw new Error('Email already verified');
    }

    // Mark email as verified
    member.emailVerified = true;
    member.emailVerificationToken = undefined;
    member.emailVerificationExpires = undefined;
    await member.save();
  },

  /**
   * Resend verification email
   */
  async resendVerification(identifier: string): Promise<void> {
    const member = await Member.findOne({
      isDeleted: false,
      isActive: true,
      $or: [{ memNic: identifier.toUpperCase() }, { memContEmail: identifier.toLowerCase() }],
    });

    if (!member) {
      throw new Error('Member not found');
    }

    if (!member.memContEmail) {
      throw new Error('Member does not have an email address');
    }

    if (member.emailVerified) {
      throw new Error('Email already verified');
    }

    // Generate verification token
    const verificationToken = jwtService.generateEmailVerificationToken(
      member._id,
      member.memContEmail
    );

    // Store token in member
    member.emailVerificationToken = verificationToken;
    member.emailVerificationExpires = new Date(Date.now() + 24 * 3600000);
    await member.save({ validateBeforeSave: false });

    // Send verification email
    async function sendVerificationEmail(email: string, name: string, otp: string) {
      return emailService.sendVerificationEmail(email, name, otp);
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    return await jwtService.refreshAccessToken(refreshToken);
  },

  /**
   * Logout (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await jwtService.revokeRefreshToken(refreshToken);
  },

  /**
   * Helper: Format member response
   */
  formatMemberResponse(member: any): any {
    return {
      id: member._id,
      memName: member.memName,
      memNic: member.memNic,
      memContEmail: member.memContEmail,
      memContMob: member.memContMob,
      memImg: member.memImg,
      memAddr1: member.memAddr1,
      memAddr2: member.memAddr2,
      memAddr3: member.memAddr3,
      cityId: member.cityId,
      statusId: member.statusId,
      isActive: member.isActive,
      emailVerified: member.emailVerified,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth,
      memOccupation: member.memOccupation,
      lastLogin: member.lastLogin,
      memRegNo: member.memRegNo,
      memIsOverseas: member.memIsOverseas,
      createdBy: member.createdBy,
      createdAt: member.createdAt,
    };
  },

  /**
   * Helper: Increment login attempts
   */
  async incrementLoginAttempts(memberId: Types.ObjectId): Promise<void> {
    await Member.findByIdAndUpdate(memberId, { $inc: { loginAttempts: 1 } });
  },

  /**
   * Helper: Reset login attempts
   */
  async resetLoginAttempts(memberId: Types.ObjectId): Promise<void> {
    await Member.findByIdAndUpdate(memberId, {
      $set: {
        loginAttempts: 0,
        lockUntil: undefined,
      },
    });
  },
};
