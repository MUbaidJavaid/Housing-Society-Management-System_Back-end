import { Document, Model, Schema, Types, model, models } from 'mongoose';

// ------------------- ENUMS -------------------
export enum FileStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  CANCELLED = 'Cancelled',
  MERGED = 'Merged',
  CLOSED = 'Closed',
  SUSPENDED = 'Suspended',
  TRANSFERRED = 'Transferred',
  DISPUTED = 'Disputed',
}

export enum PaymentMode {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  CHEQUE = 'Cheque',
  CREDIT_CARD = 'Credit Card',
  DEBIT_CARD = 'Debit Card',
  ONLINE = 'Online',
  MOBILE_WALLET = 'Mobile Wallet',
  OTHER = 'Other',
}

// ------------------- INTERFACE -------------------
export interface IFile extends Document {
  fileRegNo: string;
  fileBarCode: string;
  projId: Types.ObjectId;
  memId: Types.ObjectId;
  nomineeId?: Types.ObjectId;
  applicationId?: Types.ObjectId;
  plotId?: Types.ObjectId;
  plotTypeId?: Types.ObjectId;
  plotSizeId?: Types.ObjectId;
  plotBlockId?: Types.ObjectId;
  totalAmount: number;
  downPayment: number;
  paymentMode: PaymentMode;
  isAdjusted: boolean;
  adjustmentRef?: string;
  status: FileStatus;
  fileRemarks?: string;
  bookingDate: Date;
  expectedCompletionDate?: Date;
  actualCompletionDate?: Date;
  cancellationDate?: Date;
  cancellationReason?: string;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  project?: any;
  member?: any;
  nominee?: any;
  application?: any;
  plot?: any;
  plotType?: any;
  plotSize?: any;
  plotBlock?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  balanceAmount?: number;
  paymentPercentage?: number;
  fileAge?: number;
  statusBadgeColor?: string;
}

// ------------------- SCHEMA -------------------
const fileSchema = new Schema<IFile>(
  {
    fileRegNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 5,
      maxlength: 50,
    },
    fileBarCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    projId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    memId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    nomineeId: { type: Schema.Types.ObjectId, ref: 'Nominee' },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
    plotId: { type: Schema.Types.ObjectId, ref: 'Plot' },
    plotTypeId: { type: Schema.Types.ObjectId, ref: 'PlotType' },
    plotSizeId: { type: Schema.Types.ObjectId, ref: 'PlotSize' },
    plotBlockId: { type: Schema.Types.ObjectId, ref: 'PlotBlock' },
    totalAmount: { type: Number, required: true, min: 0 },
    downPayment: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (this: IFile, value: number) {
          return value <= this.totalAmount;
        },
        message: 'Down payment cannot exceed total amount',
      },
    },
    paymentMode: { type: String, enum: Object.values(PaymentMode), required: true },
    isAdjusted: { type: Boolean, default: false },
    adjustmentRef: { type: String, trim: true, maxlength: 100 },
    status: {
      type: String,
      enum: Object.values(FileStatus),
      default: FileStatus.PENDING,
    },
    fileRemarks: { type: String, trim: true, maxlength: 1000 },
    bookingDate: { type: Date, required: true },
    expectedCompletionDate: { type: Date },
    actualCompletionDate: { type: Date },
    cancellationDate: { type: Date },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserStaff', required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'UserStaff' },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ------------------- INDEXES -------------------
// Only define indexes here, NOT in the schema fields
fileSchema.index({ fileRegNo: 1, isDeleted: 1 }, { unique: true });
fileSchema.index({ fileBarCode: 1, isDeleted: 1 }, { unique: true });
fileSchema.index({ projId: 1, memId: 1 });
fileSchema.index({ status: 1, isActive: 1 });
fileSchema.index({ memId: 1, isDeleted: 1 });
fileSchema.index({ bookingDate: -1, status: 1 });
fileSchema.index({ fileRegNo: 1 });
fileSchema.index({ fileBarCode: 1 });
fileSchema.index({ projId: 1 });
fileSchema.index({ memId: 1 });
fileSchema.index({ status: 1 });
fileSchema.index({ bookingDate: 1 });
fileSchema.index({ isActive: 1 });
fileSchema.index({ isDeleted: 1 });
fileSchema.index({ createdBy: 1 });
fileSchema.index({ paymentMode: 1 });

// Text index for search
fileSchema.index(
  {
    fileRegNo: 'text',
    fileBarCode: 'text',
    fileRemarks: 'text',
    adjustmentRef: 'text',
    cancellationReason: 'text',
  },
  {
    weights: {
      fileRegNo: 10,
      fileBarCode: 8,
      adjustmentRef: 5,
      fileRemarks: 3,
      cancellationReason: 3,
    },
    name: 'file_text_search',
  }
);

// ------------------- VIRTUALS -------------------
fileSchema.virtual('balanceAmount').get(function () {
  return this.totalAmount - this.downPayment;
});

fileSchema.virtual('paymentPercentage').get(function () {
  if (this.totalAmount === 0) return 0;
  return Math.round((this.downPayment / this.totalAmount) * 100);
});

fileSchema.virtual('fileAge').get(function () {
  const diff = Math.abs(new Date().getTime() - this.bookingDate.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

fileSchema.virtual('statusBadgeColor').get(function () {
  const colors: Record<string, string> = {
    [FileStatus.ACTIVE]: 'success',
    [FileStatus.PENDING]: 'warning',
    [FileStatus.CANCELLED]: 'danger',
    [FileStatus.MERGED]: 'info',
    [FileStatus.CLOSED]: 'secondary',
    [FileStatus.SUSPENDED]: 'dark',
    [FileStatus.TRANSFERRED]: 'primary',
    [FileStatus.DISPUTED]: 'danger',
  };
  return colors[this.status] || 'secondary';
});

// Virtual relationships
fileSchema.virtual('project', {
  ref: 'Project',
  localField: 'projId',
  foreignField: '_id',
  justOne: true,
});

fileSchema.virtual('member', {
  ref: 'Member',
  localField: 'memId',
  foreignField: '_id',
  justOne: true,
});

fileSchema.virtual('nominee', {
  ref: 'Nominee',
  localField: 'nomineeId',
  foreignField: '_id',
  justOne: true,
});

fileSchema.virtual('application', {
  ref: 'Application',
  localField: 'applicationId',
  foreignField: '_id',
  justOne: true,
});

fileSchema.virtual('plot', {
  ref: 'Plot',
  localField: 'plotId',
  foreignField: '_id',
  justOne: true,
});

fileSchema.virtual('plotType', {
  ref: 'PlotType',
  localField: 'plotTypeId',
  foreignField: '_id',
  justOne: true,
});

fileSchema.virtual('plotSize', {
  ref: 'PlotSize',
  localField: 'plotSizeId',
  foreignField: '_id',
  justOne: true,
});

fileSchema.virtual('plotBlock', {
  ref: 'PlotBlock',
  localField: 'plotBlockId',
  foreignField: '_id',
  justOne: true,
});

fileSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

fileSchema.virtual('modifiedByUser', {
  ref: 'UserStaff',
  localField: 'modifiedBy',
  foreignField: '_id',
  justOne: true,
});

// ------------------- PRE SAVE -------------------
fileSchema.pre('save', function (next) {
  if (this.isModified('fileRegNo')) {
    this.fileRegNo = this.fileRegNo.toUpperCase();
  }

  if (!this.fileBarCode || this.isModified('fileRegNo')) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    this.fileBarCode = `BC-${this.fileRegNo}-${timestamp}-${random}`;
  }

  if (!this.expectedCompletionDate) {
    const expected = new Date(this.bookingDate);
    expected.setFullYear(expected.getFullYear() + 1);
    this.expectedCompletionDate = expected;
  }

  if (this.isModified('status') && this.status === FileStatus.CANCELLED && !this.cancellationDate) {
    this.cancellationDate = new Date();
  }

  next();
});

// ------------------- PRE UPDATE -------------------
fileSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update) {
    if (update.fileRegNo) {
      update.fileRegNo = update.fileRegNo.toUpperCase();
    }

    if (update.status === FileStatus.CANCELLED) {
      update.cancellationDate = new Date();
    }

    if (update.status === FileStatus.CLOSED && !update.actualCompletionDate) {
      update.actualCompletionDate = new Date();
    }
  }

  next();
});

// ------------------- STATIC METHODS -------------------
interface IFileModel extends Model<IFile> {
  findByRegNo(fileRegNo: string): Promise<IFile | null>;
  findByBarcode(fileBarCode: string): Promise<IFile | null>;
  findActiveFilesByMember(memId: string): Promise<IFile[]>;
  getFileStatistics(): Promise<any>;
}

fileSchema.statics.findByRegNo = function (fileRegNo: string) {
  return this.findOne({ fileRegNo: fileRegNo.toUpperCase(), isDeleted: false });
};

fileSchema.statics.findByBarcode = function (fileBarCode: string) {
  return this.findOne({ fileBarCode, isDeleted: false });
};

fileSchema.statics.findActiveFilesByMember = function (memId: string) {
  return this.find({
    memId: new Types.ObjectId(memId),
    isDeleted: false,
    isActive: true,
  })
    .populate('project', 'projName')
    .populate('plot', 'plotNo plotSize')
    .sort({ bookingDate: -1 });
};

fileSchema.statics.getFileStatistics = function () {
  return this.aggregate([
    {
      $match: { isDeleted: false },
    },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        activeFiles: { $sum: { $cond: [{ $eq: ['$status', FileStatus.ACTIVE] }, 1, 0] } },
        pendingFiles: { $sum: { $cond: [{ $eq: ['$status', FileStatus.PENDING] }, 1, 0] } },
        cancelledFiles: { $sum: { $cond: [{ $eq: ['$status', FileStatus.CANCELLED] }, 1, 0] } },
        totalAmount: { $sum: '$totalAmount' },
        totalDownPayment: { $sum: '$downPayment' },
      },
    },
  ]);
};

// ------------------- MODEL EXPORT -------------------
const File = (models?.File as IFileModel) || model<IFile, IFileModel>('File', fileSchema);

export default File;
