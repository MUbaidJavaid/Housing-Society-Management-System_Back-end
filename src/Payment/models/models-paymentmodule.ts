import { Document, Model, Schema, Types, model } from 'mongoose';

export enum PaymentModeName {
  CASH = 'cash',
  BANK_TRANSFER = 'Bank transfer',
  CHEQUE = 'check',
  PAY_ORDER = 'p/0',
}

export interface IPaymentMode extends Document {
  paymentModeName: PaymentModeName;
  description?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  modifiedOn?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const paymentModeSchema = new Schema<IPaymentMode>(
  {
    paymentModeName: {
      type: String,
      enum: Object.values(PaymentModeName),
      required: [true, 'Payment Mode Name is required'],
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
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

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    modifiedOn: {
      type: Date,
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

// Compound index for unique payment mode name (case-insensitive)
paymentModeSchema.index(
  {
    paymentModeName: 1,
    isDeleted: 1,
  },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 },
    partialFilterExpression: { isDeleted: false },
  }
);

// Index for active payment modes
paymentModeSchema.index({ isActive: 1, isDeleted: 1 });

// Index for search
paymentModeSchema.index(
  { paymentModeName: 'text', description: 'text' },
  {
    weights: {
      paymentModeName: 10,
      description: 5,
    },
    name: 'payment_mode_text_search',
  }
);

// Pre-save middleware to update modifiedOn
paymentModeSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.modifiedOn = new Date();
  }
  next();
});

// Pre-update middleware to update modifiedOn
paymentModeSchema.pre('findOneAndUpdate', function (next) {
  this.set({ modifiedOn: new Date() });
  next();
});

const PaymentMode: Model<IPaymentMode> = model<IPaymentMode>('PaymentMode', paymentModeSchema);

export default PaymentMode;
