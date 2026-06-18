import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { paymentGatewayService } from '../services/service-payment-gateway';
import { PaymentQueryParams } from '../types/types-payment-gateway';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const paymentGatewayController = {
  /**
   * Initiate a new payment
   */
  initiatePayment: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const result = await paymentGatewayService.initiatePayment(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Payment initiated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Handle JazzCash callback/webhook
   */
  handleJazzCashCallback: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transaction = await paymentGatewayService.handleCallback('jazzcash', req.body);

      res.json({
        success: true,
        data: transaction,
        message: 'JazzCash callback processed',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Handle Easypaisa callback/webhook
   */
  handleEasypaisaCallback: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transaction = await paymentGatewayService.handleCallback('easypaisa', req.body);

      res.json({
        success: true,
        data: transaction,
        message: 'Easypaisa callback processed',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Verify a transaction by its transaction ID
   */
  verifyTransaction: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const transactionId = req.params.transactionId as string;
      const transaction = await paymentGatewayService.verifyTransaction(transactionId);

      if (!transaction) {
        throw new AppError(404, 'Transaction not found');
      }

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all transactions with filters and pagination
   */
  getTransactions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const queryParams: PaymentQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        societyId: req.query.societyId as string,
        memberId: req.query.memberId as string,
        status: req.query.status as string,
        gateway: req.query.gateway as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await paymentGatewayService.getTransactions(queryParams);

      res.json({
        success: true,
        data: {
          transactions: result.transactions,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get a single transaction by ID
   */
  getTransactionById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const transaction = await paymentGatewayService.getTransactionById(id);

      if (!transaction) {
        throw new AppError(404, 'Transaction not found');
      }

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Refund a transaction
   */
  refundTransaction: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { amount, reason } = req.body;

      const transaction = await paymentGatewayService.refundTransaction(
        id,
        amount,
        reason,
        req.user.userId
      );

      res.json({
        success: true,
        data: transaction,
        message: 'Transaction refunded successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get payment statistics for a society
   */
  getPaymentStats: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const stats = await paymentGatewayService.getPaymentStats(societyId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
