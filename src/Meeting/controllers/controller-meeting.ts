import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { meetingService } from '../services/service-meeting';
import { MeetingQueryParams } from '../types/types-meeting';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const meetingController = {
  /**
   * Create a new meeting
   */
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const meeting = await meetingService.create(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: meeting,
        message: 'Meeting created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all meetings
   */
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: MeetingQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        societyId: req.query.societyId as string,
        meetingType: req.query.meetingType as string,
        status: req.query.status as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await meetingService.getAll(queryParams);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get meeting by ID
   */
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const meeting = await meetingService.getById(req.params.id as string);

      res.json({
        success: true,
        data: meeting,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update meeting
   */
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const meeting = await meetingService.update(req.params.id as string, req.body, req.user.userId);

      res.json({
        success: true,
        data: meeting,
        message: 'Meeting updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete meeting (soft delete)
   */
  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      await meetingService.delete(req.params.id as string, req.user.userId);

      res.json({
        success: true,
        message: 'Meeting deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Add agenda item
   */
  addAgendaItem: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const meeting = await meetingService.addAgendaItem(req.params.id as string, req.body, req.user.userId);

      res.json({
        success: true,
        data: meeting,
        message: 'Agenda item added successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update minutes
   */
  updateMinutes: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { minutes } = req.body;
      if (!minutes || !minutes.trim()) {
        throw new AppError(400, 'Minutes content is required');
      }

      const meeting = await meetingService.updateMinutes(req.params.id as string, minutes, req.user.userId);

      res.json({
        success: true,
        data: meeting,
        message: 'Minutes updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Record attendance
   */
  recordAttendance: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { memberId, status, proxyTo } = req.body;

      const meeting = await meetingService.recordAttendance(
        req.params.id as string,
        memberId,
        status,
        proxyTo
      );

      // Check quorum after recording attendance
      const quorumResult = await meetingService.checkQuorum(req.params.id as string);

      res.json({
        success: true,
        data: { meeting, quorum: quorumResult },
        message: 'Attendance recorded successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Add decision
   */
  addDecision: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const meeting = await meetingService.addDecision(req.params.id as string, req.body, req.user.userId);

      res.json({
        success: true,
        data: meeting,
        message: 'Decision added successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Complete meeting
   */
  completeMeeting: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const meeting = await meetingService.completeMeeting(req.params.id as string, req.user.userId);

      res.json({
        success: true,
        data: meeting,
        message: 'Meeting completed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
