import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { notificationService } from '../services/service-notification';

export const notificationController = {
  /**
   * Get user notifications
   */
  async getUserNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const unreadOnly = req.query.unreadOnly === 'true';

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

      const notificationId = req.params.id;
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

      const notificationId = req.params.id;
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
