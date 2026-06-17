import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { subscriptionController } from '../controllers/controller-subscription';
import {
  validateCancelSubscription,
  validateCreatePackage,
  validateGetHistory,
  validateGetPackages,
  validatePackageIdParam,
  validateSubscribe,
  validateUpdatePackage,
} from '../validators/validator-subscription';

const router: Router = Router();

// ========================
// PACKAGE ROUTES
// ========================

// Get active packages (public)
router.get(
  '/packages/active',
  subscriptionController.getActivePackages
);

// List all packages (with pagination/search)
router.get(
  '/packages',
  validateGetPackages(),
  validateRequest,
  subscriptionController.getPackages
);

// Get package by ID
router.get(
  '/packages/:id',
  validatePackageIdParam(),
  validateRequest,
  subscriptionController.getPackage
);

// Create package (SUPER_ADMIN only)
router.post(
  '/packages',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validateCreatePackage(),
  validateRequest,
  subscriptionController.createPackage
);

// Update package (SUPER_ADMIN only)
router.put(
  '/packages/:id',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validateUpdatePackage(),
  validateRequest,
  subscriptionController.updatePackage
);

// Delete package (SUPER_ADMIN only)
router.delete(
  '/packages/:id',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validatePackageIdParam(),
  validateRequest,
  subscriptionController.deletePackage
);

// ========================
// SUBSCRIPTION MANAGEMENT ROUTES
// ========================

// Subscribe society to a package (ADMIN, SUPER_ADMIN)
router.post(
  '/subscribe',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateSubscribe(),
  validateRequest,
  subscriptionController.subscribeSociety
);

// Get subscription history for a society
router.get(
  '/history/:societyId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetHistory(),
  validateRequest,
  subscriptionController.getSubscriptionHistory
);

// Cancel subscription for a society
router.post(
  '/cancel/:societyId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCancelSubscription(),
  validateRequest,
  subscriptionController.cancelSubscription
);

export default router;
