import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreatePlotBlock = (): ValidationChain[] => [
  body('plotBlockName')
    .trim()
    .notEmpty()
    .withMessage('Plot Block Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Plot Block Name must be between 2 and 100 characters'),

  body('plotBlockDesc')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

export const validateUpdatePlotBlock = (): ValidationChain[] => [
  ...validateCreatePlotBlock(),
  param('id').isMongoId().withMessage('Invalid Plot Block ID'),
];

export const validateGetPlotBlocks = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('sortBy')
    .optional()
    .isIn(['plotBlockName', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
