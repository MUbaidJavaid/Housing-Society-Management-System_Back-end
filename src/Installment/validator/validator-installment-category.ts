  import { body, query, ValidationChain } from 'express-validator';

  export const validateCreateCategory = (): ValidationChain[] => [
    body('instCatName')
      .notEmpty()
      .withMessage('Category name is required')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),

    body('instCatDescription')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),

    body('isRefundable').optional().isBoolean().withMessage('Is refundable must be a boolean'),

    body('isMandatory').optional().isBoolean().withMessage('Is mandatory must be a boolean'),

    body('sequenceOrder')
      .notEmpty()
      .withMessage('Sequence order is required')
      .isInt({ min: 1 })
      .withMessage('Sequence order must be a positive integer'),

    body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  ];

  export const validateUpdateCategory = (): ValidationChain[] => [
    body('instCatName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),

    body('instCatDescription')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),

    body('isRefundable').optional().isBoolean().withMessage('Is refundable must be a boolean'),

    body('isMandatory').optional().isBoolean().withMessage('Is mandatory must be a boolean'),

    body('sequenceOrder')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Sequence order must be a positive integer'),

    body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  ];

  export const validateGetCategories = (): ValidationChain[] => [
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

    query('isRefundable').optional().isBoolean().withMessage('Is refundable must be a boolean'),

    query('isMandatory').optional().isBoolean().withMessage('Is mandatory must be a boolean'),

    query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),

    query('sortBy')
      .optional()
      .isIn(['instCatName', 'sequenceOrder', 'createdAt', 'updatedAt'])
      .withMessage('Invalid sort field'),

    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either "asc" or "desc"'),
  ];

  export const validateReorderCategories = (): ValidationChain[] => [
    body('categoryOrders')
      .isArray()
      .withMessage('Category orders must be an array')
      .custom((value: any[]) => value.length > 0)
      .withMessage('Category orders array cannot be empty'),

    body('categoryOrders.*.id')
      .notEmpty()
      .withMessage('Category ID is required')
      .isMongoId()
      .withMessage('Invalid Category ID'),

    body('categoryOrders.*.sequenceOrder')
      .notEmpty()
      .withMessage('Sequence order is required')
      .isInt({ min: 1 })
      .withMessage('Sequence order must be a positive integer'),
  ];

  export const validateSequenceOrder = (): ValidationChain[] => [
    query('sequenceOrder')
      .notEmpty()
      .withMessage('Sequence order is required')
      .isInt({ min: 1 })
      .withMessage('Sequence order must be a positive integer'),

    query('excludeId').optional().isMongoId().withMessage('Invalid exclude ID'),
  ];
