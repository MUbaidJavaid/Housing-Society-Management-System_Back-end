import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { complaintController } from '../index-complaint';
import {
  validateAddAttachment,
  validateAssignComplaint,
  validateBulkStatusUpdate,
  validateCreateComplaint,
  validateEscalateComplaint,
  validateGetComplaints,
  validateRemoveAttachment,
  validateResolveComplaint,
  validateUpdateComplaint,
} from '../validators/validator-complaint';

// Create a local validateRequest function to avoid circular dependencies
import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    const formattedErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');
    const error = new Error(`Validation failed: ${formattedErrors}`);
    (error as any).statusCode = 400;
    throw error;
  }
  next();
};

const router: Router = Router();

// Public routes (read-only)
router.get('/', validateGetComplaints(), validateRequest, complaintController.getComplaints);

router.get('/statistics', complaintController.getComplaintStatistics);

router.get('/dashboard-stats', complaintController.getDashboardStats);

router.get('/overdue', complaintController.getOverdueComplaints);

router.get('/follow-up-needed', complaintController.getComplaintsNeedingFollowUp);

router.get(
  '/member/:memberId',
  param('memberId').isMongoId().withMessage('Invalid Member ID'),
  validateRequest,
  complaintController.getComplaintsByMember
);

router.get(
  '/member/:memberId/summary',
  param('memberId').isMongoId().withMessage('Invalid Member ID'),
  validateRequest,
  complaintController.getMemberComplaintSummary
);

router.get(
  '/file/:fileId',
  param('fileId').isMongoId().withMessage('Invalid File ID'),
  validateRequest,
  complaintController.getComplaintsByFile
);

router.get(
  '/staff/:staffId',
  param('staffId').isMongoId().withMessage('Invalid Staff ID'),
  validateRequest,
  complaintController.getComplaintsByAssignedStaff
);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid Complaint ID'),
  validateRequest,
  complaintController.getComplaint
);

// Protected routes (members can create complaints)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateComplaint(),
  validateRequest,
  complaintController.createComplaint
);

// Protected routes (staff and above)
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateComplaint(),
  validateRequest,
  complaintController.updateComplaint
);

router.patch(
  '/:id/assign',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateAssignComplaint(),
  validateRequest,
  complaintController.assignComplaint
);

router.patch(
  '/:id/resolve',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateResolveComplaint(),
  validateRequest,
  complaintController.resolveComplaint
);

router.patch(
  '/:id/escalate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateEscalateComplaint(),
  validateRequest,
  complaintController.escalateComplaint
);

router.patch(
  '/:id/add-attachment',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateAddAttachment(),
  validateRequest,
  complaintController.addAttachment
);

router.patch(
  '/:id/remove-attachment',
  authenticate,
  requireRole(UserRole.MEMBER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRemoveAttachment(),
  validateRequest,
  complaintController.removeAttachment
);

// Protected routes (admin only)
router.post(
  '/bulk-status',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBulkStatusUpdate(),
  validateRequest,
  complaintController.bulkUpdateComplaintStatus
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid Complaint ID'),
  validateRequest,
  complaintController.deleteComplaint
);

export default router;
