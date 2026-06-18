import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { paymentGatewayController } from '../controllers/controller-payment-gateway';
import {
  validateGetTransactions,
  validateInitiatePayment,
  validateRefund,
  validateVerifyTransaction,
} from '../validator/validator-payment-gateway';

const router: Router = Router();

// Authenticated routes
router.post(
  '/initiate',
  authenticate,
  validateInitiatePayment,
  paymentGatewayController.initiatePayment
);

// Webhook callbacks - NO auth (called by payment gateways)
router.post('/callback/jazzcash', paymentGatewayController.handleJazzCashCallback);
router.post('/callback/easypaisa', paymentGatewayController.handleEasypaisaCallback);

// Verify transaction
router.get(
  '/verify/:transactionId',
  authenticate,
  validateVerifyTransaction,
  paymentGatewayController.verifyTransaction
);

// List transactions
router.get(
  '/',
  authenticate,
  validateGetTransactions,
  paymentGatewayController.getTransactions
);

// Get payment stats - admin only
router.get(
  '/stats',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  paymentGatewayController.getPaymentStats
);

// Get single transaction by ID
router.get(
  '/:id',
  authenticate,
  paymentGatewayController.getTransactionById
);

// Refund transaction - admin only
router.post(
  '/:id/refund',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRefund,
  paymentGatewayController.refundTransaction
);

export default router;
