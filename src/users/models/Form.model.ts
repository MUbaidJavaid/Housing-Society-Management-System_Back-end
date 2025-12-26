import mongoose, { Document, Schema, UpdateQuery } from 'mongoose';
import { IForm } from '../types/user.types';

export interface IFormDocument extends IForm, Document {}

const FormSchema = new Schema<IFormDocument>(
  {
    formId: { type: Number, required: true, unique: true },
    formName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    formCaption: {
      type: String,
      required: true,
      trim: true,
    },
    formType: {
      type: String,
      required: true,
      trim: true,
      enum: ['MASTER', 'TRANSACTION', 'REPORT', 'UTILITY', 'SETTINGS'],
    },
    isActive: { type: Boolean, default: true, index: true },
    createdOn: { type: Date, default: Date.now },
    modifiedOn: { type: Date },
  },
  {
    timestamps: false,
    collection: 'forms',
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

// Pre-save hook for form name
FormSchema.pre('save', function (next) {
  this.formName = this.formName.toUpperCase();
  next();
});

// Pre-update hook with proper type checking
FormSchema.pre('findOneAndUpdate', function (next) {
  this.set({ modifiedOn: new Date() });

  const update = this.getUpdate() as UpdateQuery<IFormDocument>;

  // Check if update is an object (not an aggregation pipeline)
  if (update && typeof update === 'object' && !Array.isArray(update)) {
    // Handle $set operator
    if (update.$set?.formName) {
      update.$set.formName = update.$set.formName.toUpperCase();
    }
    // Handle direct update
    else if (update.formName) {
      update.formName = update.formName.toUpperCase();
    }
  }

  next();
});

// Indexes
FormSchema.index({ formName: 1 });
FormSchema.index({ formType: 1, isActive: 1 });
FormSchema.index({ createdOn: -1 });

// Virtual for permissions count
FormSchema.virtual('permissionCount', {
  ref: 'Security',
  localField: '_id',
  foreignField: 'formId',
  count: true,
});

// Static method to get active forms by type
FormSchema.statics.getActiveFormsByType = async function (formType?: string) {
  const query: any = { isActive: true };
  if (formType) {
    query.formType = formType;
  }
  return this.find(query).sort({ formCaption: 1 }).exec();
};

export const Form = mongoose.model<IFormDocument>('Form', FormSchema);
