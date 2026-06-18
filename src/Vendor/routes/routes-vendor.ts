import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { validateRequest } from '../../Complaint/middleware/validation.middleware';
import { vendorController } from '../controllers/controller-vendor';
import {
  validateCreateVendorProfile,
  validateUpdateVendorProfile,
  validateRateVendor,
  validateCreateWorkOrder,
  validateUpdateWorkOrder,
  validateSubmitBid,
  validateReviewBid,
  validateAwardWorkOrder,
  validateCompleteWorkOrder,
  validateCreateContract,
  validateUpdateContract,
  validateTerminateContract,
  validateRenewContract,
  validateAddPerformanceReview,
  validateCreateInvoice,
  validateRejectInvoice,
  validateMarkInvoicePaid,
  validateListQuery,
  validateIdParam,
} from '../validator/validator-vendor';

const router: Router = Router();

// ============ Vendor Profile Routes ============

// GET /vendors - List all vendors
router.get(
  '/vendors',
  authenticate,
  validateListQuery(),
  validateRequest,
  vendorController.getAllVendors
);

// GET /vendors/:id - Get vendor by ID
router.get(
  '/vendors/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  vendorController.getVendorById
);

// POST /vendors - Register vendor
router.post(
  '/vendors',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateVendorProfile(),
  validateRequest,
  vendorController.registerVendor
);

// PUT /vendors/:id - Update vendor
router.put(
  '/vendors/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateVendorProfile(),
  validateRequest,
  vendorController.updateVendor
);

// PATCH /vendors/:id/verify - Verify vendor
router.patch(
  '/vendors/:id/verify',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid vendor ID'),
  validateRequest,
  vendorController.verifyVendor
);

// PATCH /vendors/:id/suspend - Suspend vendor
router.patch(
  '/vendors/:id/suspend',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid vendor ID'),
  validateRequest,
  vendorController.suspendVendor
);

// POST /vendors/:id/rate - Rate vendor (any authenticated user)
router.post(
  '/vendors/:id/rate',
  authenticate,
  validateRateVendor(),
  validateRequest,
  vendorController.rateVendor
);

// ============ Work Order Routes ============

// GET /work-orders - List all work orders
router.get(
  '/work-orders',
  authenticate,
  validateListQuery(),
  validateRequest,
  vendorController.getAllWorkOrders
);

// GET /work-orders/:id - Get work order by ID
router.get(
  '/work-orders/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  vendorController.getWorkOrderById
);

// POST /work-orders - Create work order
router.post(
  '/work-orders',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateWorkOrder(),
  validateRequest,
  vendorController.createWorkOrder
);

// PUT /work-orders/:id - Update work order
router.put(
  '/work-orders/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateWorkOrder(),
  validateRequest,
  vendorController.updateWorkOrder
);

// DELETE /work-orders/:id - Delete work order
router.delete(
  '/work-orders/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid work order ID'),
  validateRequest,
  vendorController.deleteWorkOrder
);

// POST /work-orders/:id/bid - Submit bid (any authenticated user)
router.post(
  '/work-orders/:id/bid',
  authenticate,
  validateSubmitBid(),
  validateRequest,
  vendorController.submitBid
);

// PATCH /work-orders/:id/review-bid - Review bid
router.patch(
  '/work-orders/:id/review-bid',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateReviewBid(),
  validateRequest,
  vendorController.reviewBid
);

// PATCH /work-orders/:id/award - Award work order
router.patch(
  '/work-orders/:id/award',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateAwardWorkOrder(),
  validateRequest,
  vendorController.awardWorkOrder
);

// PATCH /work-orders/:id/complete - Complete work order
router.patch(
  '/work-orders/:id/complete',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCompleteWorkOrder(),
  validateRequest,
  vendorController.completeWorkOrder
);

// ============ Contract Routes ============

// GET /vendor-contracts - List all contracts
router.get(
  '/vendor-contracts',
  authenticate,
  validateListQuery(),
  validateRequest,
  vendorController.getAllContracts
);

// GET /vendor-contracts/:id - Get contract by ID
router.get(
  '/vendor-contracts/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  vendorController.getContractById
);

// POST /vendor-contracts - Create contract
router.post(
  '/vendor-contracts',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateContract(),
  validateRequest,
  vendorController.createContract
);

// PUT /vendor-contracts/:id - Update contract
router.put(
  '/vendor-contracts/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateUpdateContract(),
  validateRequest,
  vendorController.updateContract
);

// PATCH /vendor-contracts/:id/terminate - Terminate contract
router.patch(
  '/vendor-contracts/:id/terminate',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateTerminateContract(),
  validateRequest,
  vendorController.terminateContract
);

// PATCH /vendor-contracts/:id/renew - Renew contract
router.patch(
  '/vendor-contracts/:id/renew',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRenewContract(),
  validateRequest,
  vendorController.renewContract
);

// POST /vendor-contracts/:id/review - Add performance review
router.post(
  '/vendor-contracts/:id/review',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateAddPerformanceReview(),
  validateRequest,
  vendorController.addPerformanceReview
);

// ============ Invoice Routes ============

// GET /vendor-invoices - List all invoices
router.get(
  '/vendor-invoices',
  authenticate,
  validateListQuery(),
  validateRequest,
  vendorController.getAllInvoices
);

// GET /vendor-invoices/:id - Get invoice by ID
router.get(
  '/vendor-invoices/:id',
  authenticate,
  validateIdParam(),
  validateRequest,
  vendorController.getInvoiceById
);

// POST /vendor-invoices - Submit invoice (any authenticated user)
router.post(
  '/vendor-invoices',
  authenticate,
  validateCreateInvoice(),
  validateRequest,
  vendorController.submitInvoice
);

// PATCH /vendor-invoices/:id/approve - Approve invoice
router.patch(
  '/vendor-invoices/:id/approve',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  validateRequest,
  vendorController.approveInvoice
);

// PATCH /vendor-invoices/:id/reject - Reject invoice
router.patch(
  '/vendor-invoices/:id/reject',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRejectInvoice(),
  validateRequest,
  vendorController.rejectInvoice
);

// PATCH /vendor-invoices/:id/pay - Mark invoice as paid
router.patch(
  '/vendor-invoices/:id/pay',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateMarkInvoicePaid(),
  validateRequest,
  vendorController.markInvoicePaid
);

export default router;
