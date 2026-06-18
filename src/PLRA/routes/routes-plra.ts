import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { plraController } from '../controllers/controller-plra';
import {
  validateGenerateCertificate,
  validateGetCertificates,
  validateGetCompliance,
  validateIdParam,
  validateQRCodeParam,
  validateRevokeCertificate,
  validateUpdateCertificate,
} from '../validator/validator-plra';

const router: Router = Router();

// Compliance dashboard
router.get(
  '/compliance',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetCompliance(),
  validateRequest,
  plraController.getComplianceDashboard
);

// Certificate routes
router.get(
  '/certificates',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetCertificates(),
  validateRequest,
  plraController.getCertificates
);

router.post(
  '/certificates/generate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGenerateCertificate(),
  validateRequest,
  plraController.generateCertificate
);

// Verify by QR code (accessible by authenticated users)
router.get(
  '/certificates/verify/:qrCode',
  authenticate,
  validateQRCodeParam(),
  validateRequest,
  plraController.verifyCertificate
);

router.get(
  '/certificates/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  plraController.getCertificateById
);

router.put(
  '/certificates/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateCertificate(),
  validateRequest,
  plraController.updateCertificate
);

router.post(
  '/certificates/:id/revoke',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validateRevokeCertificate(),
  validateRequest,
  plraController.revokeCertificate
);

router.post(
  '/certificates/:id/sync',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  plraController.syncCertificate
);

router.get(
  '/certificates/:id/sync-logs',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  plraController.getSyncLogs
);

export default router;
