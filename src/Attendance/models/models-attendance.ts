import { Document, Schema, Types, model } from 'mongoose';

export interface IAttendance extends Document {
  staffId: Types.ObjectId;
  societyId: Types.ObjectId;
  date: Date;
  checkInTime: Date;
  checkOutTime?: Date;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  isWithinGeofence: boolean;
  geofenceId?: Types.ObjectId;
  shiftName?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave' | 'holiday';
  totalHours?: number;
  overtimeHours: number;
  remarks?: string;
  metadata: Record<string, any>;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
  },
  { _id: false }
);

const attendanceSchema = new Schema<IAttendance>(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    checkOutTime: {
      type: Date,
    },
    checkInLocation: {
      type: locationSchema,
    },
    checkOutLocation: {
      type: locationSchema,
    },
    isWithinGeofence: {
      type: Boolean,
      default: false,
    },
    geofenceId: {
      type: Schema.Types.ObjectId,
      ref: 'Geofence',
    },
    shiftName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'leave', 'holiday'],
      default: 'present',
      index: true,
    },
    totalHours: {
      type: Number,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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
attendanceSchema.index(
  { staffId: 1, date: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
attendanceSchema.index({ societyId: 1, date: 1 });

const Attendance = model<IAttendance>('Attendance', attendanceSchema);

export default Attendance;
