import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Default password policy
const defaultPasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  checkSequential: false, // <-- Added: Disable sequential check
};

/**
 * Password validation
 */
export class PasswordValidator {
  constructor(private policy = defaultPasswordPolicy) {}

  validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.policy.minLength) {
      errors.push(`Password must be at least ${this.policy.minLength} characters long`);
    }

    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.policy.requireSpecialChars) {
      const specialCharRegex = new RegExp(
        `[${this.policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`
      );
      if (!specialCharRegex.test(password)) {
        errors.push(
          `Password must contain at least one special character (${this.policy.specialChars})`
        );
      }
    }

    // Check for common passwords
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a stronger password');
    }

    // Only check for sequential characters if enabled
    if (this.policy.checkSequential && this.hasSequentialChars(password)) {
      errors.push('Password contains sequential characters');
    }

    // Check for repeated characters
    if (this.hasRepeatedChars(password)) {
      errors.push('Password contains too many repeated characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      '123456',
      '12345678',
      '123456789',
      'password1',
      'qwerty',
      'abc123',
      'letmein',
      'monkey',
      'dragon',
      '111111',
      'baseball',
      'iloveyou',
      'trustno1',
      'sunshine',
      'master',
      'hello',
      'freedom',
      'whatever',
      'qazwsx',
      'admin',
      'password123',
      'welcome',
      'login',
      'passw0rd',
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  private hasSequentialChars(password: string): boolean {
    // Only called if checkSequential is true
    const sequentialPatterns = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '01234567890',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ];

    return sequentialPatterns.some(pattern => {
      for (let i = 0; i <= pattern.length - 3; i++) {
        const seq = pattern.substring(i, i + 3);
        if (password.toLowerCase().includes(seq)) {
          return true;
        }
      }
      return false;
    });
  }

  private hasRepeatedChars(password: string): boolean {
    const repeatedRegex = /(.)\1{2,}/;
    return repeatedRegex.test(password);
  }
}

/**
 * Password hashing and verification
 */
export class PasswordService {
  private saltRounds: number;

  constructor(saltRounds = 12) {
    this.saltRounds = saltRounds;
  }

  /**
   * Hash a password
   */
  async hash(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against a hash
   */
  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Failed to verify password');
    }
  }

  /**
   * Generate a random password
   */
  generateRandom(length = 16): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const bytes = crypto.randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }

    return result;
  }

  /**
   * Calculate password strength score (0-100)
   */
  calculateStrength(password: string): number {
    let score = 0;

    // Length score
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;

    // Character variety score
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 10;

    // Entropy bonus
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);

    // Penalties (reduced or removed)
    if (this.isCommonPassword(password)) score -= 30;
    // Removed sequential penalty to allow passwords like Mubaid@2468
    if (this.hasRepeatedChars(password)) score -= 10;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = ['password', '123456', 'qwerty', 'letmein'];
    return commonPasswords.includes(password.toLowerCase());
  }

  // private hasSequentialChars(password: string): boolean {
  //   // Only called if needed elsewhere
  //   const sequentialRegex =
  //     /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;
  //   return sequentialRegex.test(password.toLowerCase());
  // }

  private hasRepeatedChars(password: string): boolean {
    const repeatedRegex = /(.)\1{2,}/;
    return repeatedRegex.test(password);
  }
}

// Export singleton instances with sequential checking disabled
export const passwordValidator = new PasswordValidator({
  ...defaultPasswordPolicy,
  checkSequential: false, // <-- Disabled by default
});

export const passwordService = new PasswordService();
