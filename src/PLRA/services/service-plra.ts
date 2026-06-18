import { Types } from 'mongoose';
import PLRACertificate from '../models/models-plra-certificate';
import PLRASyncLog from '../models/models-plra-sync-log';
import {
  CertificateQueryParams,
  ComplianceDashboard,
  GenerateCertificateDto,
  UpdateCertificateDto,
} from '../types/types-plra';

const generateQRCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateCertificateNumber = (type: string): string => {
  const prefix = type.toUpperCase().substring(0, 3);
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PLRA-${prefix}-${timestamp}-${random}`;
};

export const plraService = {
  /**
   * Generate a new certificate
   */
  async generateCertificate(
    data: GenerateCertificateDto,
    userId: Types.ObjectId
  ): Promise<any> {
    // Generate unique QR code
    let qrCode = generateQRCode();
    let existingQR = await PLRACertificate.findOne({ qrCode, isDeleted: false });
    while (existingQR) {
      qrCode = generateQRCode();
      existingQR = await PLRACertificate.findOne({ qrCode, isDeleted: false });
    }

    const certificateNumber = generateCertificateNumber(data.certificateType);

    const certificate = await PLRACertificate.create({
      plotId: new Types.ObjectId(data.plotId),
      memberId: new Types.ObjectId(data.memberId),
      societyId: new Types.ObjectId(data.societyId),
      certificateNumber,
      certificateType: data.certificateType,
      issuedDate: new Date(data.issuedDate),
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      propertyDetails: data.propertyDetails || {},
      ownerDetails: data.ownerDetails || {},
      qrCode,
      digitalSignature: data.digitalSignature,
      status: 'draft',
      syncStatus: 'pending',
      issuedBy: userId,
    });

    const populated = await PLRACertificate.findById(certificate._id)
      .populate('plotId', 'plotNumber plotSize')
      .populate('memberId', 'memName memNic email')
      .populate('societyId', 'name')
      .populate('issuedBy', 'firstName lastName email');

    return populated;
  },

  /**
   * Get all certificates with pagination and filters
   */
  async getAllCertificates(params: CertificateQueryParams): Promise<{
    certificates: any[];
    pagination: any;
  }> {
    const {
      page = 1,
      limit = 20,
      societyId,
      plotId,
      memberId,
      certificateType,
      status,
      syncStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (plotId) query.plotId = new Types.ObjectId(plotId);
    if (memberId) query.memberId = new Types.ObjectId(memberId);
    if (certificateType) query.certificateType = certificateType;
    if (status) query.status = status;
    if (syncStatus) query.syncStatus = syncStatus;

    const [certificates, total] = await Promise.all([
      PLRACertificate.find(query)
        .populate('plotId', 'plotNumber plotSize')
        .populate('memberId', 'memName memNic email')
        .populate('societyId', 'name')
        .populate('issuedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      PLRACertificate.countDocuments(query),
    ]);

    return {
      certificates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get certificate by ID
   */
  async getCertificateById(id: string): Promise<any> {
    const certificate = await PLRACertificate.findById(id)
      .populate('plotId', 'plotNumber plotSize blockId')
      .populate('memberId', 'memName memNic email phone')
      .populate('societyId', 'name address')
      .populate('issuedBy', 'firstName lastName email');

    if (!certificate || certificate.isDeleted) {
      throw new Error('Certificate not found');
    }

    return certificate;
  },

  /**
   * Get certificate by QR code
   */
  async getCertificateByQR(qrCode: string): Promise<any> {
    const certificate = await PLRACertificate.findOne({
      qrCode,
      isDeleted: false,
    })
      .populate('plotId', 'plotNumber plotSize')
      .populate('memberId', 'memName memNic')
      .populate('societyId', 'name')
      .populate('issuedBy', 'firstName lastName');

    if (!certificate) {
      throw new Error('Certificate not found for the given QR code');
    }

    return certificate;
  },

  /**
   * Update a certificate
   */
  async updateCertificate(
    id: string,
    data: UpdateCertificateDto,
    _userId: Types.ObjectId
  ): Promise<any> {
    const certificate = await PLRACertificate.findById(id);
    if (!certificate || certificate.isDeleted) {
      throw new Error('Certificate not found');
    }

    if (certificate.status === 'revoked') {
      throw new Error('Cannot update a revoked certificate');
    }

    const updateData: any = {};
    if (data.certificateType) updateData.certificateType = data.certificateType;
    if (data.validUntil) updateData.validUntil = new Date(data.validUntil);
    if (data.propertyDetails) updateData.propertyDetails = data.propertyDetails;
    if (data.ownerDetails) updateData.ownerDetails = data.ownerDetails;
    if (data.digitalSignature) updateData.digitalSignature = data.digitalSignature;
    if (data.pdfUrl) updateData.pdfUrl = data.pdfUrl;
    if (data.status) updateData.status = data.status;

    const updated = await PLRACertificate.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('plotId', 'plotNumber plotSize')
      .populate('memberId', 'memName memNic email')
      .populate('societyId', 'name')
      .populate('issuedBy', 'firstName lastName email');

    return updated;
  },

  /**
   * Revoke a certificate
   */
  async revokeCertificate(
    id: string,
    reason: string,
    _userId: Types.ObjectId
  ): Promise<any> {
    const certificate = await PLRACertificate.findById(id);
    if (!certificate || certificate.isDeleted) {
      throw new Error('Certificate not found');
    }

    if (certificate.status === 'revoked') {
      throw new Error('Certificate is already revoked');
    }

    const updated = await PLRACertificate.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'revoked',
          metadata: {
            ...certificate.metadata,
            revocationReason: reason,
            revokedAt: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate('plotId', 'plotNumber plotSize')
      .populate('memberId', 'memName memNic email')
      .populate('societyId', 'name')
      .populate('issuedBy', 'firstName lastName email');

    return updated;
  },

  /**
   * Sync certificate with PLRA (placeholder implementation)
   */
  async syncWithPLRA(
    certificateId: string,
    userId: Types.ObjectId
  ): Promise<any> {
    const certificate = await PLRACertificate.findById(certificateId);
    if (!certificate || certificate.isDeleted) {
      throw new Error('Certificate not found');
    }

    const startTime = Date.now();

    // Placeholder: simulate PLRA API sync attempt
    let syncStatus: 'success' | 'failed' | 'timeout' = 'success';
    let errorMessage: string | undefined;
    let responsePayload: any;

    try {
      // In a real implementation, this would call the PLRA API
      // Simulate a successful sync
      responsePayload = {
        plraRef: `PLRA-${Date.now()}`,
        syncedAt: new Date().toISOString(),
        message: 'Certificate data synced successfully with PLRA',
      };

      // Update certificate sync status
      await PLRACertificate.findByIdAndUpdate(certificateId, {
        $set: {
          syncStatus: 'synced',
          lastSyncAt: new Date(),
          plraReferenceNumber: responsePayload.plraRef,
          syncError: undefined,
        },
      });
    } catch (err: any) {
      syncStatus = 'failed';
      errorMessage = err.message || 'Unknown sync error';

      await PLRACertificate.findByIdAndUpdate(certificateId, {
        $set: {
          syncStatus: 'failed',
          lastSyncAt: new Date(),
          syncError: errorMessage,
        },
      });
    }

    const duration = Date.now() - startTime;

    // Log the sync attempt
    const syncLog = await PLRASyncLog.create({
      certificateId: new Types.ObjectId(certificateId),
      societyId: certificate.societyId,
      action: 'submit',
      status: syncStatus,
      requestPayload: {
        certificateNumber: certificate.certificateNumber,
        certificateType: certificate.certificateType,
        ownerDetails: certificate.ownerDetails,
        propertyDetails: certificate.propertyDetails,
      },
      responsePayload,
      errorMessage,
      duration,
      initiatedBy: userId,
    });

    return {
      syncLog,
      syncStatus,
      certificate: await PLRACertificate.findById(certificateId)
        .populate('plotId', 'plotNumber plotSize')
        .populate('memberId', 'memName memNic email')
        .populate('societyId', 'name'),
    };
  },

  /**
   * Get sync logs for a certificate
   */
  async getSyncLogs(certificateId: string): Promise<any[]> {
    const logs = await PLRASyncLog.find({
      certificateId: new Types.ObjectId(certificateId),
    })
      .populate('initiatedBy', 'firstName lastName email')
      .sort({ timestamp: -1 });

    return logs;
  },

  /**
   * Get compliance dashboard for a society
   */
  async getComplianceDashboard(
    societyId: string
  ): Promise<ComplianceDashboard> {
    const societyObjId = new Types.ObjectId(societyId);

    const [totalCertificates, syncedCount, pendingCount, failedCount, recentLogs] =
      await Promise.all([
        PLRACertificate.countDocuments({
          societyId: societyObjId,
          isDeleted: false,
        }),
        PLRACertificate.countDocuments({
          societyId: societyObjId,
          isDeleted: false,
          syncStatus: 'synced',
        }),
        PLRACertificate.countDocuments({
          societyId: societyObjId,
          isDeleted: false,
          syncStatus: 'pending',
        }),
        PLRACertificate.countDocuments({
          societyId: societyObjId,
          isDeleted: false,
          syncStatus: 'failed',
        }),
        PLRASyncLog.find({ societyId: societyObjId })
          .populate('certificateId', 'certificateNumber certificateType')
          .populate('initiatedBy', 'firstName lastName')
          .sort({ timestamp: -1 })
          .limit(20),
      ]);

    return {
      totalCertificates,
      syncedCount,
      pendingCount,
      failedCount,
      recentLogs,
    };
  },

  /**
   * Generate a unique QR code
   */
  generateQRCode,
};
