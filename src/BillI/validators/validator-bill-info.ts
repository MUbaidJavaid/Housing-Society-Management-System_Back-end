import { body, param, query, ValidationChain } from 'express-validator';
import { BillStatus, BillType } from '../models/models-bill-info';

export const validateCreateBillInfo = (): ValidationChain[] => [
  body('billNo')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Bill number must be between 5 and 50 characters')
    .matches(/^[A-Z0-9\-_\/]+$/)
    .withMessage(
      'Bill number can only contain uppercase letters, numbers, hyphens, underscores, and slashes'
    ),

  body('billType')
    .notEmpty()
    .withMessage('Bill type is required')
    .isIn(Object.values(BillType))
    .withMessage('Invalid bill type'),

  body('fileId')
    .trim()
    .notEmpty()
    .withMessage('File ID is required')
    .isMongoId()
    .withMessage('Invalid File ID'),

  body('memId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('billMonth')
    .trim()
    .notEmpty()
    .withMessage('Bill month is required')
    .matches(/^[A-Za-z]+ \d{4}$/)
    .withMessage('Bill month must be in format "Month Year" (e.g., "January 2026")'),

  body('previousReading')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Previous reading must be a positive number'),

  body('currentReading')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current reading must be a positive number'),

  body('billAmount')
    .notEmpty()
    .withMessage('Bill amount is required')
    .isFloat({ min: 0 })
    .withMessage('Bill amount must be a positive number'),

  body('fineAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fine amount must be a positive number'),

  body('arrears').optional().isFloat({ min: 0 }).withMessage('Arrears must be a positive number'),

  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Please provide a valid due date'),

  body('gracePeriodDays')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Grace period days must be between 0 and 30'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),

  // Custom validation for readings
  body().custom((_value, { req }) => {
    if (req.body.currentReading !== undefined && req.body.previousReading !== undefined) {
      if (req.body.currentReading < req.body.previousReading) {
        throw new Error('Current reading must be greater than or equal to previous reading');
      }
    }

    // Validate that at least one area measurement is provided for utility bills
    if (
      req.body.billType &&
      (req.body.billType === BillType.ELECTRICITY || req.body.billType === BillType.WATER)
    ) {
      if (req.body.currentReading === undefined || req.body.previousReading === undefined) {
        throw new Error('Current and previous readings are required for utility bills');
      }
    }

    return true;
  }),
];

export const validateUpdateBillInfo = (): ValidationChain[] => [
  body('previousReading')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Previous reading must be a positive number'),

  body('currentReading')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current reading must be a positive number'),

  body('billAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bill amount must be a positive number'),

  body('fineAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fine amount must be a positive number'),

  body('arrears').optional().isFloat({ min: 0 }).withMessage('Arrears must be a positive number'),

  body('dueDate').optional().isISO8601().withMessage('Please provide a valid due date'),

  body('gracePeriodDays')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Grace period days must be between 0 and 30'),

  body('status').optional().isIn(Object.values(BillStatus)).withMessage('Invalid bill status'),

  body('paymentDate').optional().isISO8601().withMessage('Please provide a valid payment date'),

  body('paymentMethod')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Payment method cannot exceed 50 characters'),

  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID cannot exceed 100 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),

  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
];

export const validateGetBills = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('memId').optional().isMongoId().withMessage('Invalid Member ID'),

  query('fileId').optional().isMongoId().withMessage('Invalid File ID'),

  query('billType').optional().isIn(Object.values(BillType)).withMessage('Invalid bill type'),

  query('status').optional().isIn(Object.values(BillStatus)).withMessage('Invalid bill status'),

  query('billMonth')
    .optional()
    .matches(/^[A-Za-z]+ \d{4}$/)
    .withMessage('Bill month must be in format "Month Year"'),

  query('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear()}`),

  query('isOverdue').optional().isBoolean().withMessage('Is overdue must be a boolean'),

  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),

  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number'),

  query('sortBy')
    .optional()
    .isIn([
      'createdAt',
      'updatedAt',
      'dueDate',
      'billAmount',
      'totalPayable',
      'status',
      'billMonth',
    ])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
];

export const validateRecordPayment = (): ValidationChain[] => [
  body('paymentAmount')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isFloat({ min: 0 })
    .withMessage('Payment amount must be a positive number'),

  body('paymentDate')
    .notEmpty()
    .withMessage('Payment date is required')
    .isISO8601()
    .withMessage('Please provide a valid payment date'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Payment method must be between 2 and 50 characters'),

  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID cannot exceed 100 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const validateGenerateBills = (): ValidationChain[] => [
  body('memberIds')
    .notEmpty()
    .withMessage('Member IDs are required')
    .isArray()
    .withMessage('Member IDs must be an array')
    .custom(ids => ids.length > 0)
    .withMessage('Member IDs array must not be empty')
    .custom(ids => ids.every((id: string) => typeof id === 'string'))
    .withMessage('All member IDs must be strings'),

  body('billType')
    .notEmpty()
    .withMessage('Bill type is required')
    .isIn(Object.values(BillType))
    .withMessage('Invalid bill type'),

  body('billMonth')
    .trim()
    .notEmpty()
    .withMessage('Bill month is required')
    .matches(/^[A-Za-z]+ \d{4}$/)
    .withMessage('Bill month must be in format "Month Year" (e.g., "January 2026")'),

  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Please provide a valid due date'),

  body('gracePeriodDays')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Grace period days must be between 0 and 30'),

  body('templateData').optional().isObject().withMessage('Template data must be an object'),
];

export const validateBillNoParam = (): ValidationChain[] => [
  param('billNo')
    .trim()
    .notEmpty()
    .withMessage('Bill number is required')
    .isLength({ min: 5, max: 50 })
    .withMessage('Bill number must be between 5 and 50 characters')
    .matches(/^[A-Z0-9\-_\/]+$/)
    .withMessage(
      'Bill number can only contain uppercase letters, numbers, hyphens, underscores, and slashes'
    ),
];

export const validateMemIdParam = (): ValidationChain[] => [
  param('memId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),
];

export const validateFileIdParam = (): ValidationChain[] => [
  param('fileId')
    .trim()
    .notEmpty()
    .withMessage('File ID is required')
    .isMongoId()
    .withMessage('Invalid File ID'),
];
