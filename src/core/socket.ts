import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import config from '../config';
import { logger } from '../logger';

let io: SocketIOServer | null = null;

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
    const rawUserId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    if (userId) {
      const roomId = String(userId);
      socket.join(roomId);
      socket.data.userId = roomId;
      logger.info(`Socket connected: ${socket.id} user=${roomId}`);
    } else {
      logger.warn(`Socket connected without userId: ${socket.id}`);
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
