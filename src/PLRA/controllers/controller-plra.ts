import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { plraService } from '../services/service-plra';
import { CertificateQueryParams } from '../types/types-plra';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const plraController = {
  /**
   * Get all certificates
   */
  getCertificates: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const params: CertificateQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        societyId: req.query.societyId as string,
        plotId: req.query.plotId as string,
        memberId: req.query.memberId as string,
        certificateType: req.query.certificateType as string,
        status: req.query.status as string,
        syncStatus: req.query.syncStatus as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await plraService.getAllCertificates(params);

      res.json({
        success: true,
        data: result,
        message: 'Certificates retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get certificate by ID
   */
  getCertificateById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const certificate = await plraService.getCertificateById(req.params.id as string);

      res.json({
        success: true,
        data: certificate,
        message: 'Certificate retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Generate a new certificate
   */
  generateCertificate: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const certificate = await plraService.generateCertificate(
        req.body,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: certificate,
        message: 'Certificate generated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update a certificate
   */
  updateCertificate: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const certificate = await plraService.updateCertificate(
        req.params.id as string,
        req.body,
        req.user.userId
      );

      res.json({
        success: true,
        data: certificate,
        message: 'Certificate updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Revoke a certificate
   */
  revokeCertificate: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { reason } = req.body;

      const certificate = await plraService.revokeCertificate(
        req.params.id as string,
        reason,
        req.user.userId
      );

      res.json({
        success: true,
        data: certificate,
        message: 'Certificate revoked successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Verify certificate by QR code
   */
  verifyCertificate: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const certificate = await plraService.getCertificateByQR(req.params.qrCode as string);

      res.json({
        success: true,
        data: certificate,
        message: 'Certificate verified successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Sync certificate with PLRA
   */
  syncCertificate: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const result = await plraService.syncWithPLRA(
        req.params.id as string,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: `PLRA sync ${result.syncStatus}`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get sync logs for a certificate
   */
  getSyncLogs: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const logs = await plraService.getSyncLogs(req.params.id as string);

      res.json({
        success: true,
        data: logs,
        message: 'Sync logs retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get compliance dashboard
   */
  getComplianceDashboard: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const dashboard = await plraService.getComplianceDashboard(societyId);

      res.json({
        success: true,
        data: dashboard,
        message: 'Compliance dashboard retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
