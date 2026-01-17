import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IState extends Document {
  stateName: string;
  stateDescription?: string;
  statusId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const stateSchema = new Schema<IState>(
  {
    stateName: {
      type: String,
      required: [true, 'State Name is required'],
      trim: true,
      minlength: [2, 'State Name must be at least 2 characters'],
      maxlength: [100, 'State Name cannot exceed 100 characters'],
      index: true,
    },

    stateDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    statusId: {
      type: Schema.Types.ObjectId,
      ref: 'Status',
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
  }
);

// Compound index for name uniqueness
stateSchema.index(
  { stateName: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Text index for search
stateSchema.index(
  { stateName: 'text', stateDescription: 'text' },
  {
    weights: { stateName: 10, stateDescription: 5 },
    name: 'state_text_search',
  }
);

const State: Model<IState> = model<IState>('State', stateSchema);

export default State;
