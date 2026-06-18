import { Document, Schema, Types, model } from 'mongoose';

export interface IPollOption {
  text: string;
  description?: string;
  voteCount: number;
}

export interface IPollVote {
  memberId: Types.ObjectId;
  optionIndex: number;
  votedAt: Date;
  ipAddress?: string;
}

export interface ITargetAudience {
  type: 'all' | 'block' | 'role';
  value?: string;
}

export interface IPoll extends Document {
  title: string;
  description?: string;
  societyId: Types.ObjectId;
  pollType: 'survey' | 'vote' | 'election' | 'feedback';
  options: IPollOption[];
  votes: IPollVote[];
  isAnonymous: boolean;
  allowMultipleChoices: boolean;
  maxChoices: number;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'closed' | 'cancelled';
  targetAudience?: ITargetAudience;
  totalVoters: number;
  results: any;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pollSchema = new Schema<IPoll>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    description: {
      type: String,
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society is required'],
    },

    pollType: {
      type: String,
      required: [true, 'Poll type is required'],
      enum: ['survey', 'vote', 'election', 'feedback'],
    },

    options: [
      {
        text: { type: String, required: true },
        description: { type: String },
        voteCount: { type: Number, default: 0 },
      },
    ],

    votes: [
      {
        memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
        optionIndex: { type: Number },
        votedAt: { type: Date, default: Date.now },
        ipAddress: { type: String },
      },
    ],

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    allowMultipleChoices: {
      type: Boolean,
      default: false,
    },

    maxChoices: {
      type: Number,
      default: 1,
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'closed', 'cancelled'],
      default: 'draft',
    },

    targetAudience: {
      type: {
        type: String,
        enum: ['all', 'block', 'role'],
      },
      value: { type: String },
    },

    totalVoters: {
      type: Number,
      default: 0,
    },

    results: {
      type: Schema.Types.Mixed,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },

    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    isDeleted: {
      type: Boolean,
      default: false,
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
pollSchema.index({ societyId: 1, status: 1, isDeleted: 1 });
pollSchema.index({ endDate: 1 });
pollSchema.index({ 'votes.memberId': 1 });

const Poll = model<IPoll>('Poll', pollSchema);

export default Poll;
