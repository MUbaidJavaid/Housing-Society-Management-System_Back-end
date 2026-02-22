import { Types } from 'mongoose';
import webPush from 'web-push';
import User from '../../database/models/User';
import { logger } from '../../logger';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string | number | boolean>;
}

export interface PushNotificationResult {
  success: boolean;
  delivered: number;
  failed: number;
  message: string;
}

function getVapidKeys(): { publicKey: string; privateKey: string } | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    logger.warn('VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
    return null;
  }
  return { publicKey, privateKey };
}

/**
 * Initialize web-push with VAPID keys
 */
export function initializeWebPush(): void {
  const keys = getVapidKeys();
  if (keys) {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:support@hsms.app',
      keys.publicKey,
      keys.privateKey
    );
    logger.info('Web Push (VAPID) initialized');
  }
}

/**
 * Send push notification to user's subscriptions
 */
export async function sendPushToUser(
  userId: string | Types.ObjectId,
  payload: PushNotificationPayload
): Promise<PushNotificationResult> {
  const keys = getVapidKeys();
  if (!keys) {
    return { success: false, delivered: 0, failed: 0, message: 'VAPID not configured' };
  }

  const user = await User.findById(userId).select('pushSubscriptions preferences').lean();

  if (!user) {
    return { success: false, delivered: 0, failed: 0, message: 'User not found' };
  }

  const prefs = (user as any).preferences?.notifications;
  if (prefs?.push === false) {
    return { success: true, delivered: 0, failed: 0, message: 'User disabled push' };
  }

  const subs = (user as any).pushSubscriptions || [];
  if (subs.length === 0) {
    return { success: true, delivered: 0, failed: 0, message: 'No push subscriptions' };
  }

  const jsonPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/badge-72x72.png',
    data: payload.data || {},
  });

  let delivered = 0;
  let failed = 0;
  const invalidEndpoints: string[] = [];

  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        jsonPayload,
        {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: 'high',
        }
      );
      delivered++;
    } catch (err: any) {
      failed++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        invalidEndpoints.push(sub.endpoint);
      }
      logger.warn('Push send failed', { userId, endpoint: sub.endpoint, err: err.message });
    }
  }

  // Remove invalid subscriptions
  if (invalidEndpoints.length > 0) {
    await User.findByIdAndUpdate(userId, {
      $pull: { pushSubscriptions: { endpoint: { $in: invalidEndpoints } } },
    });
  }

  return {
    success: failed === 0,
    delivered,
    failed,
    message: `Delivered ${delivered}, failed ${failed}`,
  };
}

export const pushNotificationService = {
  async sendToUsers(
    userIds: Array<string | Types.ObjectId>,
    payload: PushNotificationPayload
  ): Promise<PushNotificationResult> {
    let delivered = 0;
    let failed = 0;

    for (const userId of userIds) {
      const result = await sendPushToUser(userId, payload);
      delivered += result.delivered;
      failed += result.failed;
    }

    return {
      success: failed === 0,
      delivered,
      failed,
      message: `Delivered ${delivered}, failed ${failed}`,
    };
  },
};
