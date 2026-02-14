import { Types } from 'mongoose';

export interface RegistryType {
  _id: Types.ObjectId;
  plotId: Types.ObjectId;
  memId: Types.ObjectId;
  registryNo: string;
  mozaVillage?: string;
  khasraNo?: string;
  khewatNo?: string;
  khatoniNo?: string;
  mutationNo: string;
  mutationDate?: Date;
  areaKanal?: number;
  areaMarla?: number;
  areaSqft?: number;
  mutationArea?: string;
  legalOfficeDetails?: string;
  subRegistrarName?: string;
  agreementDate?: Date;
  stampPaperNo?: string;
  tabadlaNama?: string;
  bookNo?: string;
  volumeNo?: string;
  documentNo?: string;
  reportNo?: string;
  scanCopyPath?: string;
  landOwnerPhoto?: string;
  remarks?: string;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  verificationRemarks?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  isActive: boolean;
  registeredBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  plot?: any;
  member?: any;
  registeredByUser?: any;
  updatedByUser?: any;
  verifiedByUser?: any;
  totalArea?: string;
  verificationBadgeColor?: string;
  mutationAge?: number;
}

export interface CreateRegistryDto {
  plotId: string;
  memId: string;
  registryNo: string;
  mozaVillage?: string;
  khasraNo?: string;
  khewatNo?: string;
  khatoniNo?: string;
  mutationNo: string;
  mutationDate?: Date;
  areaKanal?: number;
  areaMarla?: number;
  areaSqft?: number;
  mutationArea?: string;
  legalOfficeDetails?: string;
  subRegistrarName?: string;
  agreementDate?: Date;
  stampPaperNo?: string;
  tabadlaNama?: string;
  bookNo?: string;
  volumeNo?: string;
  documentNo?: string;
  reportNo?: string;
  scanCopyPath?: string;
  landOwnerPhoto?: string;
  remarks?: string;
}

export interface UpdateRegistryDto {
  plotId?: string;
  memId?: string;
  registryNo?: string;
  mozaVillage?: string;
  khasraNo?: string;
  khewatNo?: string;
  khatoniNo?: string;
  mutationNo?: string;
  mutationDate?: Date;
  areaKanal?: number;
  areaMarla?: number;
  areaSqft?: number;
  mutationArea?: string;
  legalOfficeDetails?: string;
  subRegistrarName?: string;
  agreementDate?: Date;
  stampPaperNo?: string;
  tabadlaNama?: string;
  bookNo?: string;
  volumeNo?: string;
  documentNo?: string;
  reportNo?: string;
  scanCopyPath?: string;
  landOwnerPhoto?: string;
  remarks?: string;
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
  verificationRemarks?: string;
}

export interface RegistryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  plotId?: string;
  memId?: string;
  registryNo?: string;
  mutationNo?: string;
  mozaVillage?: string;
  khasraNo?: string;
  khewatNo?: string;
  khatoniNo?: string;
  subRegistrarName?: string;
  year?: number;
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RegistrySearchParams {
  searchTerm?: string;
  registryNo?: string;
  mutationNo?: string;
  memId?: string;
  plotId?: string;
  mozaVillage?: string;
  khasraNo?: string;
  khewatNo?: string;
  khatoniNo?: string;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetRegistriesResult {
  registries: RegistryType[];
  summary: {
    totalRegistries: number;
    verifiedRegistries: number;
    pendingVerifications: number;
    rejectedRegistries: number;
    totalAreaKanal: number;
    totalAreaMarla: number;
    totalAreaSqft: number;
    byYear: Record<string, number>;
  };
  pagination: PaginationResult;
}

export interface RegistryStatistics {
  totalRegistries: number;
  verifiedRegistries: number;
  pendingVerifications: number;
  rejectedRegistries: number;
  totalAreaKanal: number;
  totalAreaMarla: number;
  totalAreaSqft: number;
  averageAreaKanal: number;
  averageAreaMarla: number;
  averageAreaSqft: number;
  registriesWithScanCopy: number;
  registriesWithPhoto: number;
  byYear: Record<string, number>;
  bySubRegistrar: Record<string, number>;
  byVerificationMonth: Record<string, number>;
  byAreaRange: Record<string, number>;
}

export interface TimelineDay {
  date: Date;
  count: number;
  totalArea: number;
  registries: Array<{
    id: string;
    registryNo: string;
    mutationNo: string;
    verificationStatus: string;
    createdAt: Date;
  }>;
}
