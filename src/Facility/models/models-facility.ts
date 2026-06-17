import { Document, Schema, Types, model } from 'mongoose';

// @deprecated - use LookupValue collection (category: 'facility_type') instead
export const FacilityType = [
  'Community Hall',
  'Swimming Pool',
  'Gym',
  'Sports Court',
  'Park',
  'BBQ Area',
  'Meeting Room',
  'Parking',
  'Other',
] as const;

export type FacilityTypeEnum = (typeof FacilityType)[number];

export interface IOperatingHour {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  isClosed: boolean;
}

export interface IFacility extends Document {
  facilityName: string;
  facilityCode: string;
  description?: string;
  facilityType: string;
  location?: string;
  capacity?: number;
  images?: string[];
  amenities?: string[];
  hourlyRate: number;
  halfDayRate: number;
  fullDayRate: number;
  securityDeposit: number;
  currency: string;
  operatingHours: IOperatingHour[];
  slotDurationMinutes: number;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  cancellationPolicyHours: number;
  requiresApproval: boolean;
  rules?: string;
  societyId?: Types.ObjectId;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const operatingHourSchema = new Schema<IOperatingHour>(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    openTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Open time must be in HH:mm format'],
    },
    closeTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Close time must be in HH:mm format'],
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const facilitySchema = new Schema<IFacility>(
  {
    facilityName: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
      minlength: [3, 'Facility name must be at least 3 characters'],
      maxlength: [200, 'Facility name cannot exceed 200 characters'],
      index: true,
    },

    facilityCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    facilityType: {
      type: String,
      // Validated via LookupValue (category: 'facility_type')
      required: [true, 'Facility type is required'],
      trim: true,
      index: true,
    },

    location: {
      type: String,
      trim: true,
      maxlength: [500, 'Location cannot exceed 500 characters'],
    },

    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
    },

    images: {
      type: [String],
      default: [],
    },

    amenities: {
      type: [String],
      default: [],
    },

    hourlyRate: {
      type: Number,
      default: 0,
      min: [0, 'Hourly rate cannot be negative'],
    },

    halfDayRate: {
      type: Number,
      default: 0,
      min: [0, 'Half day rate cannot be negative'],
    },

    fullDayRate: {
      type: Number,
      default: 0,
      min: [0, 'Full day rate cannot be negative'],
    },

    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative'],
    },

    currency: {
      type: String,
      default: 'PKR',
      trim: true,
      maxlength: [5, 'Currency code cannot exceed 5 characters'],
    },

    operatingHours: {
      type: [operatingHourSchema],
      default: [],
    },

    slotDurationMinutes: {
      type: Number,
      default: 60,
      min: [15, 'Slot duration must be at least 15 minutes'],
      max: [480, 'Slot duration cannot exceed 480 minutes'],
    },

    maxAdvanceBookingDays: {
      type: Number,
      default: 30,
      min: [1, 'Max advance booking days must be at least 1'],
    },

    minAdvanceBookingHours: {
      type: Number,
      default: 24,
      min: [0, 'Min advance booking hours cannot be negative'],
    },

    cancellationPolicyHours: {
      type: Number,
      default: 24,
      min: [0, 'Cancellation policy hours cannot be negative'],
    },

    requiresApproval: {
      type: Boolean,
      default: false,
    },

    rules: {
      type: String,
      trim: true,
      maxlength: [5000, 'Rules cannot exceed 5000 characters'],
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      required: true,
      index: true,
    },

    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
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
facilitySchema.index({ facilityCode: 1, societyId: 1 }, { unique: true });
facilitySchema.index({ facilityType: 1, isActive: 1, isDeleted: 1 });
facilitySchema.index({ societyId: 1, isActive: 1, isDeleted: 1 });

// Text index for search
facilitySchema.index(
  { facilityName: 'text', description: 'text', location: 'text' },
  {
    weights: { facilityName: 10, description: 5, location: 3 },
    name: 'facility_text_search',
  }
);

// Pre-save: auto-generate facilityCode
facilitySchema.pre('save', async function (next) {
  if (this.isNew && !this.facilityCode) {
    const prefix = this.facilityType
      .replace(/\s+/g, '')
      .substring(0, 3)
      .toUpperCase();
    const count = await Facility.countDocuments({
      facilityType: this.facilityType,
      societyId: this.societyId,
    });
    this.facilityCode = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Facility = model<IFacility>('Facility', facilitySchema);

export default Facility;
