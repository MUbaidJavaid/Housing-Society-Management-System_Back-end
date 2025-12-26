import bcrypt from 'bcrypt';
import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../types/user.types';

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    userId: { type: Number, required: true, unique: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    lastLogin: { type: Date },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdOn: { type: Date, default: Date.now },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    modifiedOn: { type: Date },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  {
    timestamps: false,
    collection: 'users',
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        // Safely delete optional properties
        if ('passwordHash' in ret) delete ret.passwordHash;
        if ('__v' in ret) delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        // Safely delete optional properties
        if ('passwordHash' in ret) delete ret.passwordHash;
        if ('__v' in ret) delete ret.__v;
        return ret;
      },
    },
  }
);

// Password hashing middleware with proper type checking
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'));

    // Type guard to ensure passwordHash is a string
    if (typeof this.passwordHash !== 'string') {
      return next(new Error('Password hash must be a string'));
    }

    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Alternative approach: Use type assertion
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'));

    // Type assertion - we know passwordHash is required in schema
    const passwordHash = this.passwordHash as string;
    this.passwordHash = await bcrypt.hash(passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Pre-update hook for modifiedOn
UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ modifiedOn: new Date() });
  next();
});

// Instance methods
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  // Type guard for passwordHash
  if (typeof this.passwordHash !== 'string') {
    throw new Error('Password hash is not available');
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.getFullName = function (): string {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
};

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return this.getFullName();
});

// Indexes
UserSchema.index({ username: 1, isActive: 1 });
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ roleId: 1, isActive: 1 });
UserSchema.index({ createdOn: -1 });
UserSchema.index({ department: 1, designation: 1 });

export const User = mongoose.model<IUserDocument>('User', UserSchema);
