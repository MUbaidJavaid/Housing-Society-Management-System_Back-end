import { Document, Schema, Types, model } from 'mongoose';

export interface IGatePassItem {
  name: string;
  quantity?: number;
  unit?: string;
  estimatedValue?: number;
}

export interface IGatePassPhoto {
  url: string;
  description?: string;
  capturedAt?: Date;
}

export interface IGatePass extends Document {
  passNumber: string;
  societyId: Types.ObjectId;
  passType: 'material_in' | 'material_out' | 'furniture_in' | 'furniture_out' | 'construction_material' | 'delivery_large' | 'moving_in' | 'moving_out';
  requestedBy: Types.ObjectId;
  plotId?: Types.ObjectId;
  description: string;
  items: IGatePassItem[];
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  driverCNIC?: string;
  driverPhone?: string;
  companyName?: string;
  expectedDate: Date;
  expectedTime?: string;
  actualEntryTime?: Date;
  actualExitTime?: Date;
  photos: IGatePassPhoto[];
  approvedBy?: Types.ObjectId;
  approvalDate?: Date;
  checkedInBy?: Types.ObjectId;
  checkedOutBy?: Types.ObjectId;
  securityNotes?: string;
  status: 'requested' | 'approved' | 'rejected' | 'checked_in' | 'checked_out' | 'expired' | 'cancelled';
  rejectionReason?: string;
  passCode: string;
  metadata: any;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gatePassItemSchema = new Schema<IGatePassItem>(
  {
    name: {
      type: String,
    },
    quantity: {
      type: Number,
    },
    unit: {
      type: String,
    },
    estimatedValue: {
      type: Number,
    },
  },
  { _id: true }
);

const gatePassPhotoSchema = new Schema<IGatePassPhoto>(
  {
    url: {
      type: String,
    },
    description: {
      type: String,
    },
    capturedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const gatePassSchema = new Schema<IGatePass>(
  {
    passNumber: {
      type: String,
      required: [true, 'Pass number is required'],
      unique: true,
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
    },

    passType: {
      type: String,
      required: [true, 'Pass type is required'],
      enum: [
        'material_in', 'material_out', 'furniture_in', 'furniture_out',
        'construction_material', 'delivery_large', 'moving_in', 'moving_out',
      ],
    },

    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Requested by is required'],
    },

    plotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
    },

    items: [gatePassItemSchema],

    vehicleNumber: {
      type: String,
    },

    vehicleType: {
      type: String,
    },

    driverName: {
      type: String,
    },

    driverCNIC: {
      type: String,
    },

    driverPhone: {
      type: String,
    },

    companyName: {
      type: String,
    },

    expectedDate: {
      type: Date,
      required: [true, 'Expected date is required'],
    },

    expectedTime: {
      type: String,
    },

    actualEntryTime: {
      type: Date,
    },

    actualExitTime: {
      type: Date,
    },

    photos: [gatePassPhotoSchema],

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    approvalDate: {
      type: Date,
    },

    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    checkedOutBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    securityNotes: {
      type: String,
    },

    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'checked_in', 'checked_out', 'expired', 'cancelled'],
      default: 'requested',
    },

    rejectionReason: {
      type: String,
    },

    passCode: {
      type: String,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
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
gatePassSchema.index({ passNumber: 1 }, { unique: true });
gatePassSchema.index({ societyId: 1, status: 1, isDeleted: 1 });
gatePassSchema.index({ requestedBy: 1 });
gatePassSchema.index({ passCode: 1 });
gatePassSchema.index({ expectedDate: 1 });

// Pre-save hook: auto-generate passNumber and passCode
gatePassSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Auto-generate pass number: GP-YYYY-XXXXX
    if (!this.passNumber) {
      const year = new Date().getFullYear();
      const count = await GatePass.countDocuments();
      const sequence = String(count + 1).padStart(5, '0');
      this.passNumber = `GP-${year}-${sequence}`;
    }

    // Auto-generate 6-digit pass code
    if (!this.passCode) {
      this.passCode = String(Math.floor(100000 + Math.random() * 900000));
    }
  }

  next();
});

const GatePass = model<IGatePass>('GatePass', gatePassSchema);

export default GatePass;
