import { Document, Schema, Types, model } from 'mongoose';

export interface IGamificationReward extends Document {
  societyId: Types.ObjectId;
  rewardName: string;
  description?: string;
  pointsCost: number;
  quantity: number;
  rewardType: 'discount' | 'free-booking' | 'merchandise' | 'recognition' | 'donation';
  rewardValue?: any;
  validUntil?: Date;
  isActive: boolean;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gamificationRewardSchema = new Schema<IGamificationReward>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    rewardName: {
      type: String,
      required: [true, 'Reward name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    pointsCost: {
      type: Number,
      required: [true, 'Points cost is required'],
      min: [1, 'Points cost must be at least 1'],
    },
    quantity: {
      type: Number,
      default: -1, // -1 = unlimited
    },
    rewardType: {
      type: String,
      enum: ['discount', 'free-booking', 'merchandise', 'recognition', 'donation'],
      required: [true, 'Reward type is required'],
    },
    rewardValue: {
      type: Schema.Types.Mixed,
    },
    validUntil: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
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
gamificationRewardSchema.index({ societyId: 1, isActive: 1, isDeleted: 1 });

const GamificationReward = model<IGamificationReward>(
  'GamificationReward',
  gamificationRewardSchema
);

export default GamificationReward;
