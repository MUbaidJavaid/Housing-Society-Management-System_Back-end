import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import logger from '../core/logger';
import Token from '../database/models/Token';
import { DecodedToken, JwtPayload, TokenConfig, TokenPair, UserRole } from './types';

// Default token configuration
const defaultTokenConfig: TokenConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'ASWEDFCSDCRTYUOLI;P[]-9084ERQ2WDFRY65[-9JREWSQ.;KJIO',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  },
  refreshToken: {
    secret:
      process.env.JWT_REFRESH_SECRET ||
      'DSEW4EG54RYO8/.LUITU5T/.ASRTUREW4YUKUUKTYKOU;W6+69YFR56;UK',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  passwordResetToken: {
    expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1h',
  },
  emailVerificationToken: {
    expiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '24h',
  },
};

/**
 * JWT Service for token generation, verification, and management
 */
export class JwtService {
  private config: TokenConfig;

  constructor(config: TokenConfig = defaultTokenConfig) {
    this.config = config;

    // Validate configuration
    this.validateConfig();
  }

  /**
   * Validate token configuration
   */
  private validateConfig(): void {
    if (!this.config.accessToken.secret || this.config.accessToken.secret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters long');
    }

    if (!this.config.refreshToken.secret || this.config.refreshToken.secret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
    }

    if (this.config.accessToken.secret === this.config.refreshToken.secret) {
      throw new Error('Access and refresh token secrets must be different');
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate token pair (access + refresh)
   */
  async generateTokenPair(
    userId: Types.ObjectId,
    email: string,
    role: UserRole
  ): Promise<TokenPair> {
    try {
      const sessionId = this.generateSessionId();
      const payload: JwtPayload = {
        userId,
        email,
        role,
        sessionId,
        type: 'access',
      };

      // Generate access token
      const accessToken = jwt.sign(payload, this.config.accessToken.secret, {
        expiresIn: this.config.accessToken.expiresIn as jwt.SignOptions['expiresIn'],
      });

      // Generate refresh token with different payload
      const refreshPayload: JwtPayload = {
        ...payload,
        type: 'refresh',
      };

      const refreshToken = jwt.sign(refreshPayload, this.config.refreshToken.secret, {
        expiresIn: this.config.refreshToken.expiresIn as jwt.SignOptions['expiresIn'],
      });

      // Store refresh token in database (for potential blacklisting)
      await this.storeRefreshToken(userId, refreshToken, sessionId);

      // Parse expiresIn to seconds
      const expiresIn = this.parseExpiresIn(this.config.accessToken.expiresIn);

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      logger.error('Failed to generate token pair:', error);
      throw new Error('Failed to generate authentication tokens');
    }
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(
    userId: Types.ObjectId,
    refreshToken: string,
    sessionId: string
  ): Promise<void> {
    try {
      const expiresAt = this.calculateExpiry(this.config.refreshToken.expiresIn);

      await Token.create({
        userId,
        token: refreshToken,
        sessionId,
        type: 'refresh',
        expiresAt,
        isRevoked: false,
      });
    } catch (error) {
      logger.error('Failed to store refresh token:', error);
      // Don't throw - token generation can still succeed
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): DecodedToken {
    try {
      const decoded = jwt.verify(token, this.config.accessToken.secret) as DecodedToken;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<DecodedToken> {
    try {
      // First check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Refresh token has been revoked');
      }

      const decoded = jwt.verify(token, this.config.refreshToken.secret) as DecodedToken;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Verify token exists in database and is not revoked
      const tokenRecord = await Token.findOne({
        token,
        type: 'refresh',
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      });

      if (!tokenRecord) {
        throw new Error('Refresh token not found or expired');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = await this.verifyRefreshToken(refreshToken);

      // Revoke the old refresh token (if rotation is enabled)
      await this.revokeRefreshToken(refreshToken);

      // Generate new token pair
      return await this.generateTokenPair(decoded.userId, decoded.email, decoded.role as UserRole);
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    try {
      await Token.findOneAndUpdate(
        { token, type: 'refresh' },
        { isRevoked: true, revokedAt: new Date() }
      );
    } catch (error) {
      logger.error('Failed to revoke refresh token:', error);
      throw new Error('Failed to revoke token');
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: Types.ObjectId): Promise<void> {
    try {
      await Token.updateMany(
        { userId, type: 'refresh', isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );
    } catch (error) {
      logger.error('Failed to revoke all user tokens:', error);
      throw new Error('Failed to revoke tokens');
    }
  }

  /**
   * Revoke tokens for a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await Token.updateMany(
        { sessionId, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );
    } catch (error) {
      logger.error('Failed to revoke session tokens:', error);
      throw new Error('Failed to revoke session');
    }
  }

  /**
   * Check if token is blacklisted
   */
  public async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenRecord = await Token.findOne({
        token,
        isRevoked: true,
      });
      return !!tokenRecord;
    } catch (error) {
      logger.error('Failed to check token blacklist:', error);
      return false;
    }
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(userId: Types.ObjectId, email: string): string {
    const payload = {
      userId,
      email,
      type: 'password_reset',
    };

    return jwt.sign(
      payload,
      this.config.accessToken.secret, // Reuse access token secret
      { expiresIn: this.config.passwordResetToken.expiresIn as jwt.SignOptions['expiresIn'] }
    );
  }

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: string): { userId: Types.ObjectId; email: string } {
    try {
      const decoded = jwt.verify(token, this.config.accessToken.secret) as any;

      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Password reset token expired');
      }
      throw new Error('Invalid password reset token');
    }
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(userId: Types.ObjectId, email: string): string {
    const payload = {
      userId,
      email,
      type: 'email_verification',
    };

    return jwt.sign(payload, this.config.accessToken.secret, {
      expiresIn: this.config.emailVerificationToken.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Verify email verification token
   */
  verifyEmailVerificationToken(token: string): { userId: Types.ObjectId; email: string } {
    try {
      const decoded = jwt.verify(token, this.config.accessToken.secret) as any;

      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Email verification token expired');
      }
      throw new Error('Invalid email verification token');
    }
  }

  /**
   * Parse expiresIn string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }

  /**
   * Calculate expiry date from expiresIn string
   */
  private calculateExpiry(expiresIn: string): Date {
    const seconds = this.parseExpiresIn(expiresIn);
    return new Date(Date.now() + seconds * 1000);
  }

  /**
   * Get token expiration time in seconds
   */
  getTokenExpiration(token: string): number {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return 0;
      }
      return decoded.exp - Math.floor(Date.now() / 1000);
    } catch {
      return 0;
    }
  }

  /**
   * Clean up expired tokens from database
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await Token.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const jwtService = new JwtService();
