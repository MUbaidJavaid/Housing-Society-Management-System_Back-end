// src/types/supporting.types.ts
import { Document, ObjectId } from 'mongoose';

export interface IBookOffice extends Document {
  BookOffID: number;
  BookOffName?: string;
  BookOffPerson?: string;
  BookOffRemarks?: string;
}

export interface ICategory extends Document {
  ID: number;
  Name: string;
}

export interface IDevelopmentCharge extends Document {
  developmentCharges?: number;
}

export interface IEventSmsEmail extends Document {
  MemID?: string;
  MemMobile?: string;
  MemEmail?: string;
  EventType?: string;
  Message?: string;
  Email?: string;
  EmailProcessed?: boolean;
  SmsProcessed?: boolean;
  ProcessedTime?: Date;
}

export interface IFileBatchHead extends Document {
  FileBatchHdID: number;
  FileID?: ObjectId;
  BatchID?: number;
  AcHdID?: ObjectId;
  BatchHdDueDate?: Date;
  BatchHdAmnt?: number;
  BatchHdFineActive?: boolean;
  BatchHdIsPrcnt?: boolean;
  BatchHdFineAmnt?: number;
  BatchHdRemarks?: string;
}
