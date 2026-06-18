import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPaymentTransaction extends Document {
  transactionId: string;
  societyId: Types.ObjectId;
  memberId: Types.ObjectId;
  billId?: Types.ObjectId;
  installmentId?: Types.ObjectId;
  amount: number;
  currency: string;
  gateway: 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'stripe' | 'manual';
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payerName?: string;
  payerPhone?: string;
  payerEmail?: string;
  paymentMethod?: string;
  description?: string;
  callbackUrl?: string;
  returnUrl?: string;
  failureReason?: string;
  refundAmount?: number;
  refundDate?: Date;
  metadata?: any;
  createdBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentTransactionModel extends Model<IPaymentTransaction> {}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
      index: true,
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
      index: true,
    },

    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member ID is required'],
      index: true,
    },

    billId: {
      type: Schema.Types.ObjectId,
      ref: 'BillInfo',
    },

    installmentId: {
      type: Schema.Types.ObjectId,
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be a positive number'],
    },

    currency: {
      type: String,
      default: 'PKR',
      trim: true,
    },

    gateway: {
      type: String,
      required: [true, 'Gateway is required'],
      enum: {
        values: ['jazzcash', 'easypaisa', 'bank_transfer', 'stripe', 'manual'],
        message: '{VALUE} is not a valid payment gateway',
      },
    },

    gatewayTransactionId: {
      type: String,
      trim: true,
    },

    gatewayResponse: {
      type: Schema.Types.Mixed,
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
        message: '{VALUE} is not a valid transaction status',
      },
      default: 'pending',
      index: true,
    },

    payerName: {
      type: String,
      trim: true,
    },

    payerPhone: {
      type: String,
      trim: true,
    },

    payerEmail: {
      type: String,
      trim: true,
    },

    paymentMethod: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    callbackUrl: {
      type: String,
      trim: true,
    },

    returnUrl: {
      type: String,
      trim: true,
    },

    failureReason: {
      type: String,
      trim: true,
    },

    refundAmount: {
      type: Number,
      min: [0, 'Refund amount must be a positive number'],
    },

    refundDate: {
      type: Date,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Compound indexes
paymentTransactionSchema.index(
  { transactionId: 1 },
  { unique: true, name: 'transaction_id_unique' }
);

paymentTransactionSchema.index(
  { societyId: 1, status: 1 },
  { name: 'society_status' }
);

paymentTransactionSchema.index(
  { memberId: 1, status: 1 },
  { name: 'member_status' }
);

paymentTransactionSchema.index(
  { gatewayTransactionId: 1 },
  { name: 'gateway_transaction_id' }
);

paymentTransactionSchema.index(
  { createdAt: -1 },
  { name: 'created_at_desc' }
);

// Ensure virtuals are included in toJSON/toObject output
paymentTransactionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

paymentTransactionSchema.set('toObject', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const PaymentTransaction: IPaymentTransactionModel = model<IPaymentTransaction, IPaymentTransactionModel>(
  'PaymentTransaction',
  paymentTransactionSchema
);

export default PaymentTransaction;
