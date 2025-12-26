// src/models/Member.model.ts
import mongoose, { model, Schema } from 'mongoose';
import { IMember } from '../types/estate.types';

const MemberSchema: Schema = new Schema(
  {
    MemID: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    MemRegNo: {
      type: String,
      required: true,
      index: true,
    },
    MemName: {
      type: String,
      required: true,
    },
    MemFHName: {
      type: String,
      required: true,
    },
    MemFHRelation: {
      type: String,
      required: true,
    },
    MemNic: {
      type: String,
      required: true,
      index: true,
    },
    MemAddr1: String,
    MemAddr2: String,
    MemAddr3: String,
    MemContMob: String,
    MemContRes: String,
    MemImg: {
      type: Buffer,
      select: false, // Don't automatically include in queries for performance
    },
    MemberFingerPrint: {
      type: Buffer,
      select: false,
    },
    CityID: {
      type: Schema.Types.ObjectId,
      ref: 'City',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for formatted membership number (from DefaulterList SP logic)
MemberSchema.virtual('formattedMembershipNo').get(function (this: IMember) {
  if (this.MemRegNo && this.MemRegNo.includes('/')) {
    return this.MemRegNo.split('/')[0];
  }
  return this.MemRegNo;
});

// Compound index for common queries
MemberSchema.index({ MemRegNo: 1, MemNic: 1 });

export default mongoose.model<IMember>('Member', MemberSchema);
