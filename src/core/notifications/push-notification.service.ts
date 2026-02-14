import { logger } from '../../logger';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  tokens?: string[];
  topic?: string;
}

export interface PushNotificationResult {
  success: boolean;
  message: string;
}

export const pushNotificationService = {
  async sendToUsers(
    userIds: string[],
    payload: PushNotificationPayload
  ): Promise<PushNotificationResult> {
    if (!userIds.length) {
      return { success: true, message: 'No target users to notify' };
    }

    logger.info('Push notification stub invoked', {
      userCount: userIds.length,
      payload,
    });

    return { success: true, message: 'Push notification queued (stub)' };
  },
};

export type FirebaseMessagingLike = {
  send: (message: Record<string, any>) => Promise<string>;
  sendMulticast: (message: Record<string, any>) => Promise<Record<string, any>>;
};

export async function sendFirebasePushExample(
  messaging: FirebaseMessagingLike,
  payload: PushNotificationPayload
): Promise<Record<string, any> | string> {
  const messageBase = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
  };

  if (payload.tokens && payload.tokens.length > 0) {
    return messaging.sendMulticast({
      ...messageBase,
      tokens: payload.tokens,
    });
  }

  if (payload.topic) {
    return messaging.send({
      ...messageBase,
      topic: payload.topic,
    });
  }

  throw new Error('Firebase push requires tokens or a topic');
}
