import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreatePlotType = (): ValidationChain[] => [
  body('plotTypeName')
    .trim()
    .notEmpty()
    .withMessage('Plot Type Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Plot Type Name must be between 2 and 100 characters'),
];

export const validateUpdatePlotType = (): ValidationChain[] => [
  ...validateCreatePlotType(),
  param('id').isMongoId().withMessage('Invalid Plot Type ID'),
];

export const validateGetPlotTypes = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('sortBy')
    .optional()
    .isIn(['plotTypeName', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
