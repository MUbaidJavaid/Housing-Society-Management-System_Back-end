import { Document, Schema, Types, model } from 'mongoose';

// @deprecated - use LookupValue collection (category: 'booking_status') instead
export const BookingStatus = [
  'Pending',
  'Confirmed',
  'Cancelled',
  'Completed',
  'NoShow',
  'Rejected',
] as const;

export type BookingStatusEnum = (typeof BookingStatus)[number];

export const PaymentStatus = ['pending', 'paid', 'refunded'] as const;
export type PaymentStatusEnum = (typeof PaymentStatus)[number];

export interface IFacilityBooking extends Document {
  facilityId: Types.ObjectId;
  memberId: Types.ObjectId;
  bookingCode: string;
  bookingDate: Date;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  purpose?: string;
  numberOfGuests: number;
  totalAmount: number;
  depositAmount: number;
  depositRefunded: boolean;
  depositRefundedAt?: Date;
  paymentStatus: PaymentStatusEnum;
  paymentReference?: string;
  status: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  remarks?: string;
  societyId: Types.ObjectId;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const facilityBookingSchema = new Schema<IFacilityBooking>(
  {
    facilityId: {
      type: Schema.Types.ObjectId,
      ref: 'Facility',
      required: [true, 'Facility is required'],
      index: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member is required'],
      index: true,
    },

    bookingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
      index: true,
    },

    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format'],
    },

    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format'],
    },

    duration: {
      type: Number,
      default: 0,
      min: [0, 'Duration cannot be negative'],
    },

    purpose: {
      type: String,
      trim: true,
      maxlength: [500, 'Purpose cannot exceed 500 characters'],
    },

    numberOfGuests: {
      type: Number,
      default: 1,
      min: [1, 'Number of guests must be at least 1'],
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },

    depositAmount: {
      type: Number,
      default: 0,
      min: [0, 'Deposit amount cannot be negative'],
    },

    depositRefunded: {
      type: Boolean,
      default: false,
    },

    depositRefundedAt: {
      type: Date,
    },

    paymentStatus: {
      type: String,
      enum: PaymentStatus,
      default: 'pending',
      index: true,
    },

    paymentReference: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      // Validated via LookupValue (category: 'booking_status')
      default: 'Pending',
      trim: true,
      index: true,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
    },

    approvedAt: {
      type: Date,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },

    cancelledAt: {
      type: Date,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required for tenant isolation'],
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
facilityBookingSchema.index({ facilityId: 1, bookingDate: 1, startTime: 1, endTime: 1 });
facilityBookingSchema.index({ memberId: 1, bookingDate: 1 });
facilityBookingSchema.index({ status: 1, bookingDate: 1 });
facilityBookingSchema.index({ bookingCode: 1 }, { unique: true });

// Virtual for facility
facilityBookingSchema.virtual('facility', {
  ref: 'Facility',
  localField: 'facilityId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for member
facilityBookingSchema.virtual('member', {
  ref: 'Member',
  localField: 'memberId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save: calculate duration and auto-generate bookingCode
facilityBookingSchema.pre('save', async function (next) {
  // Auto-generate booking code
  if (this.isNew && !this.bookingCode) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const count = await FacilityBooking.countDocuments();
    this.bookingCode = `BK-${dateStr}-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate duration from startTime and endTime
  if (this.startTime && this.endTime) {
    const [startH, startM] = this.startTime.split(':').map(Number);
    const [endH, endM] = this.endTime.split(':').map(Number);
    this.duration = (endH * 60 + endM) - (startH * 60 + startM);
    if (this.duration < 0) {
      this.duration += 24 * 60; // handle overnight
    }
  }

  // Check for time conflicts (only for new bookings or status changes)
  if (this.isNew || this.isModified('startTime') || this.isModified('endTime') || this.isModified('bookingDate')) {
    const conflicting = await FacilityBooking.findOne({
      _id: { $ne: this._id },
      facilityId: this.facilityId,
      bookingDate: this.bookingDate,
      status: { $in: ['Pending', 'Confirmed'] },
      isDeleted: false,
      $or: [
        {
          startTime: { $lt: this.endTime },
          endTime: { $gt: this.startTime },
        },
      ],
    });

    if (conflicting) {
      const error = new Error(
        `Time conflict: Facility is already booked from ${conflicting.startTime} to ${conflicting.endTime} on this date`
      );
      (error as any).statusCode = 409;
      return next(error);
    }
  }

  next();
});

const FacilityBooking = model<IFacilityBooking>('FacilityBooking', facilityBookingSchema);

export default FacilityBooking;
