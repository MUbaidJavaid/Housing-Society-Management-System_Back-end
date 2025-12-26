import { IAccount } from '@/account/types/account.types';
import { BaseDocument } from '@/users/types/user.types';
import { Document, ObjectId, Types } from 'mongoose';

// src/types/banking.types.ts
export interface IBankReceipt {
  bReceiptId: number;
  bReceiptNo: string;
  bReceiptDate: Date;
  cAccountId: number | IAccount; // Credit Account
  dAccountId: number | IAccount; // Debit Account
  amount: number;
  narration?: string;
  createdBy?: string; // User ObjectId
  createdOn?: Date;
  modifiedBy?: string;
  modifiedOn?: Date;
  status: 'ACTIVE' | 'CANCELLED' | 'REVERSED';
  voucherType: 'BANK_RECEIPT' | 'BANK_PAYMENT' | 'CASH_RECEIPT' | 'CASH_PAYMENT';
  referenceNo?: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: Date;
  isReconciled: boolean;
  reconciledOn?: Date;
  reconciledBy?: string;
}

export interface IBankPayment {
  bPaymentId: number;
  voucherNo: string;
  voucherDate: Date;
  cAccountId: number | IAccount;
  dAccountId: number | IAccount;
  amount: number;
  narration?: string;
  createdBy?: string;
  createdOn?: Date;
  modifiedBy?: string;
  modifiedOn?: Date;
  status: 'ACTIVE' | 'CANCELLED' | 'REVERSED';
  paymentMode: 'CHEQUE' | 'RTGS' | 'NEFT' | 'IMPS';
  bankName?: string;
  chequeNo?: string;
  chequeDate?: Date;
  isReconciled: boolean;
}

export interface ICashPayment {
  cPaymentId: number;
  voucherNo: string;
  voucherDate: Date;
  cAccountId: number | IAccount;
  dAccountId: number | IAccount;
  amount: number;
  narration?: string;
  createdBy?: string;
  createdOn?: Date;
  modifiedBy?: string;
  modifiedOn?: Date;
  status: 'ACTIVE' | 'CANCELLED' | 'REVERSED';
  paymentMode: 'CASH' | 'DD' | 'ONLINE';
  receivedBy?: string;
  receivedById?: string; // Employee ID
  isAuthorized: boolean;
  authorizedBy?: string;
  authorizedOn?: Date;
}

export interface ICashReceipt {
  cReceiptId: number;
  voucherNo: string;
  voucherDate: Date;
  cAccountId: number | IAccount;
  dAccountId: number | IAccount;
  amount: number;
  narration?: string;
  createdBy?: string;
  createdOn?: Date;
  modifiedBy?: string;
  modifiedOn?: Date;
  status: 'ACTIVE' | 'CANCELLED' | 'REVERSED';
  receiptMode: 'CASH' | 'CHEQUE' | 'DD';
  receivedFrom?: string;
  receivedFromId?: number; // Account ID
  isAuthorized: boolean;
  authorizedBy?: string;
  authorizedOn?: Date;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: Date;
}
// Billing System
export interface IBillMainInfo extends BaseDocument {
  billInfoId: number;
  billInfoType: number;
  billInfoHeader?: string;
  billInfoDescription?: string;
  billInfoBankName?: string;
  billInfoBankAddress?: string;
  billInfoBankAccount?: string;
}

export interface IBillChargeType extends BaseDocument {
  billChargeTypeId: number;
  billChargeName?: string;
}

export interface IBillChargeRelation extends BaseDocument {
  relationId: number;
  plotSizeId: number | Types.ObjectId;
  billChargeTypeId: number | Types.ObjectId;
  value?: number;
}

export interface IBillConsumerMonth extends BaseDocument {
  billConsumerMonthId: number;
  billTemplateMonthId?: number;
  fileId?: number | Types.ObjectId;
  arrears?: number;
  status?: boolean;
  surchargeApplied?: number;

  totalBill?: number;
  amountPaid?: number;
  billPayedDate?: Date;
  billIssueDate?: Date;
  billDueDate?: Date;
  billMonth?: string;
  billChargesValues?: string;
  billRecievedBy?: string;
  billEmailSent?: boolean;
  installment?: string;
}

// Batch Management
export interface IBatch extends BaseDocument {
  batchId: number;
  projId?: number | Types.ObjectId;
  plotSizeId?: number | Types.ObjectId;
  srBookTypeId?: number | Types.ObjectId;
  batchName?: string;
  batchRemarks?: string;
  batchHeads?: Types.ObjectId[] | IBatchHead[];
}

export interface IBatchHead extends BaseDocument {
  batchHdId: number;
  batchId?: number | Types.ObjectId;
  acHdId?: number | Types.ObjectId;
  batchHdDueDate?: Date;
  batchHdAmnt?: number;
  batchHdFineActive?: boolean;
  batchHdIsPrcnt?: boolean;
  batchHdFineAmnt?: number;
  batchHdRemarks?: string;
}
export interface IBillMainInfoRelationToCharges extends Document {
  bill_charge_type_id?: ObjectId;
  bill_info_type?: number;
  bill_info_charge_relation_id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBillTemplateMonth extends Document {
  bill_template_month_id: number;
  bill_info_id?: ObjectId;
  bill_template_month_charges_list?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBillChargesType extends Document {
  bill_charge_type_id: number;
  charge_type_name: string;
  createdAt?: Date;
  updatedAt?: Date;
}
// Enum Types
export enum BillStatus {
  PENDING = 0,
  PAID = 1,
}

export enum FineType {
  FIXED = 0,
  PERCENTAGE = 1,
}
