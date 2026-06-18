import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { gatePassService } from '../services/service-gate-pass';
import { GatePassQueryParams } from '../types/types-gate-pass';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const gatePassController = {
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const pass = await gatePassService.create(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: pass,
        message: 'Gate pass created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const queryParams: GatePassQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        societyId: req.query.societyId as string,
        status: req.query.status as string,
        passType: req.query.passType as string,
        requestedBy: req.query.requestedBy as string,
        expectedDate: req.query.expectedDate as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await gatePassService.getAll(queryParams);

      res.json({
        success: true,
        data: {
          passes: result.passes,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const pass = await gatePassService.getById(id);

      res.json({
        success: true,
        data: pass,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const pass = await gatePassService.update(id, req.body, req.user.userId);

      res.json({
        success: true,
        data: pass,
        message: 'Gate pass updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      await gatePassService.delete(id, req.user.userId);

      res.json({
        success: true,
        message: 'Gate pass deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  approvePass: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const pass = await gatePassService.approvePass(id, req.user.userId);

      res.json({
        success: true,
        data: pass,
        message: 'Gate pass approved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  rejectPass: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { reason } = req.body;
      const pass = await gatePassService.rejectPass(id, reason, req.user.userId);

      res.json({
        success: true,
        data: pass,
        message: 'Gate pass rejected',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  checkIn: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { notes } = req.body;
      const pass = await gatePassService.checkIn(id, req.user.userId, notes);

      res.json({
        success: true,
        data: pass,
        message: 'Gate pass checked in successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  checkOut: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { notes, photos } = req.body;
      const pass = await gatePassService.checkOut(id, req.user.userId, notes, photos);

      res.json({
        success: true,
        data: pass,
        message: 'Gate pass checked out successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  verifyPassCode: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const code = req.params.code as string;
      const pass = await gatePassService.verifyPassCode(code);

      if (!pass) {
        throw new AppError(404, 'Invalid or expired pass code');
      }

      res.json({
        success: true,
        data: pass,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  cancelPass: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const pass = await gatePassService.cancelPass(id, req.user.userId);

      res.json({
        success: true,
        data: pass,
        message: 'Gate pass cancelled successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMyPasses: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await gatePassService.getMyPasses(
        req.user.userId.toString(), page, limit
      );

      res.json({
        success: true,
        data: {
          passes: result.passes,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getTodaysPasses: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const societyId = req.query.societyId as string;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const passes = await gatePassService.getTodaysPasses(societyId);

      res.json({
        success: true,
        data: passes,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPassStats: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const societyId = req.query.societyId as string;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const stats = await gatePassService.getPassStats(societyId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
