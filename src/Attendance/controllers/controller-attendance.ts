import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { attendanceService } from '../services/service-attendance';
import { AttendanceQueryParams } from '../types/types-attendance';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const attendanceController = {
  /**
   * Check in
   */
  checkIn: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const staffId = req.user.userId;
      const { societyId, location, geofenceId, shiftName } = req.body;

      const record = await attendanceService.checkIn(
        staffId,
        societyId,
        location,
        geofenceId,
        shiftName
      );

      res.status(201).json({
        success: true,
        data: record,
        message: 'Checked in successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Check out
   */
  checkOut: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const staffId = req.user.userId;
      const { location } = req.body;

      const record = await attendanceService.checkOut(staffId, location);

      res.json({
        success: true,
        data: record,
        message: 'Checked out successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get attendance records
   */
  getAttendance: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const params: AttendanceQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        staffId: req.query.staffId as string,
        societyId: req.query.societyId as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await attendanceService.getAttendance(params);

      res.json({
        success: true,
        data: result,
        message: 'Attendance records retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get attendance by ID
   */
  getAttendanceById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const record = await attendanceService.getAttendanceById(req.params.id as string);

      res.json({
        success: true,
        data: record,
        message: 'Attendance record retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get monthly summary
   */
  getSummary: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const staffId = req.query.staffId as string;
      const month = parseInt(req.query.month as string);
      const year = parseInt(req.query.year as string);

      const summary = await attendanceService.getSummary(staffId, month, year);

      res.json({
        success: true,
        data: summary,
        message: 'Attendance summary retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get society summary for a date
   */
  getSocietySummary: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string;
      const date = req.query.date as string;

      const summary = await attendanceService.getSocietySummary(societyId, date);

      res.json({
        success: true,
        data: summary,
        message: 'Society attendance summary retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Create geofence
   */
  createGeofence: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const geofence = await attendanceService.createGeofence(
        req.body,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: geofence,
        message: 'Geofence created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get geofences
   */
  getGeofences: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const geofences = await attendanceService.getGeofences(societyId);

      res.json({
        success: true,
        data: geofences,
        message: 'Geofences retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update geofence
   */
  updateGeofence: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const geofence = await attendanceService.updateGeofence(
        req.params.id as string,
        req.body,
        req.user.userId
      );

      res.json({
        success: true,
        data: geofence,
        message: 'Geofence updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete geofence
   */
  deleteGeofence: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      await attendanceService.deleteGeofence(req.params.id as string, req.user.userId);

      res.json({
        success: true,
        message: 'Geofence deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
