import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { lookupValueController } from '../controllers/controller-lookup-value';
import {
  validateCreateLookupValue,
  validateGetLookupValues,
  validateReorderLookupValues,
  validateUpdateLookupValue,
} from '../validator/validator-lookup-value';

const router: Router = Router();

// Authenticated routes (any logged-in user can read)
router.get('/', authenticate, validateGetLookupValues, lookupValueController.getAll);

router.get('/category/:category', authenticate, lookupValueController.getByCategory);

router.get('/:id', authenticate, lookupValueController.getById);

// Admin routes
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateLookupValue,
  lookupValueController.create
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateLookupValue,
  lookupValueController.update
);

// Super admin only
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  lookupValueController.delete
);

router.post(
  '/reorder',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateReorderLookupValues,
  lookupValueController.reorder
);

router.post(
  '/seed',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  lookupValueController.seed
);

export default router;
