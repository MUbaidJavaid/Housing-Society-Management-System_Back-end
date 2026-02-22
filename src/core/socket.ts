import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import config from '../config';
import { logger } from '../logger';
import { jwtService } from '../auth/jwt';

let io: SocketIOServer | null = null;

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: string;
}

export function initializeSocket(server: HttpServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: config.cors || {
      origin: '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', socket => {
    let userId: string | null = null;

    // Prefer JWT from auth token
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.auth?.accessToken ||
      socket.handshake.query?.token;

    if (token && typeof token === 'string') {
      try {
        const decoded = jwtService.verifyAccessToken(token);
        userId = decoded.userId?.toString() || null;
      } catch {
        logger.warn(`Socket auth failed: invalid token ${socket.id}`);
      }
    }

    // Fallback to legacy userId
    if (!userId) {
      const raw = socket.handshake.auth?.userId || socket.handshake.query?.userId;
      userId = Array.isArray(raw) ? raw[0] : raw;
    }

    if (userId) {
      const roomId = `user_${userId}`;
      socket.join(roomId);
      socket.data.userId = userId;
      logger.info(`Socket connected: ${socket.id} user=${userId}`);
    } else {
      logger.warn(`Socket connected without auth: ${socket.id}`);
    }

    socket.on('disconnect', reason => {
      logger.info(`Socket disconnected: ${socket.id} reason=${reason}`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Emit notification to a user via socket (real-time in-app)
 */
export function emitNotificationToUser(
  userId: string,
  payload: NotificationPayload
): void {
  if (!io) return;
  const roomId = `user_${userId}`;
  io.to(roomId).emit('notification', payload);
  logger.debug(`Notification emitted to user ${userId}`, { title: payload.title });
}
