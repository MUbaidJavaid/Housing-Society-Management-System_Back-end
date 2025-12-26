import { Buffer } from 'buffer';
import { Document, ObjectId } from 'mongoose';

// src/types/estate.types.ts
export interface IApplication {
  applicationId: number;
  projId?: number;
  memId?: number;
  oidSchemeTypeCode?: string;
  oidPhaseCode?: string;
  oidMemberCode?: string;
  applicationBarCd?: string;
  applicationRegNo?: string;
  applicationAppNo?: string;
  statusId?: number;
  tempPlotId?: number;
  oidPlotTypeCode?: string;
  applicationIsAdj?: boolean;
  applicationAdjRequest?: string;
  srBookTypeId?: number;
  bookOffId?: number;
  bookOffPerson?: string;
  bookDate?: Date;
  batchId?: number;
  plotTypeId?: number;
  plotSizeId?: number;
  plotBlockId?: number;
  applicationNomName?: string;
  applicationNomNic?: string;
  applicationNomFHName?: string;
  applicationNomRelation?: string;
  applicationNomImg?: Buffer;
  tempDataImport?: boolean;
  rrid?: number;
  applicationRemarks?: string;
  plotNo?: string;
  memRegNo?: string;
  plotId?: number;
}

export interface IAllotment {
  allotId: number;
  fileId?: number;
  plotId?: number;
  srRouteId?: number;
  allotDate?: Date;
  allotIsCollect?: boolean;
  allotCollectName?: string;
  allotCollectNic?: string;
  allotAttach1?: Buffer;
  allotAttach2?: Buffer;
  allotRemarks?: string;
  attach3?: Buffer;
  allotAttach3?: Buffer;
}

export interface IAccountHeadLegacy {
  acHdId: number;
  acHdName?: string;
  acHdIsBasic?: boolean;
  acHdIsNegative?: boolean;
  acHdIdDefAmnt?: number;
  acHdIdRemarks?: string;
}

export interface IAccountingYear {
  accYrId: number;
  accYr: string;
  databaseName: string;
  isActive: boolean;
}
export interface IMember extends Document {
  MemID: number;
  MemRegNo: string;
  MemName: string;
  MemFHName: string;
  MemFHRelation: string;
  MemNic: string;
  MemAddr1?: string;
  MemAddr2?: string;
  MemAddr3?: string;
  MemContMob?: string;
  MemContRes?: string;
  MemImg?: Buffer;
  MemberFingerPrint?: Buffer;
  CityID?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMemberInput {
  MemRegNo: string;
  MemName: string;
  MemFHName: string;
  MemFHRelation: string;
  MemNic: string;
  MemAddr1?: string;
  MemAddr2?: string;
  MemAddr3?: string;
  MemContMob?: string;
  MemContRes?: string;
  MemImg?: Buffer;
  MemberFingerPrint?: Buffer;
  CityID?: ObjectId;
}
