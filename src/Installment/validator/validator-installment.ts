import { body, query, ValidationChain } from 'express-validator';
import { InstallmentStatus, InstallmentType, PaymentMode } from '../models/models-installment';

export const validateCreateInstallment = (): ValidationChain[] => [
  body('fileId')
    .notEmpty()
    .withMessage('File ID is required')
    .isMongoId()
    .withMessage('Invalid File ID'),

  body('memId')
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('plotId')
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID'),

  body('installmentCategoryId')
    .notEmpty()
    .withMessage('Installment category is required')
    .isMongoId()
    .withMessage('Invalid Installment Category ID'),

  body('installmentNo')
    .notEmpty()
    .withMessage('Installment number is required')
    .isInt({ min: 1 })
    .withMessage('Installment number must be a positive integer'),

  body('installmentTitle')
    .notEmpty()
    .withMessage('Installment title is required')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Installment title must be between 2 and 200 characters'),

  body('installmentType')
    .notEmpty()
    .withMessage('Installment type is required')
    .isIn(Object.values(InstallmentType))
    .withMessage('Invalid installment type'),

  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('amountDue')
    .notEmpty()
    .withMessage('Amount due is required')
    .isFloat({ min: 0 })
    .withMessage('Amount due must be a positive number'),

  body('lateFeeSurcharge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Late fee surcharge must be a positive number'),

  body('installmentRemarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),
];

export const validateBulkInstallments = (): ValidationChain[] => [
  body('fileId')
    .notEmpty()
    .withMessage('File ID is required')
    .isMongoId()
    .withMessage('Invalid File ID'),

  body('memId')
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('plotId')
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID'),

  body('installmentCategoryId')
    .notEmpty()
    .withMessage('Installment category is required')
    .isMongoId()
    .withMessage('Invalid Installment Category ID'),

  body('installmentType')
    .notEmpty()
    .withMessage('Installment type is required')
    .isIn(Object.values(InstallmentType))
    .withMessage('Invalid installment type'),

  body('totalInstallments')
    .notEmpty()
    .withMessage('Total installments is required')
    .isInt({ min: 1, max: 360 })
    .withMessage('Total installments must be between 1 and 360'),

  body('amountPerInstallment')
    .notEmpty()
    .withMessage('Amount per installment is required')
    .isFloat({ min: 0 })
    .withMessage('Amount per installment must be a positive number'),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('frequency')
    .notEmpty()
    .withMessage('Frequency is required')
    .isIn(['monthly', 'quarterly', 'half-yearly', 'yearly'])
    .withMessage('Invalid frequency'),

  body('installmentTitle')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Installment title cannot exceed 200 characters'),
];

export const validateUpdateInstallment = (): ValidationChain[] => [
  body('installmentNo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Installment number must be a positive integer'),

  body('installmentTitle')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Installment title must be between 2 and 200 characters'),

  body('installmentType')
    .optional()
    .isIn(Object.values(InstallmentType))
    .withMessage('Invalid installment type'),

  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),

  body('amountDue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount due must be a positive number'),

  body('lateFeeSurcharge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Late fee surcharge must be a positive number'),

  body('amountPaid')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount paid must be a positive number'),

  body('paidDate').optional().isISO8601().withMessage('Invalid date format'),

  body('paymentMode')
    .optional()
    .isIn(Object.values(PaymentMode))
    .withMessage('Invalid payment mode'),

  body('transactionRefNo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction reference number cannot exceed 100 characters'),

  body('status').optional().isIn(Object.values(InstallmentStatus)).withMessage('Invalid status'),

  body('installmentRemarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),
];

export const validateRecordPayment = (): ValidationChain[] => [
  body('amountPaid')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isFloat({ min: 0 })
    .withMessage('Payment amount must be a positive number'),

  body('paidDate')
    .notEmpty()
    .withMessage('Payment date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('paymentMode')
    .notEmpty()
    .withMessage('Payment mode is required')
    .isIn(Object.values(PaymentMode))
    .withMessage('Invalid payment mode'),

  body('transactionRefNo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction reference number cannot exceed 100 characters'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
];

export const validateGetInstallments = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('fileId').optional().isMongoId().withMessage('Invalid File ID'),

  query('memId').optional().isMongoId().withMessage('Invalid Member ID'),

  query('plotId').optional().isMongoId().withMessage('Invalid Plot ID'),

  query('installmentCategoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Installment Category ID'),

  query('status').optional().isIn(Object.values(InstallmentStatus)).withMessage('Invalid status'),

  query('installmentType')
    .optional()
    .isIn(Object.values(InstallmentType))
    .withMessage('Invalid installment type'),

  query('paymentMode')
    .optional()
    .isIn(Object.values(PaymentMode))
    .withMessage('Invalid payment mode'),

  query('fromDate').optional().isISO8601().withMessage('Invalid from date format'),

  query('toDate').optional().isISO8601().withMessage('Invalid to date format'),

  query('overdue').optional().isBoolean().withMessage('Overdue must be a boolean'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),

  query('sortBy')
    .optional()
    .isIn(['dueDate', 'installmentNo', 'amountDue', 'createdAt', 'updatedAt', 'paidDate'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
];

export const validateReportParams = (): ValidationChain[] => [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date format'),

  query('fileId').optional().isMongoId().withMessage('Invalid File ID'),

  query('memId').optional().isMongoId().withMessage('Invalid Member ID'),

  query('plotId').optional().isMongoId().withMessage('Invalid Plot ID'),

  query('installmentCategoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Installment Category ID'),

  query('status').optional().isIn(Object.values(InstallmentStatus)).withMessage('Invalid status'),

  query('installmentType')
    .optional()
    .isIn(Object.values(InstallmentType))
    .withMessage('Invalid installment type'),
];

export const validateBulkUpdateStatus = (): ValidationChain[] => [
  body('installmentIds')
    .isArray()
    .withMessage('Installment IDs must be an array')
    .custom((value: any[]) => value.length > 0)
    .withMessage('Installment IDs array cannot be empty'),

  body('installmentIds.*').isMongoId().withMessage('Invalid Installment ID'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(InstallmentStatus))
    .withMessage('Invalid status'),
];

export const validatePaymentValidation = (): ValidationChain[] => [
  query('amount')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isFloat({ min: 0 })
    .withMessage('Payment amount must be a positive number'),
];
