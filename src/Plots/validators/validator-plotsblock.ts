import { body, query } from 'express-validator';

export const validateCreatePlotBlock = [
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid Project ID format'),

  body('plotBlockName')
    .notEmpty()
    .withMessage('Plot Block Name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Plot Block Name must be 2-100 characters'),

  body('plotBlockDesc')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('blockTotalArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Area must be a positive number'),

  body('blockAreaUnit')
    .optional()
    .isIn(['acres', 'hectares', 'sqft', 'sqm', 'km²'])
    .withMessage('Invalid area unit'),
];

export const validateUpdatePlotBlock = [
  body('plotBlockName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Plot Block Name must be 2-100 characters'),

  body('plotBlockDesc')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('blockTotalArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Area must be a positive number'),

  body('blockAreaUnit')
    .optional()
    .isIn(['acres', 'hectares', 'sqft', 'sqm', 'km²'])
    .withMessage('Invalid area unit'),
];

export const validateGetPlotBlocks = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('projectId').optional().isMongoId().withMessage('Invalid Project ID format'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
