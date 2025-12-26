// src/types/file.types.ts
import { Document, ObjectId } from 'mongoose';

export interface IFile extends Document {
  FileID: number;
  ProjID?: ObjectId;
  MemID?: ObjectId;
  PlotID?: ObjectId;
  FileRegNo?: string;
  FileAppNo?: string;
  StatusID?: number;
  BookOffID?: ObjectId;
  BookOffPerson?: string;
  BookDate?: Date;
  BatchID?: number;
  PlotTypeID?: ObjectId;
  PlotSizeID?: ObjectId;
  PlotBlockID?: ObjectId;
  FileNomName?: string;
  FileNomNic?: string;
  FileNomFHName?: string;
  FileNomRelation?: string;
  FileNomImg?: Buffer;
  FileRemarks?: string;
  PlotNo?: string;
  MemRegNo?: string;
  ApplicationDate?: Date;
  installment?: string;
  installmentAmount?: string;
  // Additional fields from SQL
  OID_scheme_type_code?: string;
  OID_phase_code?: string;
  OID_member_code?: string;
  FileBarCd?: string;
  FileIsAdj?: boolean;
  FileAdjRequest?: string;
  SrBookTypeID?: number;
  RRID?: ObjectId;
  Temp_DataImport?: boolean;
  Temp_PlotID?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
