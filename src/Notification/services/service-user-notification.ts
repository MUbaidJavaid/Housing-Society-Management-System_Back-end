import { Types } from 'mongoose';
import UserNotification from '../models/models-user-notification';
import { emitNotificationToUser } from '../../core/socket';
import { sendPushToUser } from '../../core/notifications/push-notification.service';
import User from '../../database/models/User';
import { logger } from '../../logger';

export interface CreateNotificationInput {
  userId: string | Types.ObjectId;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  sendPush?: boolean;
  emitSocket?: boolean;
}

export const userNotificationService = {
  async createAndDeliver(input: CreateNotificationInput) {
    const { userId, type, title, message, data = {}, sendPush = true, emitSocket = true } = input;

    const doc = await UserNotification.create({
      userId,
      type,
      title,
      message,
      data,
    });

    const payload = {
      id: doc._id.toString(),
      type,
      title,
      message,
      data,
      createdAt: doc.createdAt.toISOString(),
    };

    if (emitSocket) {
      try {
        emitNotificationToUser(userId.toString(), payload);
      } catch (e) {
        logger.warn('Socket emit failed', { userId, err: (e as Error).message });
      }
    }

    if (sendPush) {
      try {
        await sendPushToUser(userId, {
          title,
          body: message,
          data: { notificationId: doc._id.toString(), type, ...data },
        });
      } catch (e) {
        logger.warn('Push send failed', { userId, err: (e as Error).message });
      }
    }

    return doc;
  },

  async getUserNotifications(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const query: any = { userId: new Types.ObjectId(userId) };
    if (unreadOnly) query.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      UserNotification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UserNotification.countDocuments(query),
      UserNotification.countDocuments({ userId: new Types.ObjectId(userId), read: false }),
    ]);

    return {
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      unreadCount,
    };
  },

  async markAsRead(notificationId: string, userId: Types.ObjectId) {
    return UserNotification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );
  },

  async markAllAsRead(userId: Types.ObjectId) {
    return UserNotification.updateMany({ userId, read: false }, {
      $set: { read: true, readAt: new Date() },
    });
  },

  async getUnreadCount(userId: string) {
    return UserNotification.countDocuments({ userId: new Types.ObjectId(userId), read: false });
  },

  async deleteNotification(notificationId: string, userId: Types.ObjectId) {
    return UserNotification.findOneAndDelete({ _id: notificationId, userId });
  },
};
