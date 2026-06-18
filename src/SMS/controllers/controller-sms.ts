import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { smsService } from '../services/service-sms';
import { SMSQueryParams } from '../types/types-sms';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const smsController = {
  /**
   * Send a single SMS
   */
  sendSMS: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { recipient, message, messageType, societyId, relatedEntity } = req.body;

      if (!recipient || !message || !messageType) {
        throw new AppError(400, 'recipient, message, and messageType are required');
      }

      const result = await smsService.sendSMS(
        recipient,
        message,
        messageType,
        societyId,
        relatedEntity
      );

      res.status(result.success ? 200 : 500).json({
        success: result.success,
        data: result,
        message: result.success ? 'SMS sent successfully' : 'Failed to send SMS',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Send bulk SMS
   */
  sendBulkSMS: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { recipients, message, messageType, societyId } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        throw new AppError(400, 'recipients array is required and must not be empty');
      }

      if (!message || !messageType) {
        throw new AppError(400, 'message and messageType are required');
      }

      if (recipients.length > 500) {
        throw new AppError(400, 'Maximum 500 recipients allowed per bulk send');
      }

      const result = await smsService.sendBulkSMS(recipients, message, messageType, societyId);

      res.json({
        success: true,
        data: result,
        message: `Bulk SMS: ${result.sent} sent, ${result.failed} failed out of ${result.total}`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get SMS logs with filtering and pagination
   */
  getSMSLogs: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const queryParams: SMSQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        societyId: req.query.societyId as string,
        recipient: req.query.recipient as string,
        messageType: req.query.messageType as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await smsService.getSMSLogs(queryParams);

      res.json({
        success: true,
        data: {
          logs: result.logs,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get SMS statistics
   */
  getSMSStats: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string;
      const stats = await smsService.getSMSStats(societyId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
