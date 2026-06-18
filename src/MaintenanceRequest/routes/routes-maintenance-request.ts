import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { maintenanceRequestController } from '../controllers/controller-maintenance-request';
import {
  validateCreateMaintenanceRequest,
  validateUpdateMaintenanceRequest,
  validateAssignStaff,
  validateAssignVendor,
  validateAddWorkLog,
  validateSubmitFeedback,
  validateRejectRequest,
  validateIdParam,
  validateListQuery,
} from '../validator/validator-maintenance-request';

const router: Router = Router();

// GET /my-requests - Get my requests (must be before /:id)
router.get(
  '/my-requests',
  authenticate,
  maintenanceRequestController.getMyRequests
);

// GET /assigned - Get assigned requests (must be before /:id)
router.get(
  '/assigned',
  authenticate,
  maintenanceRequestController.getAssignedRequests
);

// GET /overdue - Get overdue requests (must be before /:id)
router.get(
  '/overdue',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  maintenanceRequestController.getOverdueRequests
);

// GET /stats - Get maintenance stats (must be before /:id)
router.get(
  '/stats',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  maintenanceRequestController.getMaintenanceStats
);

// POST / - Create maintenance request
router.post(
  '/',
  authenticate,
  validateCreateMaintenanceRequest(),
  validateRequest,
  maintenanceRequestController.create
);

// GET / - List maintenance requests
router.get(
  '/',
  authenticate,
  validateListQuery(),
  validateRequest,
  maintenanceRequestController.getAll
);

// GET /:id - Get maintenance request by ID
router.get(
  '/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  maintenanceRequestController.getById
);

// PUT /:id - Update maintenance request
router.put(
  '/:id',
  authenticate,
  validateUpdateMaintenanceRequest(),
  validateRequest,
  maintenanceRequestController.update
);

// DELETE /:id - Delete maintenance request (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  maintenanceRequestController.delete
);

// POST /:id/acknowledge - Acknowledge request
router.post(
  '/:id/acknowledge',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  maintenanceRequestController.acknowledgeRequest
);

// POST /:id/assign-staff - Assign to staff
router.post(
  '/:id/assign-staff',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateAssignStaff(),
  validateRequest,
  maintenanceRequestController.assignToStaff
);

// POST /:id/assign-vendor - Assign to vendor
router.post(
  '/:id/assign-vendor',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateAssignVendor(),
  validateRequest,
  maintenanceRequestController.assignToVendor
);

// POST /:id/start - Start work
router.post(
  '/:id/start',
  authenticate,
  validateIdParam(),
  validateRequest,
  maintenanceRequestController.startWork
);

// POST /:id/work-log - Add work log
router.post(
  '/:id/work-log',
  authenticate,
  validateAddWorkLog(),
  validateRequest,
  maintenanceRequestController.addWorkLog
);

// POST /:id/complete - Complete work
router.post(
  '/:id/complete',
  authenticate,
  validateIdParam(),
  validateRequest,
  maintenanceRequestController.completeWork
);

// POST /:id/verify - Verify completion
router.post(
  '/:id/verify',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateIdParam(),
  validateRequest,
  maintenanceRequestController.verifyCompletion
);

// POST /:id/feedback - Submit feedback
router.post(
  '/:id/feedback',
  authenticate,
  validateSubmitFeedback(),
  validateRequest,
  maintenanceRequestController.submitFeedback
);

// POST /:id/reject - Reject request
router.post(
  '/:id/reject',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRejectRequest(),
  validateRequest,
  maintenanceRequestController.rejectRequest
);

export default router;
