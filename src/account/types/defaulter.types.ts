// src/types/defaulter.types.ts
import { Document, ObjectId } from 'mongoose';

export interface IDefaulter extends Document {
  DefaulterMemberID: ObjectId;
  PlotID: ObjectId;
  Charges?: number;
  InstallmentDueDate?: string;
  TotalPayble?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDefaulterReport extends Document {
  MemID: ObjectId;
  MembershipNo: string;
  Mobile?: string;
  Residential?: string;
  MemRegNo: string;
  MemName: string;
  MemFHName: string;
  MemFHRelation: string;
  MemImg?: Buffer;
  MemberFingerPrint?: Buffer;
  MemNic: string;
  MemAddr1?: string;
  MemAddr2?: string;
  MemAddr3?: string;
  PlotNo: string;
  TodaysDate: string;
  MemberName: string;
  MemberFHName: string;
  PlotSizeName?: string;
  BlockName?: string;
  plot_development_charge?: number;
  PlotTypeName?: string;
  InstallmentDueDate?: string;
  Charges?: number;
  TotalPayble?: number;
}
