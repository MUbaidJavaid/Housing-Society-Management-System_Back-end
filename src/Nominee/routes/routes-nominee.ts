import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { UserRole } from '../../database/models/User';
import { nomineeController } from '../controllers/controller-nominee';
import {
  validateBulkUpdateStatus,
  validateCreateNominee,
  validateGetNominees,
  validateMemIdParam,
  validateUpdateNominee,
} from '../validators/validator-nominee';

const router: Router = Router();

// Public routes
router.get('/statistics', nomineeController.getNomineeStatistics);
router.get('/summary', nomineeController.getNomineeSummary);
router.get('/share-distribution', nomineeController.getShareDistribution);
router.get('/members-without-coverage', nomineeController.getMembersWithoutFullCoverage);
router.get('/dropdown', nomineeController.getNomineesDropdown);
router.get('/search', nomineeController.searchNominees);

// Protected routes (Admin/Member Officer)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateNominee(),
  validateRequest,
  nomineeController.createNominee
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetNominees(),
  validateRequest,
  nomineeController.getNominees
);

router.get(
  '/cnic/:cnic',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  nomineeController.getNomineeByCNIC
);

router.get(
  '/member/:memId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateMemIdParam(),
  validateRequest,
  nomineeController.getNomineesByMember
);

router.get(
  '/member/:memId/coverage',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateMemIdParam(),
  validateRequest,
  nomineeController.getMemberShareCoverage
);

router.get(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Nominee ID'),
  validateRequest,
  nomineeController.getNominee
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Nominee ID'),
  validateUpdateNominee(),
  validateRequest,
  nomineeController.updateNominee
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Nominee ID'),
  validateRequest,
  nomineeController.deleteNominee
);

// Validation route
router.post(
  '/validate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  nomineeController.validateNomineeData
);

// Bulk operations
router.post(
  '/bulk/update-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkUpdateStatus(),
  validateRequest,
  nomineeController.bulkUpdateStatus
);

export default router;
