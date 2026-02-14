import { Router } from 'express';
import { authenticate } from '../../auth/middleware/auth';
import { notificationController } from '../controllers/controller-notification';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all as read
router.patch('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

export default router;
