import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { paymentModeController } from '../controllers/controller-paymentmodule';
import {
  validateCreatePaymentMode,
  validateGetPaymentModes,
  validateUpdatePaymentMode,
} from '../validators/validator-paymentmodule';

const router: Router = Router();

// Public routes
router.get('/', validateGetPaymentModes(), paymentModeController.getPaymentModes);
router.get('/summary', paymentModeController.getPaymentModeSummary);
router.get('/dropdown', paymentModeController.getPaymentModesForDropdown);
router.get('/defaults', paymentModeController.getDefaultPaymentModes);
router.get('/:id', paymentModeController.getPaymentMode);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreatePaymentMode(),
  paymentModeController.createPaymentMode
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdatePaymentMode(),
  paymentModeController.updatePaymentMode
);

router.patch(
  '/:id/toggle-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  paymentModeController.togglePaymentModeStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  paymentModeController.deletePaymentMode
);

export default router;
