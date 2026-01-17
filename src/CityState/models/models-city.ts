import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ICity extends Document {
  cityName: string;
  cityDescription?: string;
  stateId: Types.ObjectId;
  statusId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const citySchema = new Schema<ICity>(
  {
    cityName: {
      type: String,
      required: [true, 'City Name is required'],
      trim: true,
      minlength: [2, 'City Name must be at least 2 characters'],
      maxlength: [100, 'City Name cannot exceed 100 characters'],
      index: true,
    },

    cityDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    stateId: {
      type: Schema.Types.ObjectId,
      ref: 'State',
      required: true,
      index: true,
    },

    statusId: {
      type: Schema.Types.ObjectId,
      ref: 'Status', // General status lookup table
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

// Compound index for unique city name within state
citySchema.index(
  { cityName: 1, stateId: 1, isDeleted: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

// Text index for search
citySchema.index(
  { cityName: 'text', cityDescription: 'text' },
  {
    weights: { cityName: 10, cityDescription: 5 },
    name: 'city_text_search',
  }
);

const City: Model<ICity> = model<ICity>('City', citySchema);

export default City;
