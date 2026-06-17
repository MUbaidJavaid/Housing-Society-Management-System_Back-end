import { AuthRequest } from '@/auth';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import {
  CheckInDto,
  CreateVisitorDto,
  PreApproveDto,
  UpdateVisitorDto,
  VisitorQueryParams,
  visitorService,
} from '../index-visitor';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const visitorController = {
  /**
   * Create a new visitor
   */
  createVisitor: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateVisitorDto = req.body;

      const visitor = await visitorService.create(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: visitor,
        message: 'Visitor created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all visitors with pagination and filters
   */
  getVisitors: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: VisitorQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        status: req.query.status as any,
        purpose: req.query.purpose as any,
        hostMemberId: req.query.hostMemberId as string,
        hostPlotId: req.query.hostPlotId as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
        preApproved: req.query.preApproved ? req.query.preApproved === 'true' : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await visitorService.getVisitors(queryParams);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        message: 'Visitors retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get visitor by ID
   */
  getVisitor: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const visitor = await visitorService.getVisitorById(id);

      if (!visitor) {
        throw new AppError(404, 'Visitor not found');
      }

      res.status(200).json({
        success: true,
        data: visitor,
        message: 'Visitor retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update a visitor
   */
  updateVisitor: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateVisitorDto = req.body;

      const visitor = await visitorService.updateVisitor(id, updateData, req.user.userId);

      if (!visitor) {
        throw new AppError(404, 'Visitor not found');
      }

      res.status(200).json({
        success: true,
        data: visitor,
        message: 'Visitor updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Soft delete a visitor
   */
  deleteVisitor: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const visitor = await visitorService.deleteVisitor(id, req.user.userId);

      if (!visitor) {
        throw new AppError(404, 'Visitor not found');
      }

      res.status(200).json({
        success: true,
        data: visitor,
        message: 'Visitor deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Check in a visitor
   */
  checkIn: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { gateNumber }: CheckInDto = req.body;

      const visitor = await visitorService.checkIn(id, req.user.userId, gateNumber);

      if (!visitor) {
        throw new AppError(404, 'Visitor not found');
      }

      res.status(200).json({
        success: true,
        data: visitor,
        message: 'Visitor checked in successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Check out a visitor
   */
  checkOut: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const visitor = await visitorService.checkOut(id, req.user.userId);

      if (!visitor) {
        throw new AppError(404, 'Visitor not found');
      }

      res.status(200).json({
        success: true,
        data: visitor,
        message: 'Visitor checked out successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Pre-approve a visitor pass
   */
  preApprove: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const preApproveData: PreApproveDto = req.body;

      const visitor = await visitorService.preApprove(preApproveData, req.user.userId);

      res.status(201).json({
        success: true,
        data: visitor,
        message: 'Visitor pre-approved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Verify a pass code
   */
  verifyPassCode: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const passCode = req.params.passCode as string;

      const visitor = await visitorService.verifyPassCode(passCode);

      if (!visitor) {
        throw new AppError(404, 'Invalid or expired pass code');
      }

      res.status(200).json({
        success: true,
        data: visitor,
        message: 'Pass code verified successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get currently checked-in (active) visitors
   */
  getActiveVisitors: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        societyId: req.query.societyId as string,
        gateNumber: req.query.gateNumber as string,
        hostMemberId: req.query.hostMemberId as string,
      };

      const visitors = await visitorService.getActiveVisitors(filters);

      res.status(200).json({
        success: true,
        data: visitors,
        message: 'Active visitors retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get visitor statistics
   */
  getVisitorStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        societyId: req.query.societyId as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const stats = await visitorService.getVisitorStats(filters);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Visitor statistics retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Cancel a visit
   */
  cancelVisit: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const visitor = await visitorService.cancelVisit(id, req.user.userId);

      if (!visitor) {
        throw new AppError(404, 'Visitor not found');
      }

      res.status(200).json({
        success: true,
        data: visitor,
        message: 'Visit cancelled successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Expire stale visitors (can be called manually or via cron)
   */
  expireStaleVisitors: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await visitorService.expireStaleVisitors();

      res.status(200).json({
        success: true,
        data: { expiredCount: count },
        message: `${count} stale visitor passes expired`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
