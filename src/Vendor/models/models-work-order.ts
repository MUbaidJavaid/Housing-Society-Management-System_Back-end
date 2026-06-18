import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IWorkOrderBid {
  vendorId: Types.ObjectId;
  amount: number;
  proposal: string;
  submittedAt: Date;
  status: 'submitted' | 'under-review' | 'accepted' | 'rejected';
}

export interface IWorkOrder extends Document {
  title: string;
  description: string;
  societyId: Types.ObjectId;
  category: string;
  estimatedBudget?: number;
  deadline?: Date;
  scope?: string;
  documents: Array<{ name: string; fileUrl: string }>;
  status: 'draft' | 'open' | 'bidding' | 'awarded' | 'in-progress' | 'completed' | 'cancelled';
  awardedVendorId?: Types.ObjectId;
  awardedAmount?: number;
  awardedDate?: Date;
  completionDate?: Date;
  completionNotes?: string;
  bids: IWorkOrderBid[];
  metadata: any;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const workOrderSchema = new Schema<IWorkOrder>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society is required'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
    },

    estimatedBudget: {
      type: Number,
    },

    deadline: {
      type: Date,
    },

    scope: {
      type: String,
    },

    documents: [
      {
        name: { type: String },
        fileUrl: { type: String },
      },
    ],

    status: {
      type: String,
      enum: ['draft', 'open', 'bidding', 'awarded', 'in-progress', 'completed', 'cancelled'],
      default: 'draft',
    },

    awardedVendorId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
    },

    awardedAmount: {
      type: Number,
    },

    awardedDate: {
      type: Date,
    },

    completionDate: {
      type: Date,
    },

    completionNotes: {
      type: String,
    },

    bids: [
      {
        vendorId: {
          type: Schema.Types.ObjectId,
          ref: 'VendorProfile',
        },
        amount: {
          type: Number,
        },
        proposal: {
          type: String,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['submitted', 'under-review', 'accepted', 'rejected'],
          default: 'submitted',
        },
      },
    ],

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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

// Indexes
workOrderSchema.index({ societyId: 1, status: 1, isDeleted: 1 });
workOrderSchema.index({ deadline: 1 });
workOrderSchema.index({ awardedVendorId: 1 });

// Static methods
workOrderSchema.statics.findBySociety = function (societyId: string) {
  return this.find({ societyId, isDeleted: false }).sort({ createdAt: -1 });
};

workOrderSchema.statics.findOpenOrders = function () {
  return this.find({ status: { $in: ['open', 'bidding'] }, isDeleted: false }).sort({
    deadline: 1,
  });
};

interface IWorkOrderModel extends Model<IWorkOrder> {
  findBySociety(societyId: string): Promise<IWorkOrder[]>;
  findOpenOrders(): Promise<IWorkOrder[]>;
}

const WorkOrder = model<IWorkOrder, IWorkOrderModel>('WorkOrder', workOrderSchema);

export default WorkOrder;
