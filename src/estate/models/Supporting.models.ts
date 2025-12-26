// src/models/Supporting.models.ts
import mongoose, { Schema } from 'mongoose';
import {
  IBookOffice,
  ICategory,
  IDevelopmentCharge,
  IEventSmsEmail,
  IFileBatchHead,
} from '../types/supporting.types';

// BookOffice Schema
const BookOfficeSchema: Schema = new Schema({
  BookOffID: {
    type: Number,
    required: true,
    unique: true,
  },
  BookOffName: String,
  BookOffPerson: String,
  BookOffRemarks: String,
});

// Category Schema
const CategorySchema: Schema = new Schema({
  ID: {
    type: Number,
    required: true,
    unique: true,
  },
  Name: {
    type: String,
    required: true,
    maxlength: 32,
  },
});

// Development Charge Schema
const DevelopmentChargeSchema: Schema = new Schema({
  developmentCharges: {
    type: Number,
    default: 0.0,
  },
});

// Event Sms Email Schema
const EventSmsEmailSchema: Schema = new Schema(
  {
    MemID: String,
    MemMobile: String,
    MemEmail: String,
    EventType: {
      type: String,
      maxlength: 30,
    },
    Message: String,
    Email: String,
    EmailProcessed: {
      type: Boolean,
      default: false,
    },
    SmsProcessed: {
      type: Boolean,
      default: false,
    },
    ProcessedTime: Date,
  },
  {
    timestamps: true,
  }
);

// File Batch Head Schema
const FileBatchHeadSchema: Schema = new Schema({
  FileBatchHdID: {
    type: Number,
    required: true,
    unique: true,
  },
  FileID: {
    type: Schema.Types.ObjectId,
    ref: 'File',
  },
  BatchID: Number,
  AcHdID: {
    type: Schema.Types.ObjectId,
    ref: 'AccountHead',
  },
  BatchHdDueDate: Date,
  BatchHdAmnt: {
    type: Number,
    min: 0,
  },
  BatchHdFineActive: Boolean,
  BatchHdIsPrcnt: Boolean,
  BatchHdFineAmnt: {
    type: Number,
    min: 0,
  },
  BatchHdRemarks: {
    type: String,
    maxlength: 500,
  },
});

export const BookOffice = mongoose.model<IBookOffice>('BookOffice', BookOfficeSchema);
export const Category = mongoose.model<ICategory>('Category', CategorySchema);
export const DevelopmentCharge = mongoose.model<IDevelopmentCharge>(
  'DevelopmentCharge',
  DevelopmentChargeSchema
);
export const EventSmsEmail = mongoose.model<IEventSmsEmail>('EventSmsEmail', EventSmsEmailSchema);
export const FileBatchHead = mongoose.model<IFileBatchHead>('FileBatchHead', FileBatchHeadSchema);
