import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ISocietySettings {
  currency: string;
  dateFormat: string;
  timezone: string;
  lateFeeEnabled: boolean;
  lateFeeRate: number;
}

export interface ISociety extends Document {
  societyName: string;
  societyCode: string;
  address: string;
  cityId?: Types.ObjectId;
  stateId?: Types.ObjectId;
  country: string;
  zipCode?: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  logo?: string;
  subscriptionPlanId?: Types.ObjectId;
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'suspended';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  trialEndsAt: Date;
  maxMembers: number;
  maxProjects: number;
  maxStaff: number;
  enabledModules: string[];
  settings: ISocietySettings;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const societySchema = new Schema<ISociety>(
  {
    societyName: {
      type: String,
      required: [true, 'Society name is required'],
      trim: true,
      minlength: [3, 'Society name must be at least 3 characters'],
      maxlength: [200, 'Society name cannot exceed 200 characters'],
      index: true,
    },

    societyCode: {
      type: String,
      required: [true, 'Society code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Society code must be at least 3 characters'],
      maxlength: [20, 'Society code cannot exceed 20 characters'],
    },

    address: {
      type: String,
      trim: true,
      default: '',
    },

    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      index: true,
    },

    stateId: {
      type: Schema.Types.ObjectId,
      ref: 'State',
      index: true,
    },

    country: {
      type: String,
      trim: true,
      default: 'Pakistan',
    },

    zipCode: {
      type: String,
      trim: true,
    },

    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },

    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    logo: {
      type: String,
      trim: true,
    },

    subscriptionPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPackage',
      index: true,
    },

    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'expired', 'suspended'],
      default: 'trial',
      index: true,
    },

    subscriptionStartDate: {
      type: Date,
    },

    subscriptionEndDate: {
      type: Date,
    },

    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
    },

    maxMembers: {
      type: Number,
      default: 50,
      min: [1, 'Max members must be at least 1'],
    },

    maxProjects: {
      type: Number,
      default: 1,
      min: [1, 'Max projects must be at least 1'],
    },

    maxStaff: {
      type: Number,
      default: 5,
      min: [1, 'Max staff must be at least 1'],
    },

    enabledModules: {
      type: [String],
      default: ['members', 'plots', 'projects', 'installments', 'complaints', 'announcements'],
    },

    settings: {
      type: {
        currency: { type: String, default: 'PKR' },
        dateFormat: { type: String, default: 'DD/MM/YYYY' },
        timezone: { type: String, default: 'Asia/Karachi' },
        lateFeeEnabled: { type: Boolean, default: false },
        lateFeeRate: { type: Number, default: 0, min: 0 },
      },
      default: {
        currency: 'PKR',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Asia/Karachi',
        lateFeeEnabled: false,
        lateFeeRate: 0,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    modifiedBy: {
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
societySchema.index({ societyCode: 1 }, { unique: true });
societySchema.index({ isActive: 1, isDeleted: 1 });
societySchema.index({ subscriptionStatus: 1 });
societySchema.index({ societyName: 'text' }, { name: 'society_text_search' });

// Static method to generate society code from name
societySchema.statics.generateSocietyCode = async function (name: string): Promise<string> {
  // Take first letters of each word (up to 3), uppercase
  const words = name.trim().split(/\s+/);
  let prefix = '';
  if (words.length >= 3) {
    prefix = words
      .slice(0, 3)
      .map(w => w.charAt(0).toUpperCase())
      .join('');
  } else if (words.length === 2) {
    prefix = (words[0].charAt(0) + words[1].substring(0, 2)).toUpperCase();
  } else {
    prefix = words[0].substring(0, 3).toUpperCase();
  }

  // Find the highest existing code with this prefix
  const lastSociety = await this.findOne({
    societyCode: new RegExp(`^${prefix}-\\d+$`),
  })
    .sort({ societyCode: -1 })
    .lean();

  let nextNumber = 1;
  if (lastSociety) {
    const match = (lastSociety as any).societyCode.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
};

// Define interface for static methods
interface ISocietyModel extends Model<ISociety> {
  generateSocietyCode(name: string): Promise<string>;
}

// Create and export model
const Society = model<ISociety, ISocietyModel>('Society', societySchema);

export default Society;
