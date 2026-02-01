import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IRegistry extends Document {
  plotId: Types.ObjectId;
  memId: Types.ObjectId;
  registryNo: string;
  mozaVillage?: string;
  khasraNo?: string;
  khewatNo?: string;
  khatoniNo?: string;
  mutationNo: string;
  mutationDate?: Date;
  areaKanal?: number;
  areaMarla?: number;
  areaSqft?: number;
  mutationArea?: string;
  legalOfficeDetails?: string;
  subRegistrarName?: string;
  agreementDate?: Date;
  stampPaperNo?: string;
  tabadlaNama?: string;
  bookNo?: string;
  volumeNo?: string;
  documentNo?: string;
  reportNo?: string;
  scanCopyPath?: string;
  landOwnerPhoto?: string;
  remarks?: string;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  verificationRemarks?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  isActive: boolean;
  registeredBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  plot?: any;
  member?: any;
  registeredByUser?: any;
  updatedByUser?: any;
  verifiedByUser?: any;
  totalArea?: string;
  verificationBadgeColor?: string;
  mutationAge?: number;
}

const registrySchema = new Schema<IRegistry>(
  {
    plotId: {
      type: Schema.Types.ObjectId,
      ref: 'Plot',
      required: true,
      index: true,
    },

    memId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },

    registryNo: {
      type: String,
      required: [true, 'Registry number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, 'Registry number must be at least 3 characters'],
      maxlength: [100, 'Registry number cannot exceed 100 characters'],
      index: true,
    },

    mozaVillage: {
      type: String,
      trim: true,
      maxlength: [200, 'Moza/Village cannot exceed 200 characters'],
      index: true,
    },

    khasraNo: {
      type: String,
      trim: true,
      maxlength: [50, 'Khasra number cannot exceed 50 characters'],
      index: true,
    },

    khewatNo: {
      type: String,
      trim: true,
      maxlength: [50, 'Khewat number cannot exceed 50 characters'],
      index: true,
    },

    khatoniNo: {
      type: String,
      trim: true,
      maxlength: [50, 'Khatoni number cannot exceed 50 characters'],
      index: true,
    },

    mutationNo: {
      type: String,
      required: [true, 'Mutation number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, 'Mutation number must be at least 3 characters'],
      maxlength: [100, 'Mutation number cannot exceed 100 characters'],
      index: true,
    },

    mutationDate: {
      type: Date,
      index: true,
    },

    areaKanal: {
      type: Number,
      min: [0, 'Area in Kanal cannot be negative'],
      max: [1000, 'Area in Kanal cannot exceed 1000'],
    },

    areaMarla: {
      type: Number,
      min: [0, 'Area in Marla cannot be negative'],
      max: [20000, 'Area in Marla cannot exceed 20000'],
    },

    areaSqft: {
      type: Number,
      min: [0, 'Area in Sqft cannot be negative'],
      max: [1000000, 'Area in Sqft cannot exceed 1,000,000'],
    },

    mutationArea: {
      type: String,
      trim: true,
      maxlength: [100, 'Mutation area cannot exceed 100 characters'],
    },

    legalOfficeDetails: {
      type: String,
      trim: true,
      maxlength: [1000, 'Legal & office details cannot exceed 1000 characters'],
    },

    subRegistrarName: {
      type: String,
      trim: true,
      maxlength: [200, 'Sub-registrar name cannot exceed 200 characters'],
      index: true,
    },

    agreementDate: {
      type: Date,
      index: true,
    },

    stampPaperNo: {
      type: String,
      trim: true,
      maxlength: [100, 'Stamp paper number cannot exceed 100 characters'],
    },

    tabadlaNama: {
      type: String,
      trim: true,
      maxlength: [500, 'Tabadla Nama details cannot exceed 500 characters'],
    },

    bookNo: {
      type: String,
      trim: true,
      maxlength: [50, 'Book number cannot exceed 50 characters'],
    },

    volumeNo: {
      type: String,
      trim: true,
      maxlength: [50, 'Volume number cannot exceed 50 characters'],
    },

    documentNo: {
      type: String,
      trim: true,
      maxlength: [50, 'Document number cannot exceed 50 characters'],
    },

    reportNo: {
      type: String,
      trim: true,
      maxlength: [100, 'Report number cannot exceed 100 characters'],
    },

    scanCopyPath: {
      type: String,
      trim: true,
      maxlength: [500, 'Scan copy path cannot exceed 500 characters'],
    },

    landOwnerPhoto: {
      type: String,
      trim: true,
      maxlength: [500, 'Land owner photo path cannot exceed 500 characters'],
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },

    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
      index: true,
    },

    verificationRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Verification remarks cannot exceed 500 characters'],
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      index: true,
    },

    verifiedAt: {
      type: Date,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      required: true,
      index: true,
    },

    updatedBy: {
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

// Compound indexes for efficient querying
registrySchema.index({ registryNo: 1, isDeleted: 1 }, { unique: true });
registrySchema.index({ mutationNo: 1, isDeleted: 1 }, { unique: true });
registrySchema.index({ plotId: 1, memId: 1 });
registrySchema.index({ verificationStatus: 1, isActive: 1 });
registrySchema.index({ createdAt: -1, isDeleted: 1 });

// Text index for search
registrySchema.index(
  {
    registryNo: 'text',
    mutationNo: 'text',
    mozaVillage: 'text',
    khasraNo: 'text',
    khewatNo: 'text',
    khatoniNo: 'text',
    subRegistrarName: 'text',
    remarks: 'text',
  },
  {
    weights: {
      registryNo: 10,
      mutationNo: 10,
      mozaVillage: 5,
      khasraNo: 5,
      khewatNo: 5,
      khatoniNo: 5,
      subRegistrarName: 3,
      remarks: 2,
    },
    name: 'registry_text_search',
  }
);

// Virtual for plot
registrySchema.virtual('plot', {
  ref: 'Plot',
  localField: 'plotId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for member
registrySchema.virtual('member', {
  ref: 'Member',
  localField: 'memId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for registered by user
registrySchema.virtual('registeredByUser', {
  ref: 'UserStaff',
  localField: 'registeredBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for updated by user
registrySchema.virtual('updatedByUser', {
  ref: 'UserStaff',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for verified by user
registrySchema.virtual('verifiedByUser', {
  ref: 'UserStaff',
  localField: 'verifiedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for total area (formatted)
registrySchema.virtual('totalArea').get(function () {
  if (this.areaKanal || this.areaMarla) {
    return `${this.areaKanal || 0}-${this.areaMarla || 0}`;
  } else if (this.areaSqft) {
    return `${this.areaSqft} sq.ft`;
  }
  return 'Not specified';
});

// Virtual for verification badge color
registrySchema.virtual('verificationBadgeColor').get(function () {
  const colors: Record<string, string> = {
    Pending: 'warning',
    Verified: 'success',
    Rejected: 'danger',
  };
  return colors[this.verificationStatus] || 'secondary';
});

// Virtual for mutation age in years
registrySchema.virtual('mutationAge').get(function () {
  if (!this.mutationDate) return null;

  const now = new Date();
  const mutationDate = new Date(this.mutationDate);
  const diffTime = Math.abs(now.getTime() - mutationDate.getTime());
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));

  return diffYears;
});

// Pre-save middleware to validate area
registrySchema.pre('save', function (next) {
  // Convert to uppercase
  if (this.isModified('registryNo')) {
    this.registryNo = this.registryNo.toUpperCase();
  }

  if (this.isModified('mutationNo')) {
    this.mutationNo = this.mutationNo.toUpperCase();
  }

  // Validate that at least one area field is filled
  if (!this.areaKanal && !this.areaMarla && !this.areaSqft) {
    return next(new Error('At least one area measurement is required'));
  }

  // Calculate total area in sqft if not provided
  if (!this.areaSqft && (this.areaKanal || this.areaMarla)) {
    const kanalToSqft = (this.areaKanal || 0) * 5445; // 1 Kanal = 5445 sq.ft
    const marlaToSqft = (this.areaMarla || 0) * 272.25; // 1 Marla = 272.25 sq.ft
    this.areaSqft = kanalToSqft + marlaToSqft;
  }

  next();
});

// Pre-update middleware
registrySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update) {
    // Convert to uppercase
    if (update.registryNo) {
      update.registryNo = update.registryNo.toUpperCase();
    }

    if (update.mutationNo) {
      update.mutationNo = update.mutationNo.toUpperCase();
    }

    // Update verification timestamp if status changes
    if (update.verificationStatus && update.verificationStatus !== 'Pending') {
      update.verifiedAt = new Date();
    }

    // Calculate total area in sqft if area fields are updated
    if (
      (update.areaKanal !== undefined || update.areaMarla !== undefined) &&
      update.areaSqft === undefined
    ) {
      const kanal = update.areaKanal || this.get('areaKanal') || 0;
      const marla = update.areaMarla || this.get('areaMarla') || 0;
      const kanalToSqft = kanal * 5445;
      const marlaToSqft = marla * 272.25;
      update.areaSqft = kanalToSqft + marlaToSqft;
    }
  }

  next();
});

// Method to calculate total area in square feet
registrySchema.methods.calculateTotalAreaSqft = function (): number {
  const kanalToSqft = (this.areaKanal || 0) * 5445;
  const marlaToSqft = (this.areaMarla || 0) * 272.25;
  return kanalToSqft + marlaToSqft;
};

// Static method to find by registry number
registrySchema.statics.findByRegistryNo = function (registryNo: string) {
  return this.findOne({
    registryNo: registryNo.toUpperCase(),
    isDeleted: false,
  });
};

// Static method to find by mutation number
registrySchema.statics.findByMutationNo = function (mutationNo: string) {
  return this.findOne({
    mutationNo: mutationNo.toUpperCase(),
    isDeleted: false,
  });
};

// Static method to get pending verifications
registrySchema.statics.getPendingVerifications = function (page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const query = {
    verificationStatus: 'Pending',
    isDeleted: false,
    isActive: true,
  };

  return Promise.all([
    this.find(query)
      .populate('plot', 'plotNo sector block')
      .populate('member', 'fullName cnic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query),
  ]);
};

// Define interface for static methods
interface IRegistryModel extends Model<IRegistry> {
  findByRegistryNo(registryNo: string): Promise<IRegistry | null>;
  findByMutationNo(mutationNo: string): Promise<IRegistry | null>;
  getPendingVerifications(page: number, limit: number): Promise<[IRegistry[], number]>;
}

// Create and export model
const Registry = model<IRegistry, IRegistryModel>('Registry', registrySchema);

export default Registry;
