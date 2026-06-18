import { Document, Schema, Types, model } from 'mongoose';

export interface IGeofence extends Document {
  name: string;
  societyId: Types.ObjectId;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const geofenceSchema = new Schema<IGeofence>(
  {
    name: {
      type: String,
      required: [true, 'Geofence name is required'],
      trim: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    radius: {
      type: Number,
      required: [true, 'Radius is required'],
      default: 100,
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
geofenceSchema.index({ societyId: 1, isActive: 1, isDeleted: 1 });

const Geofence = model<IGeofence>('Geofence', geofenceSchema);

export default Geofence;
