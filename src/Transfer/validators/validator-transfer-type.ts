import { body, query, ValidationChain } from 'express-validator';

export const validateCreateTransferType = (): ValidationChain[] => [
  body('typeName')
    .trim()
    .notEmpty()
    .withMessage('Type name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Type name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('transferFee')
    .notEmpty()
    .withMessage('Transfer fee is required')
    .isFloat({ min: 0 })
    .withMessage('Transfer fee must be a positive number'),
];

export const validateUpdateTransferType = (): ValidationChain[] => [
  body('typeName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Type name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('transferFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transfer fee must be a positive number'),

  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
];

export const validateGetTransferTypes = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),

  query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),

  query('minFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum fee must be a positive number'),

  query('maxFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum fee must be a positive number'),

  query('sortBy')
    .optional()
    .isIn(['typeName', 'transferFee', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
];

export const validateCalculateFee = (): ValidationChain[] => [
  query('propertyValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Property value must be a positive number'),

  query('applyDiscount').optional().isBoolean().withMessage('Apply discount must be a boolean'),

  query('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
];

export const validateBulkUpdateStatus = (): ValidationChain[] => [
  body('transferTypeIds')
    .notEmpty()
    .withMessage('Transfer type IDs are required')
    .isArray()
    .withMessage('Transfer type IDs must be an array')
    .custom(ids => ids.length > 0)
    .withMessage('Transfer type IDs array must not be empty')
    .custom(ids => ids.every((id: string) => typeof id === 'string'))
    .withMessage('All transfer type IDs must be strings'),

  body('isActive')
    .notEmpty()
    .withMessage('Status is required')
    .isBoolean()
    .withMessage('Status must be a boolean'),
];

export const validateUpdateFeesPercentage = (): ValidationChain[] => [
  body('percentage')
    .notEmpty()
    .withMessage('Percentage is required')
    .isFloat({ min: -100, max: 100 })
    .withMessage('Percentage must be between -100 and 100'),
];
