import { AuthRequest } from '@/auth';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { possessionService } from '../index-possession';
import {
  BulkStatusUpdateDto,
  CollectorUpdateDto,
  CreatePossessionDto,
  HandoverCertificateDto,
  PossessionQueryParams,
  PossessionReportDto,
  PossessionStatus,
  StatusTransitionDto,
} from '../types/types-possession';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const possessionController = {
  /**
   * Create new possession request
   */
  createPossession: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreatePossessionDto = req.body;

      // Validate required fields
      if (!createData.fileId) {
        throw new AppError(400, 'File ID is required');
      }

      if (!createData.plotId) {
        throw new AppError(400, 'Plot ID is required');
      }

      if (!createData.possessionInitDate) {
        throw new AppError(400, 'Application Date is required');
      }

      if (!createData.possessionHandoverCSR) {
        throw new AppError(400, 'Handover CSR is required');
      }

      // Validate dates
      const initDate = new Date(createData.possessionInitDate);
      if (initDate > new Date()) {
        throw new AppError(400, 'Application Date cannot be in the future');
      }

      // Validate CNIC if provided
      if (createData.possessionCollectorNic) {
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$|^\d{13}$/;
        if (!cnicRegex.test(createData.possessionCollectorNic)) {
          throw new AppError(400, 'Please enter a valid CNIC (XXXXX-XXXXXXX-X or 13 digits)');
        }
      }

      const possession = await possessionService.createPossession(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: possession,
        message: 'Possession request created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get possession by ID
   */
  getPossession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const possession = await possessionService.getPossessionById(id);

      if (!possession || (possession as any).isDeleted) {
        throw new AppError(404, 'Possession not found');
      }

      res.json({
        success: true,
        data: possession,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get possession by code
   */
  getPossessionByCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;

      const possession = await possessionService.getPossessionByCode(code);

      if (!possession) {
        throw new AppError(404, 'Possession not found');
      }

      res.json({
        success: true,
        data: possession,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all possessions
   */
  getPossessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: PossessionQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        fileId: req.query.fileId as string,
        plotId: req.query.plotId as string,
        status: req.query.status
          ? ((req.query.status as string).split(',') as PossessionStatus[])
          : undefined,
        isCollected: req.query.isCollected ? req.query.isCollected === 'true' : undefined,
        csrId: req.query.csrId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        minDuration: req.query.minDuration ? parseInt(req.query.minDuration as string) : undefined,
        maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : undefined,
      };

      const result = await possessionService.getPossessions(queryParams);

      res.json({
        success: true,
        data: {
          possessions: result.possessions,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update possession
   */
  updatePossession: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      // Check if possession exists
      const existingPossession = await possessionService.getPossessionById(id);
      if (!existingPossession || (existingPossession as any).isDeleted) {
        throw new AppError(404, 'Possession not found');
      }

      // Validate dates if provided
      if (updateData.possessionInitDate) {
        const initDate = new Date(updateData.possessionInitDate);
        if (initDate > new Date()) {
          throw new AppError(400, 'Application Date cannot be in the future');
        }
      }

      // Validate CNIC if provided
      if (updateData.possessionCollectorNic) {
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$|^\d{13}$/;
        if (!cnicRegex.test(updateData.possessionCollectorNic)) {
          throw new AppError(400, 'Please enter a valid CNIC (XXXXX-XXXXXXX-X or 13 digits)');
        }
      }

      const updatedPossession = await possessionService.updatePossession(
        id,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        data: updatedPossession,
        message: 'Possession updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete possession
   */
  deletePossession: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      // Check if possession exists
      const existingPossession = await possessionService.getPossessionById(id);
      if (!existingPossession || (existingPossession as any).isDeleted) {
        throw new AppError(404, 'Possession not found');
      }

      const deleted = await possessionService.deletePossession(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Possession');
      }

      res.json({
        success: true,
        message: 'Possession deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update possession status
   */
  updatePossessionStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const statusData: StatusTransitionDto = req.body;

      if (!statusData.possessionId) {
        throw new AppError(400, 'Possession ID is required');
      }

      if (!statusData.newStatus) {
        throw new AppError(400, 'New status is required');
      }

      // Validate status
      if (!Object.values(PossessionStatus).includes(statusData.newStatus)) {
        throw new AppError(400, 'Invalid possession status');
      }

      const updatedPossession = await possessionService.updatePossessionStatus(
        statusData,
        req.user.userId
      );

      if (!updatedPossession) {
        throw new AppError(404, 'Possession not found');
      }

      res.json({
        success: true,
        data: updatedPossession,
        message: `Possession status updated to ${statusData.newStatus}`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update collector information
   */
  updateCollectorInfo: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const collectorData: CollectorUpdateDto = req.body;

      if (!collectorData.possessionId) {
        throw new AppError(400, 'Possession ID is required');
      }

      if (!collectorData.collectorName?.trim()) {
        throw new AppError(400, 'Collector Name is required');
      }

      if (!collectorData.collectorNic?.trim()) {
        throw new AppError(400, 'Collector CNIC is required');
      }

      // Validate CNIC
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$|^\d{13}$/;
      if (!cnicRegex.test(collectorData.collectorNic)) {
        throw new AppError(400, 'Please enter a valid CNIC (XXXXX-XXXXXXX-X or 13 digits)');
      }

      const updatedPossession = await possessionService.updateCollectorInfo(
        collectorData,
        req.user.userId
      );

      if (!updatedPossession) {
        throw new AppError(404, 'Possession not found');
      }

      res.json({
        success: true,
        data: updatedPossession,
        message: `Letter ${collectorData.isCollected ? 'collected' : 'uncollected'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get possessions by file ID
   */
  getPossessionsByFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.params.fileId as string;

      const possessions = await possessionService.getPossessionsByFile(fileId);

      res.json({
        success: true,
        data: possessions,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get possessions by plot ID
   */
  getPossessionsByPlot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plotId = req.params.plotId as string;

      const possessions = await possessionService.getPossessionsByPlot(plotId);

      res.json({
        success: true,
        data: possessions,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get possessions by status
   */
  getPossessionsByStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.params.status as PossessionStatus;

      if (!Object.values(PossessionStatus).includes(status)) {
        throw new AppError(400, 'Invalid possession status');
      }

      const possessions = await possessionService.getPossessionsByStatus(status);

      res.json({
        success: true,
        data: possessions,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get pending possessions
   */
  getPendingPossessions: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const possessions = await possessionService.getPendingPossessions();

      res.json({
        success: true,
        data: possessions,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get possessions by CSR
   */
  getPossessionsByCSR: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csrId = req.params.csrId as string;

      const possessions = await possessionService.getPossessionsByCSR(csrId);

      res.json({
        success: true,
        data: possessions,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get possession statistics
   */
  getPossessionStatistics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const statistics = await possessionService.getPossessionStatistics(startDate, endDate);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Generate possession report
   */
  generatePossessionReport: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportData: PossessionReportDto = req.body;

      if (!reportData.startDate || !reportData.endDate) {
        throw new AppError(400, 'Start date and end date are required');
      }

      const report = await possessionService.generatePossessionReport(reportData);

      res.json({
        success: true,
        data: report,
        message: 'Report generated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update possession statuses
   */
  bulkUpdatePossessionStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const bulkData: BulkStatusUpdateDto = req.body;

      if (
        !bulkData.possessionIds ||
        !Array.isArray(bulkData.possessionIds) ||
        bulkData.possessionIds.length === 0
      ) {
        throw new AppError(400, 'At least one possession ID is required');
      }

      if (!bulkData.status) {
        throw new AppError(400, 'Status is required');
      }

      if (!Object.values(PossessionStatus).includes(bulkData.status)) {
        throw new AppError(400, 'Invalid possession status');
      }

      const result = await possessionService.bulkUpdatePossessionStatus(bulkData, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `${result.modified} possessions updated successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Validate handover
   */
  validateHandover: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const possessionId = req.params.id as string;

      const validation = await possessionService.validateHandover(possessionId);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get possession timeline
   */
  getPossessionTimeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const possessionId = req.params.id as string;

      const timeline = await possessionService.getPossessionTimeline(possessionId);

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search possessions near location
   */
  searchPossessionsNearLocation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { latitude, longitude, maxDistance } = req.query;

      if (!latitude || !longitude) {
        throw new AppError(400, 'Latitude and Longitude are required');
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const distance = maxDistance ? parseInt(maxDistance as string) : 5000;

      if (isNaN(lat) || isNaN(lng)) {
        throw new AppError(400, 'Invalid coordinates');
      }

      const possessions = await possessionService.searchPossessionsNearLocation(lat, lng, distance);

      res.json({
        success: true,
        data: possessions,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get overdue possessions
   */
  getOverduePossessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const daysThreshold = req.query.days ? parseInt(req.query.days as string) : 30;

      const possessions = await possessionService.getOverduePossessions(daysThreshold);

      res.json({
        success: true,
        data: possessions,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Generate handover certificate
   */
  generateHandoverCertificate: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const certificateData: HandoverCertificateDto = req.body;

      if (!certificateData.possessionId) {
        throw new AppError(400, 'Possession ID is required');
      }

      if (!certificateData.certificateNumber) {
        throw new AppError(400, 'Certificate Number is required');
      }

      if (!certificateData.certificateDate) {
        throw new AppError(400, 'Certificate Date is required');
      }

      if (!certificateData.issuedBy) {
        throw new AppError(400, 'Issued By is required');
      }

      if (!certificateData.authorizedSignatory) {
        throw new AppError(400, 'Authorized Signatory is required');
      }

      if (!certificateData.certificatePath) {
        throw new AppError(400, 'Certificate Path is required');
      }

      const certificate = await possessionService.generateHandoverCertificate(certificateData);

      res.json({
        success: true,
        data: certificate,
        message: 'Handover certificate generated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get next allowed statuses
   */
  getAllowedNextStatuses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const possessionId = req.params.id as string;

      const possession = await possessionService.getPossessionById(possessionId);

      if (!possession) {
        throw new AppError(404, 'Possession not found');
      }

      res.json({
        success: true,
        data: {
          currentStatus: possession.possessionStatus,
          allowedNextStatuses: possession.allowedNextStatuses || [],
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Check if possession letter is collected
   */
  checkLetterCollected: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const possessionId = req.params.id as string;

      const possession = await possessionService.getPossessionById(possessionId);

      if (!possession) {
        throw new AppError(404, 'Possession not found');
      }

      res.json({
        success: true,
        data: {
          isCollected: possession.possessionIsCollected,
          collectorName: possession.possessionCollectorName,
          collectorNic: possession.possessionCollectorNic,
          collectionDate: possession.possessionCollectionDate,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update survey information
   */
  updateSurveyInfo: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const possessionId = req.params.id as string;
      const { surveyPerson, surveyDate, surveyRemarks, coordinates } = req.body;

      if (!surveyPerson?.trim()) {
        throw new AppError(400, 'Survey Person is required');
      }

      const updateData: any = {
        possessionSurveyPerson: surveyPerson,
        possessionSurveyRemarks: surveyRemarks,
        updatedBy: req.user.userId,
      };

      if (surveyDate) {
        updateData.possessionSurveyDate = new Date(surveyDate);
      }

      if (coordinates) {
        updateData.possessionLatitude = coordinates.latitude;
        updateData.possessionLongitude = coordinates.longitude;
      }

      const updatedPossession = await possessionService.updatePossession(
        possessionId,
        updateData,
        req.user.userId
      );

      if (!updatedPossession) {
        throw new AppError(404, 'Possession not found');
      }

      res.json({
        success: true,
        data: updatedPossession,
        message: 'Survey information updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
