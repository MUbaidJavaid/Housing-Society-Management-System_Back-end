import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { workflowController } from '../controllers/controller-workflow';
import {
  validateCreateWorkflow,
  validateUpdateWorkflow,
  validateGetWorkflows,
  validateGetWorkflowById,
  validateDeleteWorkflow,
  validateCreateInstance,
  validateGetInstances,
  validateGetInstance,
  validateApproveRejectStep,
} from '../validator/validator-workflow';

const router: Router = Router();

// Instance routes (must come before /:id to avoid conflicts)
router.get(
  '/instances/:instanceId',
  authenticate,
  validateGetInstance,
  workflowController.getInstance
);

router.post(
  '/instances/:instanceId/approve',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateApproveRejectStep,
  workflowController.approveStep
);

router.post(
  '/instances/:instanceId/reject',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateApproveRejectStep,
  workflowController.rejectStep
);

// Workflow CRUD routes
router.get(
  '/',
  authenticate,
  validateGetWorkflows,
  workflowController.getAll
);

router.get(
  '/:id',
  authenticate,
  validateGetWorkflowById,
  workflowController.getById
);

router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateWorkflow,
  workflowController.create
);

router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateWorkflow,
  workflowController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validateDeleteWorkflow,
  workflowController.delete
);

// Workflow instance routes (nested under workflow)
router.get(
  '/:id/instances',
  authenticate,
  validateGetInstances,
  workflowController.getInstances
);

router.post(
  '/:id/instances',
  authenticate,
  validateCreateInstance,
  workflowController.createInstance
);

export default router;
