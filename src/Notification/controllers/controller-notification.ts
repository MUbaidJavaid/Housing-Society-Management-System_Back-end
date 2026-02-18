import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { notificationService } from '../services/service-notification';

type ParsedQs = Record<string, unknown>;

const getSingleValue = (
  value: string | ParsedQs | (string | ParsedQs)[] | undefined
): string | undefined => {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }

  return typeof value === 'string' ? value : undefined;
};

export const notificationController = {
  /**
   * Get user notifications
   */
  async getUserNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const pageValue = getSingleValue(req.query.page);
      const limitValue = getSingleValue(req.query.limit);
      const unreadOnlyValue = getSingleValue(req.query.unreadOnly);

      const page = pageValue ? parseInt(pageValue, 10) : 1;
      const limit = limitValue ? parseInt(limitValue, 10) : 20;
      const unreadOnly = unreadOnlyValue === 'true';

      const result = await notificationService.getUserNotifications(req.user.userId.toString(), {
        page,
        limit,
        unreadOnly,
      });

      res.json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const notificationId = getSingleValue(req.params.id);
      if (!notificationId) {
        throw new AppError(400, 'Notification ID is required');
      }
      const notification = await notificationService.markAsRead(notificationId, req.user.userId);

      if (!notification) {
        throw new AppError(404, 'Notification not found');
      }

      res.json({
        success: true,
        data: notification,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const result = await notificationService.markAllAsRead(req.user.userId);

      res.json({
        success: true,
        message: `${result.modifiedCount} notifications marked as read`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const notificationId = getSingleValue(req.params.id);
      if (!notificationId) {
        throw new AppError(400, 'Notification ID is required');
      }
      const notification = await notificationService.deleteNotification(notificationId);

      if (!notification) {
        throw new AppError(404, 'Notification not found');
      }

      res.json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const count = await notificationService.getUnreadCount(req.user.userId.toString());

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  },
};
