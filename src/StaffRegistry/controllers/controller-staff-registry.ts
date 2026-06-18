import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { staffRegistryService } from '../services/service-staff-registry';
import { StaffQueryParams } from '../types/types-staff-registry';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const staffRegistryController = {
  registerStaff: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const staff = await staffRegistryService.registerStaff(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: staff,
        message: 'Staff member registered successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getStaffMembers: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const queryParams: StaffQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        staffType: req.query.staffType as string,
        isVerified: req.query.isVerified as string,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        blacklisted: req.query.blacklisted as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await staffRegistryService.getStaffMembers(queryParams);

      res.json({
        success: true,
        data: {
          staffMembers: result.staffMembers,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getStaffById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const staff = await staffRegistryService.getStaffById(id);

      res.json({
        success: true,
        data: staff,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateStaff: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const staff = await staffRegistryService.updateStaff(id, req.body, req.user.userId);

      res.json({
        success: true,
        data: staff,
        message: 'Staff member updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteStaff: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      await staffRegistryService.deleteStaff(id, req.user.userId);

      res.json({
        success: true,
        message: 'Staff member deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  verifyStaff: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { method } = req.body;
      const staff = await staffRegistryService.verifyStaff(id, method, req.user.userId);

      res.json({
        success: true,
        data: staff,
        message: 'Staff member verified successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  addEmployment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const staffId = req.params.id as string;
      const staff = await staffRegistryService.addEmployment(staffId, req.body);

      res.status(201).json({
        success: true,
        data: staff,
        message: 'Employment record added successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  endEmployment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const staffId = req.params.id as string;
      const { societyId, rating, review } = req.body;
      const staff = await staffRegistryService.endEmployment(staffId, societyId, rating, review);

      res.json({
        success: true,
        data: staff,
        message: 'Employment ended successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  rateStaff: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const staffId = req.params.id as string;
      const { societyId, memberId, rating, review } = req.body;
      const staff = await staffRegistryService.rateStaff(staffId, societyId, memberId, rating, review);

      res.json({
        success: true,
        data: staff,
        message: 'Staff rated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  blacklistStaff: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const staffId = req.params.id as string;
      const { reason } = req.body;
      const staff = await staffRegistryService.blacklistStaff(staffId, reason, req.user.userId);

      res.json({
        success: true,
        data: staff,
        message: 'Staff member blacklisted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  searchByCNIC: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cnic = req.params.cnic as string;
      const staff = await staffRegistryService.searchByCNIC(cnic);

      res.json({
        success: true,
        data: staff,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getStaffBySociety: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const societyId = req.params.societyId as string;
      const staffMembers = await staffRegistryService.getStaffBySociety(societyId);

      res.json({
        success: true,
        data: staffMembers,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
