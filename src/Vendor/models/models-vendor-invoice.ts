import { Document, Model, Schema, Types, model } from 'mongoose';

export interface ILineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IVendorInvoice extends Document {
  vendorId: Types.ObjectId;
  societyId: Types.ObjectId;
  contractId?: Types.ObjectId;
  workOrderId?: Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  description?: string;
  lineItems: ILineItem[];
  documents: Array<{ name: string; fileUrl: string }>;
  status: 'submitted' | 'under-review' | 'approved' | 'paid' | 'rejected' | 'disputed';
  approvedBy?: Types.ObjectId;
  approvalDate?: Date;
  paymentDate?: Date;
  paymentReference?: string;
  rejectionReason?: string;
  metadata: any;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vendorInvoiceSchema = new Schema<IVendorInvoice>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: [true, 'Vendor is required'],
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society is required'],
    },

    contractId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorContract',
    },

    workOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkOrder',
    },

    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true,
    },

    invoiceDate: {
      type: Date,
      required: [true, 'Invoice date is required'],
    },

    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
    },

    description: {
      type: String,
    },

    lineItems: [
      {
        description: { type: String },
        quantity: { type: Number },
        unitPrice: { type: Number },
        total: { type: Number },
      },
    ],

    documents: [
      {
        name: { type: String },
        fileUrl: { type: String },
      },
    ],

    status: {
      type: String,
      enum: ['submitted', 'under-review', 'approved', 'paid', 'rejected', 'disputed'],
      default: 'submitted',
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    approvalDate: {
      type: Date,
    },

    paymentDate: {
      type: Date,
    },

    paymentReference: {
      type: String,
    },

    rejectionReason: {
      type: String,
    },

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
vendorInvoiceSchema.index({ vendorId: 1, status: 1, isDeleted: 1 });
vendorInvoiceSchema.index({ societyId: 1, status: 1 });
vendorInvoiceSchema.index({ invoiceNumber: 1 });

// Static methods
vendorInvoiceSchema.statics.findByVendor = function (vendorId: string) {
  return this.find({ vendorId, isDeleted: false }).sort({ invoiceDate: -1 });
};

vendorInvoiceSchema.statics.findPendingInvoices = function () {
  return this.find({
    status: { $in: ['submitted', 'under-review'] },
    isDeleted: false,
  }).sort({ dueDate: 1 });
};

interface IVendorInvoiceModel extends Model<IVendorInvoice> {
  findByVendor(vendorId: string): Promise<IVendorInvoice[]>;
  findPendingInvoices(): Promise<IVendorInvoice[]>;
}

const VendorInvoice = model<IVendorInvoice, IVendorInvoiceModel>(
  'VendorInvoice',
  vendorInvoiceSchema
);

export default VendorInvoice;
