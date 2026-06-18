import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { smsController } from '../controllers/controller-sms';

const router: Router = Router();

// Send single SMS - admin only
router.post(
  '/send',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  smsController.sendSMS
);

// Send bulk SMS - admin only
router.post(
  '/send-bulk',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  smsController.sendBulkSMS
);

// Get SMS logs - admin only
router.get(
  '/logs',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  smsController.getSMSLogs
);

// Get SMS stats - admin only
router.get(
  '/stats',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  smsController.getSMSStats
);

export default router;
