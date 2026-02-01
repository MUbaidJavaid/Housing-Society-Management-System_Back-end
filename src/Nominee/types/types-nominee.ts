import { Types } from 'mongoose';
import { RelationType } from '../models/models-nominee';

export interface NomineeType {
  _id: Types.ObjectId;
  memId: Types.ObjectId;
  nomineeName: string;
  nomineeCNIC: string;
  relationWithMember: RelationType;
  nomineeContact: string;
  nomineeEmail?: string;
  nomineeAddress?: string;
  nomineeSharePercentage: number;
  nomineePhoto?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  member?: any;
  createdByUser?: any;
  modifiedByUser?: any;
  relationBadgeColor?: string;
}

export interface CreateNomineeDto {
  memId: string;
  nomineeName: string;
  nomineeCNIC: string;
  relationWithMember: RelationType;
  nomineeContact: string;
  nomineeEmail?: string;
  nomineeAddress?: string;
  nomineeSharePercentage?: number;
  nomineePhoto?: string;
}

export interface UpdateNomineeDto {
  nomineeName?: string;
  nomineeCNIC?: string;
  relationWithMember?: RelationType;
  nomineeContact?: string;
  nomineeEmail?: string;
  nomineeAddress?: string;
  nomineeSharePercentage?: number;
  nomineePhoto?: string;
  isActive?: boolean;
}

export interface NomineeQueryParams {
  page?: number;
  limit?: number;
  memId?: string;
  search?: string;
  relationWithMember?: RelationType;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NomineeStatistics {
  totalNominees: number;
  activeNominees: number;
  inactiveNominees: number;
  byRelation: Record<string, number>;
  averageSharePercentage: number;
  membersWithMultipleNominees: number;
  topRelations: Array<{
    relation: string;
    count: number;
    averageShare: number;
  }>;
}

export interface NomineeSummary {
  totalNominees: number;
  primaryNominees: number;
  totalShareCoverage: number;
  recentlyAdded: NomineeType[];
}

export interface ShareDistribution {
  memberId: Types.ObjectId;
  memberName: string;
  totalNominees: number;
  totalSharePercentage: number;
  nominees: Array<{
    name: string;
    relation: string;
    share: number;
  }>;
}
