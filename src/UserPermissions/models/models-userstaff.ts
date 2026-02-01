import bcrypt from 'bcryptjs';
import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IUserStaff extends Document {
  userName: string;
  password: string;
  fullName: string;
  cnic: string;
  mobileNo?: string;
  email?: string;
  roleId: Types.ObjectId;
  srCityId: Types.ObjectId;
  designation?: string;
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  role?: any;
  city?: any;
  createdByUser?: any;
  updatedByUser?: any;
  statusBadge?: string;
  fullAddress?: string;
  initials?: string;
}

const userStaffSchema = new Schema<IUserStaff>(
  {
    userName: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
      index: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in query results by default
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
      index: true,
    },

    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      unique: true,
      trim: true,
      match: [/^\d{5}-\d{7}-\d{1}$/, 'Please provide a valid CNIC (XXXXX-XXXXXXX-X)'],
      index: true,
    },

    mobileNo: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-]{10,}$/, 'Please provide a valid mobile number'],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
      index: true,
      sparse: true, // Allow null/undefined while maintaining unique constraint
    },

    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },

    srCityId: {
      type: Schema.Types.ObjectId,
      ref: 'SrCity',
      required: true,
      index: true,
    },

    designation: {
      type: String,
      trim: true,
      maxlength: [100, 'Designation cannot exceed 100 characters'],
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLogin: {
      type: Date,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      required: true,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        // Create a new object without the sensitive fields
        const { password, loginAttempts, lockUntil, __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        // Create a new object without the sensitive fields
        const { password, loginAttempts, lockUntil, __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
  }
);

// Compound indexes for efficient querying
userStaffSchema.index({ userName: 1, isDeleted: 1 }, { unique: true });
userStaffSchema.index({ cnic: 1, isDeleted: 1 }, { unique: true });
userStaffSchema.index({ email: 1, isDeleted: 1 }, { unique: true, sparse: true });
userStaffSchema.index({ roleId: 1, isActive: 1 });
userStaffSchema.index({ srCityId: 1, isActive: 1 });
userStaffSchema.index({ isActive: 1, isDeleted: 1 });

// Text index for search
userStaffSchema.index(
  { userName: 'text', fullName: 'text', email: 'text', designation: 'text' },
  {
    weights: { userName: 10, fullName: 8, email: 5, designation: 3 },
    name: 'userstaff_text_search',
  }
);

// Virtual for role
userStaffSchema.virtual('role', {
  ref: 'Role',
  localField: 'roleId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for city
userStaffSchema.virtual('city', {
  ref: 'SrCity',
  localField: 'srCityId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for created by user
userStaffSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for updated by user
userStaffSchema.virtual('updatedByUser', {
  ref: 'UserStaff',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for status badge color
userStaffSchema.virtual('statusBadge').get(function () {
  if (!this.isActive) return 'danger';
  if (this.lockUntil && this.lockUntil > new Date()) return 'warning';
  return 'success';
});

// Virtual for full address (if you have address fields)
userStaffSchema.virtual('fullAddress').get(function () {
  // This would need additional address fields
  return '';
});

// Virtual for initials (for avatar)
userStaffSchema.virtual('initials').get(function () {
  const names = this.fullName.split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return this.fullName.substring(0, 2).toUpperCase();
});

// Pre-save middleware to hash password
userStaffSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with our new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Pre-update middleware to hash password if being updated
userStaffSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  if (update && update.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
      next();
    } catch (error: any) {
      next(error);
    }
  } else {
    next();
  }
});

// Method to compare password
userStaffSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userStaffSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Method to increment login attempts
userStaffSchema.methods.incLoginAttempts = async function (): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
    return this.save();
  }

  // Otherwise increment
  this.loginAttempts += 1;

  // Lock the account if we've reached max attempts and lockUntil is not already set
  if (this.loginAttempts >= 5 && !this.lockUntil) {
    this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  }

  return this.save();
};

// Method to reset login attempts on successful login
userStaffSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  return this.save();
};

// Define static methods
userStaffSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ userName: username.toLowerCase(), isDeleted: false });
};

userStaffSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase(), isDeleted: false });
};

userStaffSchema.statics.findByCNIC = function (cnic: string) {
  return this.findOne({ cnic, isDeleted: false });
};

userStaffSchema.statics.getActiveUsersByRole = function (roleId: Types.ObjectId) {
  return this.find({
    roleId,
    isActive: true,
    isDeleted: false,
  })
    .select('userName fullName email designation lastLogin')
    .populate('roleId', 'roleName roleCode')
    .populate('srCityId', 'cityName')
    .sort({ fullName: 1 });
};

userStaffSchema.statics.getUsersByCity = function (cityId: Types.ObjectId) {
  return this.find({
    srCityId: cityId,
    isActive: true,
    isDeleted: false,
  })
    .select('userName fullName email designation roleId')
    .populate('roleId', 'roleName roleCode')
    .populate('srCityId', 'cityName')
    .sort({ fullName: 1 });
};

// Define interface for static methods
interface IUserStaffModel extends Model<IUserStaff> {
  findByUsername(username: string): Promise<IUserStaff | null>;
  findByEmail(email: string): Promise<IUserStaff | null>;
  findByCNIC(cnic: string): Promise<IUserStaff | null>;
  getActiveUsersByRole(roleId: Types.ObjectId): Promise<IUserStaff[]>;
  getUsersByCity(cityId: Types.ObjectId): Promise<IUserStaff[]>;
}

// Create and export model
const UserStaff = model<IUserStaff, IUserStaffModel>('UserStaff', userStaffSchema);

export default UserStaff;
