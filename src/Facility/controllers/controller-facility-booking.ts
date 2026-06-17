import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { facilityBookingService } from '../services/service-facility-booking';
import { BookingQueryParams, CreateBookingDto } from '../types/types-facility-booking';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const facilityBookingController = {
  /**
   * Create a new booking
   */
  createBooking: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateBookingDto = req.body;

      const booking = await facilityBookingService.createBooking(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all bookings (admin)
   */
  getBookings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: BookingQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        facilityId: req.query.facilityId as string,
        memberId: req.query.memberId as string,
        status: req.query.status as any,
        paymentStatus: req.query.paymentStatus as any,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await facilityBookingService.getBookings(queryParams);

      res.json({
        success: true,
        data: {
          bookings: result.bookings,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get own bookings (authenticated member/user)
   */
  getMyBookings: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const queryParams: BookingQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        memberId: req.user.userId.toString(),
        status: req.query.status as any,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await facilityBookingService.getBookings(queryParams);

      res.json({
        success: true,
        data: {
          bookings: result.bookings,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Check availability
   */
  checkAvailability: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { facilityId, date, startTime, endTime } = req.query;

      if (!facilityId || !date) {
        throw new AppError(400, 'facilityId and date are required');
      }

      // If startTime and endTime provided, check specific slot
      if (startTime && endTime) {
        const availability = await facilityBookingService.checkAvailability(
          facilityId as string,
          date as string,
          startTime as string,
          endTime as string
        );

        res.json({
          success: true,
          data: availability,
        });
        return;
      }

      // Otherwise return all available slots
      const slots = await facilityBookingService.getAvailableSlots(
        facilityId as string,
        date as string
      );

      res.json({
        success: true,
        data: { slots },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get booking by ID
   */
  getBooking: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const booking = await facilityBookingService.getBookingById(id);

      res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Approve a booking
   */
  approveBooking: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const booking = await facilityBookingService.approveBooking(id, req.user.userId);

      if (!booking) {
        throw new AppError(404, 'Booking not found');
      }

      res.json({
        success: true,
        data: booking,
        message: 'Booking approved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { reason } = req.body;

      const booking = await facilityBookingService.cancelBooking(
        id,
        reason || 'Cancelled by user',
        req.user.userId
      );

      if (!booking) {
        throw new AppError(404, 'Booking not found');
      }

      res.json({
        success: true,
        data: booking,
        message: 'Booking cancelled successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Complete a booking
   */
  completeBooking: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const booking = await facilityBookingService.completeBooking(id, req.user.userId);

      if (!booking) {
        throw new AppError(404, 'Booking not found');
      }

      res.json({
        success: true,
        data: booking,
        message: 'Booking completed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get booking stats summary
   */
  getBookingStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        facilityId: req.query.facilityId as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
      };

      const stats = await facilityBookingService.getBookingStats(filters);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
