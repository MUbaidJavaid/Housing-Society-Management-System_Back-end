import { Document, Model, Schema, Types, model } from 'mongoose';

export enum PassPurpose {
  VISITOR = 'visitor',
  DELIVERY = 'delivery',
  CONTRACTOR = 'contractor',
  EVENT = 'event',
}

export enum PassStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export interface IParkingPass extends Document {
  societyId: Types.ObjectId;
  spotId?: Types.ObjectId;
  issuedTo: string;
  vehicleNumber: string;
  vehicleType?: string;
  purpose: string;
  issuedBy: Types.ObjectId;
  authorizedBy?: Types.ObjectId;
  validFrom: Date;
  validUntil: Date;
  passCode?: string;
  status: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate a 6-character uppercase alphanumeric pass code
 */
function generatePassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const parkingPassSchema = new Schema<IParkingPass>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
    },
    spotId: {
      type: Schema.Types.ObjectId,
      ref: 'ParkingSpot',
    },
    issuedTo: {
      type: String,
      required: [true, 'Issued to (visitor name or delivery company) is required'],
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
    },
    vehicleType: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      enum: Object.values(PassPurpose),
      required: [true, 'Purpose is required'],
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorizedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
    },
    validFrom: {
      type: Date,
      required: [true, 'Valid from date is required'],
    },
    validUntil: {
      type: Date,
      required: [true, 'Valid until date is required'],
    },
    passCode: {
      type: String,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(PassStatus),
      default: PassStatus.ACTIVE,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
parkingPassSchema.index({ societyId: 1, status: 1 });
parkingPassSchema.index({ passCode: 1 });
parkingPassSchema.index({ validUntil: 1 });

// Pre-save: auto-generate passCode
parkingPassSchema.pre('save', async function (next) {
  if (this.isNew && !this.passCode) {
    let code = generatePassCode();
    const PassModel = this.constructor as Model<IParkingPass>;
    let exists = await PassModel.findOne({ passCode: code });
    let attempts = 0;
    while (exists && attempts < 10) {
      code = generatePassCode();
      exists = await PassModel.findOne({ passCode: code });
      attempts++;
    }
    if (exists) {
      return next(new Error('Unable to generate unique pass code. Please try again.'));
    }
    this.passCode = code;
  }
  next();
});

const ParkingPass = model<IParkingPass>('ParkingPass', parkingPassSchema);

export default ParkingPass;
