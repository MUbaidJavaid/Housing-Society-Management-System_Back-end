import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';

import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { announcementController } from '../index-announcement';
import {
  validateAuthorIdParam,
  validateCategoryIdParam,
  validateCreateAnnouncement,
  validateGetActiveAnnouncements,
  validateGetAnnouncements,
  validatePublishAnnouncement,
  validateUpdateAnnouncement,
} from '../validators/validator-announcement';

const router: Router = Router();

// Public routes
router.get(
  '/',
  validateGetAnnouncements(),
  validateRequest,
  announcementController.getAnnouncements
);

router.get('/statistics', announcementController.getAnnouncementStatistics);

router.get('/authors', announcementController.getAvailableAuthors);

router.get(
  '/active',
  validateGetActiveAnnouncements(),
  validateRequest,
  announcementController.getActiveAnnouncements
);

router.get('/urgent', announcementController.getUrgentAnnouncements);

router.get('/recent', announcementController.getRecentAnnouncements);

router.get('/search', announcementController.searchAnnouncements);

router.get('/timeline', announcementController.getAnnouncementTimeline);

router.get('/expired', announcementController.getExpiredAnnouncements);

router.get(
  '/category/:categoryId',
  validateCategoryIdParam(),
  validateRequest,
  announcementController.getAnnouncementsByCategory
);

router.get(
  '/author/:authorId',
  validateAuthorIdParam(),
  validateRequest,
  announcementController.getAnnouncementsByAuthor
);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid Announcement ID'),
  validateRequest,
  announcementController.getAnnouncement
);

// Protected routes
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateAnnouncement(),
  validateRequest,
  announcementController.createAnnouncement
);

router.post(
  '/bulk-update-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest,
  announcementController.bulkUpdateAnnouncementStatus
);

router.post(
  '/:id/send-push-notification',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Announcement ID'),
  validateRequest,
  announcementController.sendPushNotification
);

router.post(
  '/:id/renew',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Announcement ID'),
  validateRequest,
  announcementController.renewAnnouncement
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateAnnouncement(),
  validateRequest,
  announcementController.updateAnnouncement
);

router.patch(
  '/:id/publish',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Announcement ID'),
  validatePublishAnnouncement(),
  validateRequest,
  announcementController.publishAnnouncement
);

router.patch(
  '/:id/archive',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Announcement ID'),
  validateRequest,
  announcementController.archiveAnnouncement
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Announcement ID'),
  validateRequest,
  announcementController.deleteAnnouncement
);

export default router;
