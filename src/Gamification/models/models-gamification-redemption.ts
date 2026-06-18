import { Document, Schema, Types, model } from 'mongoose';

export interface IGamificationRedemption extends Document {
  memberId: Types.ObjectId;
  societyId: Types.ObjectId;
  rewardId: Types.ObjectId;
  pointsSpent: number;
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected' | 'cancelled';
  approvedBy?: Types.ObjectId;
  fulfilledAt?: Date;
  remarks?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gamificationRedemptionSchema = new Schema<IGamificationRedemption>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    rewardId: {
      type: Schema.Types.ObjectId,
      ref: 'GamificationReward',
      required: true,
    },
    pointsSpent: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'fulfilled', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    fulfilledAt: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
  }
);

// Compound indexes
gamificationRedemptionSchema.index({ memberId: 1, societyId: 1, isDeleted: 1 });
gamificationRedemptionSchema.index({ rewardId: 1, status: 1 });

const GamificationRedemption = model<IGamificationRedemption>(
  'GamificationRedemption',
  gamificationRedemptionSchema
);

export default GamificationRedemption;
