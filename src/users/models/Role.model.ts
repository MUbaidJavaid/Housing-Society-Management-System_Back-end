import mongoose, { Document, Schema } from 'mongoose';
import { IRole } from '../types/user.types';

export interface IRoleDocument extends IRole, Document {}

const RoleSchema = new Schema<IRoleDocument>(
  {
    roleId: { type: Number, required: true, unique: true },
    role: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 50,
    },
    description: { type: String, trim: true },
    isSystemRole: { type: Boolean, default: false },
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
  },
  {
    timestamps: false,
    collection: 'roles',
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        // Safely delete version key
        if ('__v' in ret) delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save hook to check system roles
RoleSchema.pre('save', function (next) {
  const systemRoles = ['ADMINISTRATOR', 'ADMIN', 'SUPERADMIN'];
  if (systemRoles.includes(this.role.toUpperCase())) {
    this.isSystemRole = true;
  }
  next();
});

// Pre-update hook
RoleSchema.pre('findOneAndUpdate', function (next) {
  this.set({ modifiedOn: new Date() });
  next();
});

// Indexes
RoleSchema.index({ role: 1 });
RoleSchema.index({ isSystemRole: 1 });
RoleSchema.index({ createdOn: -1 });

// Virtual for role permissions count
RoleSchema.virtual('permissionCount', {
  ref: 'Security',
  localField: '_id',
  foreignField: 'roleId',
  count: true,
});

export const Role = mongoose.model<IRoleDocument>('Role', RoleSchema);
