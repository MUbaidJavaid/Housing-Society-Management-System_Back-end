import { Document, Schema, Types, model } from 'mongoose';

export interface IEmploymentHistory {
  societyId: Types.ObjectId;
  memberId: Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  role: string;
  rating?: number;
  review?: string;
  isCurrentlyEmployed: boolean;
}

export interface IStaffDocument {
  type: string;
  fileUrl: string;
  verifiedAt?: Date;
}

export interface IDomesticStaff extends Document {
  fullName: string;
  cnic: string;
  phone?: string;
  photo?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  address?: string;
  staffType: 'maid' | 'driver' | 'cook' | 'gardener' | 'guard' | 'sweeper' | 'nanny' | 'tutor' | 'other';
  isVerified: boolean;
  verificationDate?: Date;
  verifiedBy?: Types.ObjectId;
  verificationMethod?: 'cnic_check' | 'reference' | 'police_clearance' | 'self_declared';
  employmentHistory: IEmploymentHistory[];
  averageRating: number;
  totalRatings: number;
  blacklisted: boolean;
  blacklistReason?: string;
  blacklistedBy?: Types.ObjectId;
  blacklistedAt?: Date;
  skills: string[];
  languages: string[];
  documents: IStaffDocument[];
  metadata: any;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const employmentHistorySchema = new Schema<IEmploymentHistory>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    role: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
    },
    isCurrentlyEmployed: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const staffDocumentSchema = new Schema<IStaffDocument>(
  {
    type: {
      type: String,
    },
    fileUrl: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
  },
  { _id: true }
);

const domesticStaffSchema = new Schema<IDomesticStaff>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },

    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    photo: {
      type: String,
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },

    dateOfBirth: {
      type: Date,
    },

    address: {
      type: String,
    },

    staffType: {
      type: String,
      enum: ['maid', 'driver', 'cook', 'gardener', 'guard', 'sweeper', 'nanny', 'tutor', 'other'],
      required: [true, 'Staff type is required'],
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationDate: {
      type: Date,
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    verificationMethod: {
      type: String,
      enum: ['cnic_check', 'reference', 'police_clearance', 'self_declared'],
    },

    employmentHistory: [employmentHistorySchema],

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },

    blacklisted: {
      type: Boolean,
      default: false,
    },

    blacklistReason: {
      type: String,
    },

    blacklistedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    blacklistedAt: {
      type: Date,
    },

    skills: [{ type: String }],

    languages: [{ type: String }],

    documents: [staffDocumentSchema],

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
domesticStaffSchema.index(
  { cnic: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
domesticStaffSchema.index({ fullName: 'text' });
domesticStaffSchema.index({ staffType: 1, isVerified: 1 });
domesticStaffSchema.index({ averageRating: -1 });
domesticStaffSchema.index({ blacklisted: 1 });

const DomesticStaff = model<IDomesticStaff>('DomesticStaff', domesticStaffSchema);

export default DomesticStaff;
