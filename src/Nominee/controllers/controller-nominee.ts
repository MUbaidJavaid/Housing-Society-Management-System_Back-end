import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { nomineeService } from '../services/service-nominee';
import { CreateNomineeDto, NomineeQueryParams, UpdateNomineeDto } from '../types/types-nominee';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const nomineeController = {
  /**
   * Create new nominee
   */
  createNominee: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateNomineeDto = req.body;

      // Validate required fields
      if (!createData.memId?.trim()) {
        throw new AppError(400, 'Member ID is required');
      }

      if (!createData.nomineeName?.trim()) {
        throw new AppError(400, 'Nominee name is required');
      }

      if (!createData.nomineeCNIC?.trim()) {
        throw new AppError(400, 'Nominee CNIC is required');
      }

      if (!createData.relationWithMember) {
        throw new AppError(400, 'Relation with member is required');
      }

      if (!createData.nomineeContact?.trim()) {
        throw new AppError(400, 'Nominee contact is required');
      }

      // Validate CNIC format
      const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
      if (!cnicRegex.test(createData.nomineeCNIC)) {
        throw new AppError(400, 'Invalid CNIC format. Should be XXXXX-XXXXXXX-X');
      }

      const nominee = await nomineeService.createNominee(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: nominee,
        message: 'Nominee created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get nominee by ID
   */
  getNominee: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const nominee = await nomineeService.getNomineeById(id);

      res.json({
        success: true,
        data: nominee,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get nominee by CNIC
   */
  getNomineeByCNIC: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cnic = req.params.cnic as string;

      const nominee = await nomineeService.getNomineeByCNIC(cnic);

      if (!nominee) {
        throw new AppError(404, 'Nominee not found');
      }

      res.json({
        success: true,
        data: nominee,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all nominees
   */
  getNominees: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: NomineeQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        memId: req.query.memId as string,
        search: req.query.search as string,
        relationWithMember: req.query.relationWithMember as any,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await nomineeService.getNominees(queryParams);

      res.json({
        success: true,
        data: {
          nominees: result.nominees,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update nominee
   */
  updateNominee: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateNomineeDto = req.body;

      const updatedNominee = await nomineeService.updateNominee(id, updateData, req.user.userId);

      if (!updatedNominee) {
        throw new AppError(404, 'Nominee not found');
      }

      res.json({
        success: true,
        data: updatedNominee,
        message: 'Nominee updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete nominee (soft delete)
   */
  deleteNominee: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await nomineeService.deleteNominee(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Nominee not found');
      }

      res.json({
        success: true,
        message: 'Nominee deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get nominees by member
   */
  getNomineesByMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;
      const activeOnly = req.query.activeOnly !== 'false';

      const nominees = await nomineeService.getNomineesByMember(memId, activeOnly);

      res.json({
        success: true,
        data: nominees,
        total: nominees.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search nominees
   */
  searchNominees: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError(400, 'Search term must be at least 2 characters');
      }

      const nominees = await nomineeService.searchNominees(searchTerm, limit);

      res.json({
        success: true,
        data: nominees,
        total: nominees.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get nominee statistics
   */
  getNomineeStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await nomineeService.getNomineeStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get nominee summary for dashboard
   */
  getNomineeSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await nomineeService.getNomineeSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get share distribution
   */
  getShareDistribution: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const distribution = await nomineeService.getShareDistribution();

      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update nominee status
   */
  bulkUpdateStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { nomineeIds, isActive } = req.body;

      if (!nomineeIds || !Array.isArray(nomineeIds) || nomineeIds.length === 0) {
        throw new AppError(400, 'Nominee IDs are required and must be a non-empty array');
      }

      if (isActive === undefined) {
        throw new AppError(400, 'Status is required');
      }

      const result = await nomineeService.bulkUpdateStatus(nomineeIds, isActive, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} nominees`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get member's share coverage
   */
  getMemberShareCoverage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;

      const coverage = await nomineeService.getMemberShareCoverage(memId);

      res.json({
        success: true,
        data: coverage,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Validate nominee data
   */
  validateNomineeData: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      const validation = await nomineeService.validateNomineeData(data);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get members without full coverage
   */
  getMembersWithoutFullCoverage: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const members = await nomineeService.getMembersWithoutFullCoverage();

      res.json({
        success: true,
        data: members,
        total: members.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get nominee dropdown (simplified)
   */
  getNomineesDropdown: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.query.memId as string;

      const query: any = {
        isDeleted: false,
        isActive: true,
      };

      if (memId) {
        query.memId = memId;
      }

      const nominees = await nomineeService.getNomineesByMember(memId || '', true);

      const dropdown = nominees.map(nominee => ({
        value: nominee._id,
        label: `${nominee.nomineeName} (${nominee.relationWithMember}) - ${nominee.nomineeSharePercentage}%`,
        nomineeName: nominee.nomineeName,
        relation: nominee.relationWithMember,
        sharePercentage: nominee.nomineeSharePercentage,
        cnic: nominee.nomineeCNIC,
      }));

      res.json({
        success: true,
        data: dropdown,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
