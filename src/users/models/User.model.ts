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
    },
    isActive: { type: Boolean, default: true },
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
        if ('passwordHash' in ret) delete ret.passwordHash;
        if ('__v' in ret) delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        if ('passwordHash' in ret) delete ret.passwordHash;
        if ('__v' in ret) delete ret.__v;
        return ret;
      },
    },
  }
);

// Remove duplicate pre-save middleware (you have two identical ones)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'));
    const passwordHash = this.passwordHash as string;
    this.passwordHash = await bcrypt.hash(passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ modifiedOn: new Date() });
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (typeof this.passwordHash !== 'string') {
    throw new Error('Password hash is not available');
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.getFullName = function (): string {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
};

UserSchema.virtual('fullName').get(function () {
  return this.getFullName();
});

// Indexes only defined here, not in field definitions
UserSchema.index({ username: 1, isActive: 1 });
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ roleId: 1, isActive: 1 });
UserSchema.index({ createdOn: -1 });
UserSchema.index({ department: 1, designation: 1 });
UserSchema.index({ isActive: 1 });

// Check for existing model before creating
export const User = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
