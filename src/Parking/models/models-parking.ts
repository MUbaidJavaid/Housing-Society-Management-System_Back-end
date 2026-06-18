import { Document, Schema, Types, model } from 'mongoose';

export enum SpotType {
  RESIDENT = 'resident',
  VISITOR = 'visitor',
  RESERVED = 'reserved',
  HANDICAP = 'handicap',
  EV_CHARGING = 'ev_charging',
}

export enum VehicleType {
  CAR = 'car',
  MOTORCYCLE = 'motorcycle',
  SUV = 'suv',
  VAN = 'van',
  BICYCLE = 'bicycle',
  OTHER = 'other',
}

export enum SpotStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  BLOCKED = 'blocked',
}

export interface IParkingSpot extends Document {
  spotNumber: string;
  societyId: Types.ObjectId;
  blockId?: Types.ObjectId;
  spotType: string;
  assignedTo?: Types.ObjectId;
  assignedPlotId?: Types.ObjectId;
  vehicleNumber?: string;
  vehicleType?: string;
  isOccupied: boolean;
  isAvailableForRent: boolean;
  rentPrice?: number;
  status: string;
  location?: string;
  metadata?: any;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const parkingSpotSchema = new Schema<IParkingSpot>(
  {
    spotNumber: {
      type: String,
      required: [true, 'Spot number is required'],
      trim: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
    },
    blockId: {
      type: Schema.Types.ObjectId,
      ref: 'PlotBlock',
    },
    spotType: {
      type: String,
      enum: Object.values(SpotType),
      required: [true, 'Spot type is required'],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
    },
    assignedPlotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: Object.values(VehicleType),
      trim: true,
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    isAvailableForRent: {
      type: Boolean,
      default: false,
    },
    rentPrice: {
      type: Number,
    },
    status: {
      type: String,
      enum: Object.values(SpotStatus),
      default: SpotStatus.ACTIVE,
    },
    location: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
  }
);

// Indexes
parkingSpotSchema.index(
  { societyId: 1, spotNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
parkingSpotSchema.index({ assignedTo: 1 });
parkingSpotSchema.index({ spotType: 1, isOccupied: 1 });

const ParkingSpot = model<IParkingSpot>('ParkingSpot', parkingSpotSchema);

export default ParkingSpot;
