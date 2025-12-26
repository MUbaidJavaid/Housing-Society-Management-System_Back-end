import mongoose, { Document, Schema } from 'mongoose';
import { ISecurity } from '../types/user.types';

export interface ISecurityDocument extends ISecurity, Document {
  hasAnyPermission: boolean;
  hasAllPermissions: boolean;
}

const SecuritySchema = new Schema<ISecurityDocument>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
      index: true,
    },
    view: { type: Boolean, default: false },
    add: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    createdOn: { type: Date, default: Date.now },
    modifiedOn: { type: Date },
  },
  {
    timestamps: false,
    collection: 'security',
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

// Pre-save hook for audit
SecuritySchema.pre('save', function (next) {
  if (this.isNew) {
    this.createdOn = new Date();
  } else {
    this.modifiedOn = new Date();
  }
  next();
});

// Compound unique index - each role can only have one entry per form
SecuritySchema.index({ roleId: 1, formId: 1 }, { unique: true });

// Index for permission-based queries
SecuritySchema.index({ view: 1, add: 1, edit: 1, delete: 1 });

// Virtual for hasAnyPermission
SecuritySchema.virtual('hasAnyPermission').get(function () {
  return this.view || this.add || this.edit || this.delete;
});

// Virtual for hasAllPermissions
SecuritySchema.virtual('hasAllPermissions').get(function () {
  return this.view && this.add && this.edit && this.delete;
});

// Define static methods
interface SecurityModel extends mongoose.Model<ISecurityDocument> {
  getPermissionsByRole(roleId: string): Promise<ISecurityDocument[]>;
  hasPermission(
    roleId: string,
    formId: string,
    permission: 'view' | 'add' | 'edit' | 'delete'
  ): Promise<boolean>;
}

// Static method to get permissions by role
SecuritySchema.statics.getPermissionsByRole = async function (roleId: string) {
  return this.find({ roleId }).populate('formId', 'formName formCaption formType').exec();
};

// Static method to check permission
SecuritySchema.statics.hasPermission = async function (
  roleId: string,
  formId: string,
  permission: 'view' | 'add' | 'edit' | 'delete'
): Promise<boolean> {
  const security = await this.findOne({ roleId, formId });
  return security ? security[permission] : false;
};

export const Security = mongoose.model<ISecurityDocument, SecurityModel>(
  'Security',
  SecuritySchema
);
