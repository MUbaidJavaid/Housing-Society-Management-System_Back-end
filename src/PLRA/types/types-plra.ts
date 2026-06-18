export interface GenerateCertificateDto {
  plotId: string;
  memberId: string;
  societyId: string;
  certificateType: 'ownership' | 'allotment' | 'transfer' | 'possession';
  issuedDate: string;
  validUntil?: string;
  propertyDetails?: {
    area?: number;
    areaUnit?: string;
    boundaries?: string;
    address?: string;
    plotNumber?: string;
    blockName?: string;
  };
  ownerDetails?: {
    name?: string;
    cnic?: string;
    fatherName?: string;
    address?: string;
  };
  digitalSignature?: string;
}

export interface UpdateCertificateDto {
  certificateType?: 'ownership' | 'allotment' | 'transfer' | 'possession';
  validUntil?: string;
  propertyDetails?: {
    area?: number;
    areaUnit?: string;
    boundaries?: string;
    address?: string;
    plotNumber?: string;
    blockName?: string;
  };
  ownerDetails?: {
    name?: string;
    cnic?: string;
    fatherName?: string;
    address?: string;
  };
  digitalSignature?: string;
  pdfUrl?: string;
  status?: 'draft' | 'issued' | 'verified' | 'revoked' | 'expired';
}

export interface CertificateQueryParams {
  page?: number;
  limit?: number;
  societyId?: string;
  plotId?: string;
  memberId?: string;
  certificateType?: string;
  status?: string;
  syncStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ComplianceDashboard {
  totalCertificates: number;
  syncedCount: number;
  pendingCount: number;
  failedCount: number;
  recentLogs: any[];
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
