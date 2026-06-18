import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { privacyController } from '../controllers/controller-privacy';
import {
  validateGetAccessLog,
  validateGetMemberSettings,
  validateUpdateConsent,
  validateUpdatePrivacySettings,
} from '../validator/validator-privacy';

const router: Router = Router();

// Get own privacy settings
router.get('/settings', authenticate, privacyController.getSettings);

// Update own privacy settings
router.put(
  '/settings',
  authenticate,
  validateUpdatePrivacySettings(),
  privacyController.updateSettings
);

// View who accessed your data
router.get(
  '/access-log',
  authenticate,
  validateGetAccessLog(),
  privacyController.getAccessLog
);

// Request data export
router.post('/export', authenticate, privacyController.requestDataExport);

// Request data deletion
router.post('/delete-request', authenticate, privacyController.requestDataDeletion);

// View consent history
router.get('/consents', authenticate, privacyController.getConsents);

// Update specific consent
router.put(
  '/consents/:consentType',
  authenticate,
  validateUpdateConsent(),
  privacyController.updateConsent
);

// Get society privacy score (admin only)
router.get(
  '/score',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  privacyController.getSocietyPrivacyScore
);

// Get any member's settings (admin only)
router.get(
  '/settings/:memberId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetMemberSettings(),
  privacyController.getMemberSettings
);

export default router;
