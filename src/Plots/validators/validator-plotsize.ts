import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreatePlotSize = (): ValidationChain[] => [
  body('plotSizeName')
    .trim()
    .notEmpty()
    .withMessage('Plot Size Name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Plot Size Name must be between 1 and 50 characters'),
];

export const validateUpdatePlotSize = (): ValidationChain[] => [
  ...validateCreatePlotSize(),
  param('id').isMongoId().withMessage('Invalid Plot Size ID'),
];

export const validateGetPlotSizes = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('sortBy')
    .optional()
    .isIn(['plotSizeName', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
