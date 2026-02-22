import { Document, Model, Schema, Types, model } from 'mongoose';

export enum RelationType {
  SON = 'Son',
  DAUGHTER = 'Daughter',
  WIFE = 'Wife',
  HUSBAND = 'Husband',
  FATHER = 'Father',
  MOTHER = 'Mother',
  BROTHER = 'Brother',
  SISTER = 'Sister',
  UNCLE = 'Uncle',
  AUNT = 'Aunt',
  GRANDFATHER = 'Grandfather',
  GRANDMOTHER = 'Grandmother',
  OTHER = 'Other',
}
export interface INomineeMethods {
  validateTotalSharePercentage(next: Function): Promise<void>;
}

export interface INominee extends Document {
  memId: Types.ObjectId;
  nomineeName: string;
  nomineeCNIC: string;
  relationWithMember: RelationType;
  nomineeContact: string;
  nomineeEmail?: string;
  nomineeAddress?: string;
  nomineeSharePercentage: number;
  nomineePhoto?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  member?: any;
  createdByUser?: any;
  modifiedByUser?: any;
}

const nomineeSchema = new Schema<INominee, INomineeModel, INomineeMethods>(
  {
    memId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    nomineeName: {
      type: String,
      required: [true, 'Nominee name is required'],
      trim: true,
      maxlength: [100, 'Nominee name cannot exceed 100 characters'],
      index: true,
    },
    nomineeCNIC: {
      type: String,
      required: [true, 'Nominee CNIC is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/, 'Please provide a valid CNIC (XXXXX-XXXXXXX-X)'],
      index: true,
    },
    relationWithMember: {
      type: String,
      enum: Object.values(RelationType),
      required: [true, 'Relation with member is required'],
      index: true,
    },
    nomineeContact: {
      type: String,
      required: [true, 'Nominee contact is required'],
      trim: true,
      match: [/^[0-9]{11,15}$/, 'Please provide a valid contact number'],
      index: true,
    },
    nomineeEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    nomineeAddress: {
      type: String,
      trim: true,
      maxlength: [500, 'Nominee address cannot exceed 500 characters'],
    },
    nomineeSharePercentage: {
      type: Number,
      required: [true, 'Nominee share percentage is required'],
      min: [0, 'Share percentage cannot be negative'],
      max: [100, 'Share percentage cannot exceed 100%'],
      default: 100,
    },
    nomineePhoto: {
      type: String,
      trim: true,
      maxlength: [500, 'Nominee photo path cannot exceed 500 characters'],
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

// Compound indexes for efficient querying
nomineeSchema.index({ memId: 1, isDeleted: 1 });
nomineeSchema.index({ nomineeCNIC: 1, isDeleted: 1 }, { unique: true });
nomineeSchema.index({ isActive: 1, isDeleted: 1 });
nomineeSchema.index({ nomineeName: 'text', nomineeCNIC: 'text' });
nomineeSchema.index(
  { nomineeEmail: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      nomineeEmail: { $exists: true, $type: 'string', $ne: '' },
    },
    name: 'uniq_active_nominee_email',
  }
);

// Virtual for member
nomineeSchema.virtual('member', {
  ref: 'Member',
  localField: 'memId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for created by user
nomineeSchema.virtual('createdByUser', {
  ref: 'UserStaff',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for modified by user
nomineeSchema.virtual('modifiedByUser', {
  ref: 'UserStaff',
  localField: 'modifiedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for relation badge color
nomineeSchema.virtual('relationBadgeColor').get(function () {
  const colors: Record<string, string> = {
    [RelationType.SON]: 'primary',
    [RelationType.DAUGHTER]: 'pink',
    [RelationType.WIFE]: 'danger',
    [RelationType.HUSBAND]: 'info',
    [RelationType.FATHER]: 'warning',
    [RelationType.MOTHER]: 'success',
    [RelationType.BROTHER]: 'secondary',
    [RelationType.SISTER]: 'light',
    [RelationType.UNCLE]: 'dark',
    [RelationType.AUNT]: 'purple',
    [RelationType.GRANDFATHER]: 'orange',
    [RelationType.GRANDMOTHER]: 'teal',
    [RelationType.OTHER]: 'gray',
  };
  return colors[this.relationWithMember] || 'secondary';
});

// Pre-save middleware
nomineeSchema.pre('save', function (next) {
  // Format CNIC
  if (this.isModified('nomineeCNIC')) {
    // Remove any non-numeric characters except dashes
    let cnic = this.nomineeCNIC.replace(/[^\d-]/g, '');

    // Format to XXXXX-XXXXXXX-X pattern if not already formatted
    if (!cnic.includes('-')) {
      if (cnic.length === 13) {
        cnic = `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
      }
    }

    this.nomineeCNIC = cnic;
  }

  // Validate total share percentage for member
  if (this.isModified('nomineeSharePercentage') || this.isModified('memId')) {
    this.validateTotalSharePercentage(next);
  } else {
    next();
  }
});

// Pre-update middleware
nomineeSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;

  if (update) {
    // Format CNIC if being updated
    if (update.nomineeCNIC) {
      let cnic = update.nomineeCNIC.replace(/[^\d-]/g, '');
      if (!cnic.includes('-') && cnic.length === 13) {
        cnic = `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
      }
      update.nomineeCNIC = cnic;
    }
  }

  next();
});

// Method to validate total share percentage
nomineeSchema.methods.validateTotalSharePercentage = async function (next: Function) {
  try {
    const totalShare = await Nominee.aggregate([
      {
        $match: {
          memId: this.memId,
          isDeleted: false,
          isActive: true,
          _id: { $ne: this._id }, // Exclude current nominee if updating
        },
      },
      {
        $group: {
          _id: null,
          totalShare: { $sum: '$nomineeSharePercentage' },
        },
      },
    ]);

    const currentTotal = (totalShare[0]?.totalShare || 0) + this.nomineeSharePercentage;

    if (currentTotal > 100) {
      return next(
        new Error(`Total share percentage exceeds 100%. Current total: ${currentTotal}%`)
      );
    }

    next();
  } catch (error) {
    next(error as Error);
  }
};

// Static method to find by member
nomineeSchema.statics.findByMember = function (memId: string) {
  return this.find({
    memId: new Types.ObjectId(memId),
    isDeleted: false,
    isActive: true,
  })
    .populate('member', 'memName memNic')
    .sort({ nomineeSharePercentage: -1 });
};

// Static method to find by CNIC
nomineeSchema.statics.findByCNIC = function (cnic: string) {
  const formattedCNIC = cnic.replace(/[^\d-]/g, '');
  if (!formattedCNIC.includes('-') && formattedCNIC.length === 13) {
    const formatted = `${formattedCNIC.slice(0, 5)}-${formattedCNIC.slice(5, 12)}-${formattedCNIC.slice(12)}`;
    return this.findOne({ nomineeCNIC: formatted, isDeleted: false });
  }
  return this.findOne({ nomineeCNIC: cnic, isDeleted: false });
};

// Static method to get nominees statistics
nomineeSchema.statics.getStatistics = function () {
  return this.aggregate([
    {
      $match: { isDeleted: false },
    },
    {
      $group: {
        _id: null,
        totalNominees: { $sum: 1 },
        activeNominees: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        byRelation: {
          $push: {
            relation: '$relationWithMember',
            share: '$nomineeSharePercentage',
          },
        },
      },
    },
  ]);
};

// Define interface for static methods
interface INomineeModel extends Model<INominee> {
  findByMember(memId: string): Promise<INominee[]>;
  findByCNIC(cnic: string): Promise<INominee | null>;
  getStatistics(): Promise<any[]>;
}

// Create and export model
const Nominee = model<INominee, INomineeModel>('Nominee', nomineeSchema);

export default Nominee;
