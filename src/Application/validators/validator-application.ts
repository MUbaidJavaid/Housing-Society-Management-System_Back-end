import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateApplication = (): ValidationChain[] => [
  body('applicationTypeID')
    .trim()
    .notEmpty()
    .withMessage('Application Type is required')
    .isMongoId()
    .withMessage('Invalid Application Type ID'),

  body('memId')
    .trim()
    .notEmpty()
    .withMessage('Member is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('plotId').optional().isMongoId().withMessage('Invalid Plot ID'),

  body('applicationDate')
    .notEmpty()
    .withMessage('Application Date is required')
    .isISO8601()
    .withMessage('Invalid Application Date format'),

  body('statusId')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isMongoId()
    .withMessage('Invalid Status ID'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),

  body('attachmentPath').optional().isString().withMessage('Invalid attachment path'),
];

export const validateUpdateApplication = (): ValidationChain[] => [
  ...validateCreateApplication().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Application ID'),
];

export const validateGetApplications = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('applicationNo')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Application number is too long'),

  query('applicationTypeID').optional().isMongoId().withMessage('Invalid Application Type ID'),

  query('memId').optional().isMongoId().withMessage('Invalid Member ID'),

  query('plotId').optional().isMongoId().withMessage('Invalid Plot ID'),

  query('statusId').optional().isMongoId().withMessage('Invalid Status ID'),

  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),

  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),

  query('sortBy')
    .optional()
    .isIn(['applicationNo', 'applicationDate', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
