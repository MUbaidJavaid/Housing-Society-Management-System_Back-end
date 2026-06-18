import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { customFormController } from '../controllers/controller-custom-form';
import {
  validateCreateCustomForm,
  validateEntityType,
  validateGetCustomForms,
  validateMetadata,
  validateReorder,
  validateUpdateCustomForm,
} from '../validator/validator-custom-form';

const router: Router = Router();

// GET / - List all custom form definitions (authenticated)
router.get(
  '/',
  authenticate,
  validateGetCustomForms(),
  validateRequest,
  customFormController.getAll
);

// GET /entity-types - Get supported entity types (authenticated)
router.get(
  '/entity-types',
  authenticate,
  customFormController.getEntityTypes
);

// GET /entity/:entityType - Get fields for entity type (authenticated)
router.get(
  '/entity/:entityType',
  authenticate,
  validateEntityType(),
  validateRequest,
  customFormController.getByEntity
);

// GET /:id - Get single custom form field (authenticated)
router.get(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid Custom Form ID'),
  validateRequest,
  customFormController.getById
);

// POST / - Create custom form field (ADMIN, SUPER_ADMIN)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateCustomForm(),
  validateRequest,
  customFormController.create
);

// PUT /:id - Update custom form field (ADMIN, SUPER_ADMIN)
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateCustomForm(),
  validateRequest,
  customFormController.update
);

// DELETE /:id - Soft delete custom form field (ADMIN, SUPER_ADMIN)
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Custom Form ID'),
  validateRequest,
  customFormController.delete
);

// POST /reorder - Reorder fields (ADMIN, SUPER_ADMIN)
router.post(
  '/reorder',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateReorder(),
  validateRequest,
  customFormController.reorder
);

// POST /validate - Validate metadata against definitions (authenticated)
router.post(
  '/validate',
  authenticate,
  validateMetadata(),
  validateRequest,
  customFormController.validateMetadata
);

export default router;
