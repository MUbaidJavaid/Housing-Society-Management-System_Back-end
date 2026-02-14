import { body, param, query, ValidationChain } from 'express-validator';
import { DefaulterStatus } from '../models/models-defaulter';

export const validateCreateDefaulter = (): ValidationChain[] => [
  body('memId')
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

  body('fileId')
    .trim()
    .notEmpty()
    .withMessage('File ID is required')
    .isMongoId()
    .withMessage('Invalid File ID'),

  body('totalOverdueAmount')
    .notEmpty()
    .withMessage('Total overdue amount is required')
    .isFloat({ min: 0 })
    .withMessage('Total overdue amount must be a positive number'),

  body('lastPaymentDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid last payment date'),

  body('noticeSentCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Notice sent count must be a non-negative integer'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),
];

export const validateUpdateDefaulter = (): ValidationChain[] => [
  body('totalOverdueAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total overdue amount must be a positive number'),

  body('lastPaymentDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid last payment date'),

  body('noticeSentCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Notice sent count must be a non-negative integer'),

  body('status').optional().isIn(Object.values(DefaulterStatus)).withMessage('Invalid status'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const validateGetDefaulters = (): ValidationChain[] => [
  query('search').optional().trim().isLength({ max: 200 }).withMessage('Search must be at most 200 characters'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('memId').optional().isMongoId().withMessage('Invalid Member ID'),

  query('plotId').optional().isMongoId().withMessage('Invalid Plot ID'),

  query('fileId').optional().isMongoId().withMessage('Invalid File ID'),

  query('status').optional().isIn(Object.values(DefaulterStatus)).withMessage('Invalid status'),

  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),

  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number'),

  query('minDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum days must be a non-negative integer'),

  query('maxDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum days must be a non-negative integer'),

  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),

  query('sortBy')
    .optional()
    .isIn([
      'createdAt',
      'updatedAt',
      'totalOverdueAmount',
      'daysOverdue',
      'noticeSentCount',
      'status',
    ])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
];

export const validateMemIdParam = (): ValidationChain[] => [
  param('memId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),
];

export const validatePlotIdParam = (): ValidationChain[] => [
  param('plotId')
    .trim()
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID'),
];

export const validateSendNotice = (): ValidationChain[] => [
  body('noticeType')
    .notEmpty()
    .withMessage('Notice type is required')
    .isIn(['WARNING', 'FINAL', 'LEGAL'])
    .withMessage('Notice type must be WARNING, FINAL, or LEGAL'),

  body('noticeContent')
    .notEmpty()
    .withMessage('Notice content is required')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Notice content must be between 10 and 2000 characters'),

  body('sendMethod')
    .notEmpty()
    .withMessage('Send method is required')
    .isIn(['EMAIL', 'SMS', 'LETTER', 'ALL'])
    .withMessage('Send method must be EMAIL, SMS, LETTER, or ALL'),
];

export const validateResolveDefaulter = (): ValidationChain[] => [
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

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
];

export const validateUpdateStatus = (): ValidationChain[] => [
  body('defaulterIds')
    .notEmpty()
    .withMessage('Defaulter IDs are required')
    .isArray()
    .withMessage('Defaulter IDs must be an array')
    .custom(ids => ids.length > 0)
    .withMessage('Defaulter IDs array must not be empty')
    .custom(ids => ids.every((id: string) => typeof id === 'string'))
    .withMessage('All Defaulter IDs must be strings'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(DefaulterStatus))
    .withMessage('Invalid status'),
];
