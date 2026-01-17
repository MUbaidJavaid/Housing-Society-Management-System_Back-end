import { Router } from 'express';
import { auditLogController } from '../controllers/controller';
import { authenticate, requireRole, UserRole } from '@/auth';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// User's own activity
router.get('/my-activity', auditLogController.getMyActivity);

// Admin-only routes
router.get('/', requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), auditLogController.getAuditLogs);

router.get(
  '/summary',
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  auditLogController.getAuditSummary
);

router.get(
  '/recent',
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  auditLogController.getRecentActivity
);

router.get('/entity/:entityType/:entityId', auditLogController.getEntityActivity);

export default router;
