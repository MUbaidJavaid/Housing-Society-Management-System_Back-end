import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Document, Model, Query, Schema, Types, model } from 'mongoose';
import ms, { StringValue } from 'ms';
import validator from 'validator';

/* ---------------------- Enums ---------------------- */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  BANNED = 'banned',
}

/* ---------------------- Interfaces ---------------------- */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: { email: boolean; push: boolean; sms: boolean };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
  };
}

export interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  lastLogin?: Date;
  emailVerified: boolean;
  emailVerificationOTP?: string;
  emailVerificationOTPExpires?: Date;
  passwordResetOTP?: string;
  passwordResetOTPExpires?: Date;
  passwordResetAttempts?: number;
  googleId?: string;
  phoneVerified: boolean;
  phoneCountry?: string;
  twoFactorEnabled: boolean;
  preferences: UserPreferences;
  metadata: Record<string, any>;
  isDeleted: boolean;

  // Security related fields
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  lastPasswordChange?: Date;
  failedLoginAttempts?: number;
  lockedUntil?: Date;
  signUpIp?: string;
  lastLoginIp?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  generateAuthToken(): Promise<string>;
  generateRefreshToken(): Promise<string>;
  getPublicProfile(): any;
  toJSON(): any;
}

// Rename one of them to avoid conflict
export type UserDocument = IUser & Document<Types.ObjectId> & IUserMethods;

export interface UserModel extends Model<UserDocument, {}, IUserMethods> {
  findByEmail(email: string): Promise<UserDocument | null>;
  findActiveUsers(): Promise<UserDocument[]>;
  countByStatus(status: UserStatus): Promise<number>;
  findByRole(role: UserRole): Promise<UserDocument[]>;
}

/* ---------------------- Schema ---------------------- */
const userSchema = new Schema<UserDocument, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: { validator: (v: string) => validator.isEmail(v), message: 'Invalid email' },
      index: true,
    },
    password: {
      type: String,
      required: function (this: IUser & { googleId?: string }): boolean {
        return !this.googleId; // Not required for Google OAuth users
      },
      minlength: 8,
      select: false,
    },
    firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER, index: true },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
      index: true,
    },
    avatar: {
      type: String,
      default: '',
      validate: { validator: (v: string) => !v || validator.isURL(v), message: 'Invalid URL' },
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty

          try {
            // Use libphonenumber-js for validation
            const { isValidPhoneNumber } = require('libphonenumber-js');
            return isValidPhoneNumber(v);
          } catch (error) {
            return false;
          }
        },
        message: props => `${props.value} is not a valid international phone number!`,
      },
    },
    phoneCountry: {
      type: String,
      default: null,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: { type: Date },
    emailVerified: { type: Boolean, default: false, index: true },

    // OTP fields for email verification
    emailVerificationOTP: {
      type: String,
      select: false,
    },
    emailVerificationOTPExpires: {
      type: Date,
      select: false,
    },

    // OTP fields for password reset
    passwordResetOTP: {
      type: String,
      select: false,
    },
    passwordResetOTPExpires: {
      type: Date,
      select: false,
    },
    passwordResetAttempts: {
      // Add this field
      type: Number,
      default: 0,
      select: false,
    },
    // Google OAuth
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },

    twoFactorEnabled: { type: Boolean, default: false },

    // Two-factor authentication
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorBackupCodes: {
      type: [String],
      select: false,
    },

    // Account security
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockedUntil: {
      type: Date,
      select: false,
    },

    // Preferences
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
      language: { type: String, default: 'en' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      privacy: {
        profileVisibility: {
          type: String,
          enum: ['public', 'private', 'friends'],
          default: 'public',
        },
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false },
      },
    },

    // Metadata
    metadata: { type: Schema.Types.Mixed, default: {} },
    signUpIp: { type: String, select: false },
    lastLoginIp: { type: String, select: false },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ---------------------- Virtuals ---------------------- */
userSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isActive').get(function (this: UserDocument) {
  return this.status === UserStatus.ACTIVE;
});

userSchema.virtual('isAdmin').get(function (this: UserDocument) {
  return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
});

/* ---------------------- Middleware ---------------------- */
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  if (update?.password) {
    const salt = await bcrypt.genSalt(12);
    update.password = await bcrypt.hash(update.password, salt);
  }
  next();
});

/* ---------------------- Instance Methods ---------------------- */
userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generateAuthToken = async function (): Promise<string> {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined');
  }

  const payload = {
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
  };

  // Parse the expiresIn string to milliseconds, then to seconds
  const expiresInString = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const expiresInMs = ms(expiresInString as StringValue);

  const options: jwt.SignOptions = {
    expiresIn: Math.floor(expiresInMs / 1000), // Convert to seconds
  };

  return jwt.sign(payload, secret, options);
};

userSchema.methods.generateRefreshToken = async function (): Promise<string> {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  const payload = {
    userId: this._id.toString(),
    tokenType: 'refresh',
  };

  const options: jwt.SignOptions = {
    expiresIn: Math.floor(ms('7d') / 1000), // 7 days in seconds
  };

  return jwt.sign(payload, secret, options);
};

userSchema.methods.toJSON = function () {
  const obj: any = this.toObject();
  delete obj.password;
  delete obj.__v;
  delete obj.twoFactorSecret;
  delete obj.twoFactorBackupCodes;
  delete obj.emailVerificationOTP;
  delete obj.emailVerificationOTPExpires;
  delete obj.passwordResetOTP;
  delete obj.passwordResetOTPExpires;
  delete obj.failedLoginAttempts;
  delete obj.lockedUntil;
  if (obj.metadata?.internal) delete obj.metadata.internal;
  return obj;
};

userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    avatar: this.avatar,
    role: this.role,
    status: this.status,
    emailVerified: this.emailVerified,
    phone: this.phone,
    phoneVerified: this.phoneVerified,
    twoFactorEnabled: this.twoFactorEnabled,
    preferences: this.preferences,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

/* ---------------------- Static Methods ---------------------- */
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
  }).select('+password +emailVerificationOTP +passwordResetOTP');
};

userSchema.statics.findByGoogleId = function (googleId: string) {
  return this.findOne({
    googleId,
    isDeleted: false,
  });
};

userSchema.statics.findActiveUsers = function () {
  return this.find({ status: UserStatus.ACTIVE, isDeleted: false });
};

userSchema.statics.countByStatus = function (status: UserStatus) {
  return this.countDocuments({ status, isDeleted: false });
};

userSchema.statics.findByRole = function (role: UserRole) {
  return this.find({ role, isDeleted: false });
};

// Find active user by email (for login)
userSchema.statics.findActiveUser = function (email: string) {
  return this.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
    status: UserStatus.ACTIVE,
  }).select('+password +failedLoginAttempts +lockedUntil');
};

/* ---------------------- Query Helper ---------------------- */
export interface UserQueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  excludeDeleted?: boolean;
}

// Add paginate to Query prototype
(userSchema as any).query.paginate = function (options: UserQueryOptions) {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    role,
    status,
    excludeDeleted = true,
  } = options;

  const query = this as Query<UserDocument[], UserDocument>;

  if (search) {
    query.or([
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]);
  }

  if (role) {
    query.where('role').equals(role);
  }

  if (status) {
    query.where('status').equals(status);
  }

  if (excludeDeleted) {
    query.where('isDeleted').equals(false);
  }

  return query
    .skip((page - 1) * limit)
    .limit(limit)
    .sort(sort);
};

/* ---------------------- Model ---------------------- */
const User = model<UserDocument, UserModel>('User', userSchema);
export default User;

// Export all types with different names to avoid conflicts
// export type { UserDocument as IUserDocument, UserModel as IUserModel };
// export type { UserDocument as IUserDocument, UserModel as IUserModel };
