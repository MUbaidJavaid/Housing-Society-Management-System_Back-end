import { body, query, ValidationChain } from 'express-validator';

export const validateCreateInstallmentPlanDetail = (): ValidationChain[] => [
  body('planId')
    .notEmpty()
    .withMessage('Plan is required')
    .isMongoId()
    .withMessage('Invalid Plan ID'),

  body('instCatId')
    .notEmpty()
    .withMessage('Installment category is required')
    .isMongoId()
    .withMessage('Invalid Installment Category ID'),

  body('occurrence')
    .notEmpty()
    .withMessage('Occurrence is required')
    .isInt({ min: 1 })
    .withMessage('Occurrence must be at least 1'),

  body('percentageAmount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100'),

  body('fixedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed amount must be a positive number'),
];

export const validateBulkInstallmentPlanDetails = (): ValidationChain[] => [
  body('planId')
    .notEmpty()
    .withMessage('Plan ID is required')
    .isMongoId()
    .withMessage('Invalid Plan ID'),

  body('details')
    .isArray()
    .withMessage('Details must be an array')
    .custom((value: any[]) => value.length > 0)
    .withMessage('Details array cannot be empty'),

  body('details.*.instCatId')
    .notEmpty()
    .withMessage('Installment category is required')
    .isMongoId()
    .withMessage('Invalid Installment Category ID'),

  body('details.*.occurrence')
    .notEmpty()
    .withMessage('Occurrence is required')
    .isInt({ min: 1 })
    .withMessage('Occurrence must be at least 1'),

  body('details.*.percentageAmount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100'),

  body('details.*.fixedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed amount must be a positive number'),
];

export const validateUpdateInstallmentPlanDetail = (): ValidationChain[] => [
  body('occurrence')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Occurrence must be at least 1'),

  body('percentageAmount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100'),

  body('fixedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed amount must be a positive number'),
];

export const validateGetInstallmentPlanDetails = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('planId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Plan ID'),

  query('instCatId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Installment Category ID'),

  query('occurrence')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Occurrence must be a positive integer'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must be at least 1 character'),

  query('sortBy')
    .optional()
    .isIn(['occurrence', 'percentageAmount', 'fixedAmount', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
];

export const validateSearchInstallmentPlanDetails = (): ValidationChain[] => [
  query('q')
    .notEmpty()
    .withMessage('Search term is required')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must be at least 1 character'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];
