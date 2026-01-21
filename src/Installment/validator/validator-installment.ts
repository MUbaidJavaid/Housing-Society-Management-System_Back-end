import { body, param, query, ValidationChain } from 'express-validator';
import { InstallmentType, InstallmentStatus } from '../index-installment';

export const validateCreateInstallment = (): ValidationChain[] => [
  body('memID')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('plotID')
    .trim()
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID'),

  body('installmentNo')
    .isInt({ min: 1 })
    .withMessage('Installment Number must be a positive integer'),

  body('installmentType')
    .trim()
    .notEmpty()
    .withMessage('Installment Type is required')
    .isIn(Object.values(InstallmentType))
    .withMessage('Invalid Installment Type'),

  body('dueDate')
    .trim()
    .notEmpty()
    .withMessage('Due Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('amountDue').isFloat({ min: 0 }).withMessage('Amount Due must be a positive number'),

  body('amountPaid')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount Paid must be a positive number'),

  body('lateFeeSurcharge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Late Fee must be a positive number'),

  body('discountApplied')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),

  body('paidDate').optional().isISO8601().withMessage('Invalid date format'),

  body('paymentModeID').optional().isMongoId().withMessage('Invalid Payment Mode ID'),

  body('status').optional().isIn(Object.values(InstallmentStatus)).withMessage('Invalid Status'),

  body('installmentRemarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
];

export const validateUpdateInstallment = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Installment ID'),

  body('amountPaid')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount Paid must be a positive number'),

  body('lateFeeSurcharge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Late Fee must be a positive number'),

  body('discountApplied')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),

  body('paidDate').optional().isISO8601().withMessage('Invalid date format'),

  body('paymentModeID').optional().isMongoId().withMessage('Invalid Payment Mode ID'),

  body('status').optional().isIn(Object.values(InstallmentStatus)).withMessage('Invalid Status'),

  body('installmentRemarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
];

export const validateMakePayment = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Installment ID'),

  body('amountPaid').isFloat({ min: 0.01 }).withMessage('Valid payment amount is required'),

  body('lateFeeSurcharge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Late Fee must be a positive number'),

  body('discountApplied')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),

  body('paymentModeID')
    .trim()
    .notEmpty()
    .withMessage('Payment Mode is required')
    .isMongoId()
    .withMessage('Invalid Payment Mode ID'),

  body('paidDate')
    .trim()
    .notEmpty()
    .withMessage('Payment Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
];

export const validateGenerateInstallments = (): ValidationChain[] => [
  body('memberId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('plotId')
    .trim()
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID'),

  body('totalAmount').isFloat({ min: 0.01 }).withMessage('Valid Total Amount is required'),

  body('numberOfInstallments')
    .isInt({ min: 1 })
    .withMessage('Number of Installments must be a positive integer'),

  body('installmentType')
    .trim()
    .notEmpty()
    .withMessage('Installment Type is required')
    .isIn(Object.values(InstallmentType))
    .withMessage('Invalid Installment Type'),

  body('startDate')
    .trim()
    .notEmpty()
    .withMessage('Start Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
];

export const validateGetInstallments = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('status').optional().isIn(Object.values(InstallmentStatus)).withMessage('Invalid status'),

  query('installmentType')
    .optional()
    .isIn(Object.values(InstallmentType))
    .withMessage('Invalid installment type'),

  query('memID').optional().isMongoId().withMessage('Invalid Member ID'),

  query('plotID').optional().isMongoId().withMessage('Invalid Plot ID'),

  query('paymentModeID').optional().isMongoId().withMessage('Invalid Payment Mode ID'),

  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),

  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),

  query('dueDateStart').optional().isISO8601().withMessage('Invalid due date start format'),

  query('dueDateEnd').optional().isISO8601().withMessage('Invalid due date end format'),

  query('isOverdue').optional().isBoolean().withMessage('isOverdue must be boolean'),

  query('sortBy')
    .optional()
    .isIn(['installmentNo', 'dueDate', 'amountDue', 'createdAt', 'updatedAt', 'paidDate'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
