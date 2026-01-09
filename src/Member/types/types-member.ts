import { Types } from 'mongoose';

export interface Member {
  _id: Types.ObjectId;
  memName: string;
  statusId?: Types.ObjectId;
  memNic: string;
  memImg?: string;
  memFHName?: string;
  memFHRelation?: string;
  memAddr1: string;
  memAddr2?: string;
  memAddr3?: string;
  cityId?: Types.ObjectId;
  memZipPost?: string;
  memContRes?: string;
  memContWork?: string;
  memContMob: string;
  memContEmail?: string;
  memIsOverseas: boolean;
  memPermAdd?: string;
  memRemarks?: string;
  memRegNo?: string;
  dateOfBirth?: Date;
  memOccupation?: string;
  memState?: string;
  memCountry?: string;
  memPermAddress1?: string;
  memPermCity?: string;
  memPermState?: string;
  memPermCountry?: string;
  memberFingerTemplate?: string;
  memberFingerPrint?: string;
  gender?: 'male' | 'female' | 'other';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface CreateMemberDto {
  memName: string;
  statusId?: string;
  memNic: string;
  memImg?: string;
  memFHName?: string;
  memFHRelation?: string;
  memAddr1: string;
  memAddr2?: string;
  memAddr3?: string;
  cityId?: string;
  memZipPost?: string;
  memContRes?: string;
  memContWork?: string;
  memContMob: string;
  memContEmail?: string;
  memIsOverseas?: boolean;
  memPermAdd?: string;
  memRemarks?: string;
  memRegNo?: string;
  dateOfBirth?: string;
  memOccupation?: string;
  memState?: string;
  memCountry?: string;
  memPermAddress1?: string;
  memPermCity?: string;
  memPermState?: string;
  memPermCountry?: string;
  memberFingerTemplate?: string;
  memberFingerPrint?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface UpdateMemberDto {
  memName?: string;
  statusId?: string;
  memNic?: string;
  memImg?: string;
  memFHName?: string;
  memFHRelation?: string;
  memAddr1?: string;
  memAddr2?: string;
  memAddr3?: string;
  cityId?: string;
  memZipPost?: string;
  memContRes?: string;
  memContWork?: string;
  memContMob?: string;
  memContEmail?: string;
  memIsOverseas?: boolean;
  memPermAdd?: string;
  memRemarks?: string;
  memRegNo?: string;
  dateOfBirth?: string;
  memOccupation?: string;
  memState?: string;
  memCountry?: string;
  memPermAddress1?: string;
  memPermCity?: string;
  memPermState?: string;
  memPermCountry?: string;
  memberFingerTemplate?: string;
  memberFingerPrint?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface MemberQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  statusId?: string;
  cityId?: string;
  memIsOverseas?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
