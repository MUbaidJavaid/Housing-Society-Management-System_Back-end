import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IMember extends Document {
  memName: string;
  statusId?: Types.ObjectId;
  memNic: string;
  memImg?: string;
  memFHName?: string;
  memFHRelation?: string;
  memAddr1: string;
  memAddr2?: string;
  memAddr3?: string;
  cityId?: Types.ObjectId;
  memZipPost?: string;
  memContRes?: string;
  memContWork?: string;
  memContMob: string;
  memContEmail?: string;
  memIsOverseas: boolean;
  memPermAdd?: string;
  memRemarks?: string;
  memRegNo?: string;
  dateOfBirth?: Date;
  memOccupation?: string;
  memState?: string;
  memCountry?: string;
  memPermAddress1?: string;
  memPermCity?: string;
  memPermState?: string;
  memPermCountry?: string;
  memberFingerTemplate?: string;
  memberFingerPrint?: string;
  gender?: 'male' | 'female' | 'other';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const memberSchema = new Schema<IMember>(
  {
    memName: {
      type: String,
      required: [true, 'Member Name is required'],
      trim: true,
      minlength: [2, 'Member Name must be at least 2 characters'],
      maxlength: [100, 'Member Name cannot exceed 100 characters'],
      index: true,
    },

    statusId: {
      type: Schema.Types.ObjectId,
      ref: 'Status', // You need to create this model
      index: true,
    },

    memNic: {
      type: String,
      required: [true, 'NIC is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },

    memImg: {
      type: String,
      trim: true,
    },

    memFHName: {
      type: String,
      trim: true,
      maxlength: [100, "Father/Husband's Name cannot exceed 100 characters"],
    },

    memFHRelation: {
      type: String,
      trim: true,
      enum: ['father', 'husband', 'guardian'],
    },

    memAddr1: {
      type: String,
      required: [true, 'Address Line 1 is required'],
      trim: true,
      maxlength: [200, 'Address Line 1 cannot exceed 200 characters'],
    },

    memAddr2: {
      type: String,
      trim: true,
      maxlength: [200, 'Address Line 2 cannot exceed 200 characters'],
    },

    memAddr3: {
      type: String,
      trim: true,
      maxlength: [200, 'Address Line 3 cannot exceed 200 characters'],
    },

    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City', // You need to create this model
      index: true,
    },

    memZipPost: {
      type: String,
      trim: true,
      maxlength: [20, 'ZIP/Postal Code cannot exceed 20 characters'],
    },

    memContRes: {
      type: String,
      trim: true,
      maxlength: [20, 'Residential Contact cannot exceed 20 characters'],
    },

    memContWork: {
      type: String,
      trim: true,
      maxlength: [20, 'Work Contact cannot exceed 20 characters'],
    },

    memContMob: {
      type: String,
      required: [true, 'Mobile Contact is required'],
      trim: true,
      maxlength: [20, 'Mobile Contact cannot exceed 20 characters'],
      index: true,
    },

    memContEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [100, 'Email cannot exceed 100 characters'],
      index: true,
    },

    memIsOverseas: {
      type: Boolean,
      default: false,
      index: true,
    },

    memPermAdd: {
      type: String,
      trim: true,
      maxlength: [500, 'Permanent Address cannot exceed 500 characters'],
    },

    memRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },

    memRegNo: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },

    dateOfBirth: {
      type: Date,
    },

    memOccupation: {
      type: String,
      trim: true,
      maxlength: [100, 'Occupation cannot exceed 100 characters'],
    },

    memState: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters'],
    },

    memCountry: {
      type: String,
      trim: true,
      maxlength: [50, 'Country cannot exceed 50 characters'],
      default: 'Pakistan',
    },

    memPermAddress1: {
      type: String,
      trim: true,
      maxlength: [200, 'Permanent Address Line 1 cannot exceed 200 characters'],
    },

    memPermCity: {
      type: String,
      trim: true,
      maxlength: [50, 'Permanent City cannot exceed 50 characters'],
    },

    memPermState: {
      type: String,
      trim: true,
      maxlength: [50, 'Permanent State cannot exceed 50 characters'],
    },

    memPermCountry: {
      type: String,
      trim: true,
      maxlength: [50, 'Permanent Country cannot exceed 50 characters'],
      default: 'Pakistan',
    },

    memberFingerTemplate: {
      type: String,
      select: false,
    },

    memberFingerPrint: {
      type: String,
      select: false,
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
  }
);

// Compound indexes for common queries
memberSchema.index({ memName: 'text', memNIC: 'text', memContMob: 'text' });
memberSchema.index({ statusId: 1, isDeleted: 1 });
memberSchema.index({ cityId: 1, isDeleted: 1 });
memberSchema.index({ memIsOverseas: 1, isDeleted: 1 });
memberSchema.index({ createdBy: 1, isDeleted: 1 });
memberSchema.index({ gender: 1, isDeleted: 1 });

const Member: Model<IMember> = model<IMember>('Member', memberSchema);

export default Member;
