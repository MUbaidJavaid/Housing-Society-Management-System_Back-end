import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { pdfGeneratorController } from '../controllers/controller-pdf-generator';

const router: Router = Router();

// Generate receipt - any authenticated user
router.post(
  '/generate/receipt',
  authenticate,
  pdfGeneratorController.generateReceipt
);

// Generate invoice - any authenticated user
router.post(
  '/generate/invoice',
  authenticate,
  pdfGeneratorController.generateInvoice
);

// Generate PLRA certificate - admin only
router.post(
  '/generate/certificate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  pdfGeneratorController.generateCertificate
);

// Generate NOC - admin only
router.post(
  '/generate/noc',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  pdfGeneratorController.generateNOC
);

// Generate allotment letter - admin only
router.post(
  '/generate/allotment-letter',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  pdfGeneratorController.generateAllotmentLetter
);

// Generate membership form - admin only
router.post(
  '/generate/membership-form',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  pdfGeneratorController.generateMembershipForm
);

// Generate transfer form - admin only
router.post(
  '/generate/transfer-form',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  pdfGeneratorController.generateTransferForm
);

// Generate payment receipt - any authenticated user
router.post(
  '/generate/payment-receipt',
  authenticate,
  pdfGeneratorController.generatePaymentReceipt
);

// Generate installment schedule - any authenticated user
router.post(
  '/generate/installment-schedule',
  authenticate,
  pdfGeneratorController.generateInstallmentSchedule
);

// List available templates - any authenticated user
router.get(
  '/templates',
  authenticate,
  pdfGeneratorController.getTemplates
);

export default router;
