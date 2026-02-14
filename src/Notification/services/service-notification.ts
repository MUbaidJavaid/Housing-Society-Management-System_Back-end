import { Types } from 'mongoose';
import Notification from '../models/models-notification';

export const notificationService = {
  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const query: any = {
      isDeleted: false,
      $or: [
        { targetUsers: new Types.ObjectId(userId) },
        { targetUsers: { $exists: false } }, // Global notifications
        { targetUsers: { $size: 0 } }, // Empty array = global
      ],
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'userName fullName')
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, isRead: false }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: Types.ObjectId) {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
        $addToSet: {
          readBy: userId,
        },
      },
      { new: true }
    );

    return notification;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: Types.ObjectId) {
    const result = await Notification.updateMany(
      {
        isDeleted: false,
        isRead: false,
        $or: [
          { targetUsers: userId },
          { targetUsers: { $exists: false } },
          { targetUsers: { $size: 0 } },
        ],
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
        $addToSet: {
          readBy: userId,
        },
      }
    );

    return result;
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    return notification;
  },

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string) {
    const count = await Notification.countDocuments({
      isDeleted: false,
      isRead: false,
      $or: [
        { targetUsers: new Types.ObjectId(userId) },
        { targetUsers: { $exists: false } },
        { targetUsers: { $size: 0 } },
      ],
    });

    return count;
  },
};
