import { Document, Schema, Types, model } from 'mongoose';

export interface IPointHistoryEntry {
  event: string;
  points: number;
  date: Date;
  description?: string;
  referenceType?: string;
  referenceId?: Types.ObjectId;
}

export interface IGamificationPoints extends Document {
  memberId: Types.ObjectId;
  societyId: Types.ObjectId;
  totalPoints: number;
  currentPoints: number;
  level: string;
  history: IPointHistoryEntry[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pointHistorySchema = new Schema(
  {
    event: { type: String, required: true },
    points: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
  },
  { _id: false }
);

const gamificationPointsSchema = new Schema<IGamificationPoints>(
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
    totalPoints: {
      type: Number,
      default: 0,
    },
    currentPoints: {
      type: Number,
      default: 0,
    },
    level: {
      type: String,
      default: 'Bronze',
    },
    history: {
      type: [pointHistorySchema],
      default: [],
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
gamificationPointsSchema.index(
  { memberId: 1, societyId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
gamificationPointsSchema.index({ societyId: 1, totalPoints: -1 });

const GamificationPoints = model<IGamificationPoints>(
  'GamificationPoints',
  gamificationPointsSchema
);

export default GamificationPoints;
