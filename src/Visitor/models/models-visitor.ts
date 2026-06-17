import { Document, Model, Schema, Types, model } from 'mongoose';

// @deprecated - use LookupValue collection (category: 'visitor_purpose') instead
export enum VisitorPurpose {
  PERSONAL = 'Personal',
  BUSINESS = 'Business',
  DELIVERY = 'Delivery',
  MAINTENANCE = 'Maintenance',
  GOVERNMENT = 'Government',
  EMERGENCY = 'Emergency',
  OTHER = 'Other',
}

// @deprecated - use LookupValue collection (category: 'visitor_status') instead
export enum VisitorStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  CHECKED_IN = 'CheckedIn',
  CHECKED_OUT = 'CheckedOut',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
  CANCELLED = 'Cancelled',
}

// @deprecated - use LookupValue collection (category: 'vehicle_type') instead
export enum VehicleType {
  CAR = 'car',
  MOTORCYCLE = 'motorcycle',
  BICYCLE = 'bicycle',
  OTHER = 'other',
}

export interface IVisitor extends Document {
  visitorName: string;
  visitorNic?: string;
  visitorPhone: string;
  visitorEmail?: string;
  visitorCompany?: string;
  visitorPhoto?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  purpose: string;
  hostMemberId: Types.ObjectId;
  hostPlotId?: Types.ObjectId;
  passCode: string;
  qrCodeData: string;
  preApproved: boolean;
  preApprovedBy?: Types.ObjectId;
  preApprovedAt?: Date;
  expectedDate: Date;
  expectedTimeIn?: string;
  expectedTimeOut?: string;
  actualTimeIn?: Date;
  actualTimeOut?: Date;
  checkedInBy?: Types.ObjectId;
  checkedOutBy?: Types.ObjectId;
  status: string;
  remarks?: string;
  gateNumber?: string;
  numberOfGuests: number;
  societyId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
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

const visitorSchema = new Schema<IVisitor>(
  {
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
      minlength: [2, 'Visitor name must be at least 2 characters'],
      maxlength: [200, 'Visitor name cannot exceed 200 characters'],
    },
    visitorNic: {
      type: String,
      trim: true,
    },
    visitorPhone: {
      type: String,
      required: [true, 'Visitor phone is required'],
      trim: true,
    },
    visitorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    visitorCompany: {
      type: String,
      trim: true,
    },
    visitorPhoto: {
      type: String,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    vehicleType: {
      type: String,
      // Validated via LookupValue (category: 'vehicle_type')
      trim: true,
    },
    purpose: {
      type: String,
      // Validated via LookupValue (category: 'visitor_purpose')
      required: [true, 'Visit purpose is required'],
      trim: true,
      index: true,
    },
    hostMemberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Host member ID is required'],
    },
    hostPlotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
    },
    passCode: {
      type: String,
      unique: true,
      trim: true,
    },
    qrCodeData: {
      type: String,
    },
    preApproved: {
      type: Boolean,
      default: false,
    },
    preApprovedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
    },
    preApprovedAt: {
      type: Date,
    },
    expectedDate: {
      type: Date,
      required: [true, 'Expected date is required'],
    },
    expectedTimeIn: {
      type: String,
      trim: true,
    },
    expectedTimeOut: {
      type: String,
      trim: true,
    },
    actualTimeIn: {
      type: Date,
    },
    actualTimeOut: {
      type: Date,
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
    },
    checkedOutBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
    },
    status: {
      type: String,
      // Validated via LookupValue (category: 'visitor_status')
      default: 'Pending',
      trim: true,
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },
    gateNumber: {
      type: String,
      trim: true,
    },
    numberOfGuests: {
      type: Number,
      default: 1,
      min: [1, 'Number of guests must be at least 1'],
      max: [20, 'Number of guests cannot exceed 20'],
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
visitorSchema.index({ status: 1, expectedDate: 1 });
visitorSchema.index({ hostMemberId: 1 });
visitorSchema.index({ passCode: 1 }, { unique: true });
visitorSchema.index({ actualTimeIn: 1, actualTimeOut: 1 });
visitorSchema.index({ isDeleted: 1 });
visitorSchema.index({ createdBy: 1 });
visitorSchema.index({ preApproved: 1 });
visitorSchema.index({ societyId: 1 });
visitorSchema.index({ expectedDate: 1 });

// Text index for search
visitorSchema.index(
  { visitorName: 'text', visitorPhone: 'text', visitorCompany: 'text', remarks: 'text' },
  {
    weights: { visitorName: 10, visitorPhone: 5, visitorCompany: 3, remarks: 1 },
    name: 'visitor_text_search',
  }
);

// Pre-save: auto-generate passCode and qrCodeData
visitorSchema.pre('save', async function (next) {
  if (this.isNew && !this.passCode) {
    let code = generatePassCode();
    // Ensure uniqueness
    const VisitorModel = this.constructor as Model<IVisitor>;
    let exists = await VisitorModel.findOne({ passCode: code });
    let attempts = 0;
    while (exists && attempts < 10) {
      code = generatePassCode();
      exists = await VisitorModel.findOne({ passCode: code });
      attempts++;
    }
    if (exists) {
      return next(new Error('Unable to generate unique pass code. Please try again.'));
    }
    this.passCode = code;
  }

  // Generate QR code data
  if (this.isNew || this.isModified('passCode') || this.isModified('expectedDate')) {
    this.qrCodeData = JSON.stringify({
      visitorName: this.visitorName,
      passCode: this.passCode,
      expectedDate: this.expectedDate,
      hostMemberId: this.hostMemberId,
      purpose: this.purpose,
    });
  }

  next();
});

// Static methods
interface IVisitorModel extends Model<IVisitor> {
  findByPassCode(code: string): Promise<IVisitor | null>;
  getVisitorStats(filters?: { societyId?: Types.ObjectId; fromDate?: Date; toDate?: Date }): Promise<any>;
}

visitorSchema.statics.findByPassCode = function (code: string): Promise<IVisitor | null> {
  return this.findOne({
    passCode: code.toUpperCase(),
    isDeleted: false,
  })
    .populate('hostMemberId', 'memName memContEmail memContMob memAddr1')
    .populate('hostPlotId', 'plotNo sectorNo blockNo size')
    .populate('checkedInBy', 'firstName lastName')
    .populate('checkedOutBy', 'firstName lastName');
};

visitorSchema.statics.getVisitorStats = async function (
  filters?: { societyId?: Types.ObjectId; fromDate?: Date; toDate?: Date }
) {
  const matchQuery: any = { isDeleted: false };

  if (filters?.societyId) {
    matchQuery.societyId = filters.societyId;
  }
  if (filters?.fromDate || filters?.toDate) {
    matchQuery.expectedDate = {};
    if (filters?.fromDate) matchQuery.expectedDate.$gte = filters.fromDate;
    if (filters?.toDate) matchQuery.expectedDate.$lte = filters.toDate;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [statusCounts, todayCounts, purposeCounts] = await Promise.all([
    this.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      {
        $match: {
          ...matchQuery,
          expectedDate: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$purpose', count: { $sum: 1 } } },
    ]),
  ]);

  const stats: any = {
    total: 0,
    pending: 0,
    approved: 0,
    checkedIn: 0,
    checkedOut: 0,
    rejected: 0,
    expired: 0,
    cancelled: 0,
    todayVisitors: 0,
    todayCheckedIn: 0,
    todayCheckedOut: 0,
    byPurpose: {},
  };

  statusCounts.forEach((item: any) => {
    const count = item.count;
    stats.total += count;
    switch (item._id) {
      case 'Pending': stats.pending = count; break;
      case 'Approved': stats.approved = count; break;
      case 'CheckedIn': stats.checkedIn = count; break;
      case 'CheckedOut': stats.checkedOut = count; break;
      case 'Rejected': stats.rejected = count; break;
      case 'Expired': stats.expired = count; break;
      case 'Cancelled': stats.cancelled = count; break;
    }
  });

  todayCounts.forEach((item: any) => {
    stats.todayVisitors += item.count;
    if (item._id === 'CheckedIn') stats.todayCheckedIn = item.count;
    if (item._id === 'CheckedOut') stats.todayCheckedOut = item.count;
  });

  purposeCounts.forEach((item: any) => {
    stats.byPurpose[item._id] = item.count;
  });

  return stats;
};

const Visitor = model<IVisitor, IVisitorModel>('Visitor', visitorSchema);

export default Visitor;
