// src/models/Billing.model.ts
import mongoose, { Schema } from 'mongoose';
import {
  IBillChargesType,
  IBillMainInfoRelationToCharges,
  IBillTemplateMonth,
} from '../types/transaction.types';

// Bill Charges Types Schema
const BillChargesTypeSchema: Schema = new Schema(
  {
    bill_charge_type_id: {
      type: Number,
      required: true,
      unique: true,
    },
    charge_type_name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Bill Main Info Relation to Charges Schema
const BillMainInfoRelationToChargesSchema: Schema = new Schema(
  {
    bill_charge_type_id: {
      type: Schema.Types.ObjectId,
      ref: 'BillChargesType',
    },
    bill_info_type: Number,
    bill_info_charge_relation_id: {
      type: Number,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Bill Template Month Schema
const BillTemplateMonthSchema: Schema = new Schema(
  {
    bill_info_id: {
      type: Schema.Types.ObjectId,
      ref: 'BillMainInfo',
    },
    bill_template_month_charges_list: String,
    bill_template_month_id: {
      type: Number,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Note: Need to create BillMainInfo model separately based on additional SQL

export const BillChargesType = mongoose.model<IBillChargesType>(
  'BillChargesType',
  BillChargesTypeSchema
);

export const BillMainInfoRelationToCharges = mongoose.model<IBillMainInfoRelationToCharges>(
  'BillMainInfoRelationToCharges',
  BillMainInfoRelationToChargesSchema
);

export const BillTemplateMonth = mongoose.model<IBillTemplateMonth>(
  'BillTemplateMonth',
  BillTemplateMonthSchema
);
