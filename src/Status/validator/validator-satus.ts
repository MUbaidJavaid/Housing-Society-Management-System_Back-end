import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateStatus = (): ValidationChain[] => [
  body('statusName')
    .trim()
    .notEmpty()
    .withMessage('Status Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Status Name must be between 2 and 100 characters'),

  body('statusType')
    .optional()
    .isIn(['general', 'member', 'plot', 'development', 'city', 'state', 'project'])
    .withMessage('Invalid status type'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

export const validateUpdateStatus = (): ValidationChain[] => [
  ...validateCreateStatus().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Status ID'),
];

export const validateGetStatuses = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('statusType')
    .optional()
    .isIn(['general', 'member', 'plot', 'development', 'city', 'state', 'project'])
    .withMessage('Invalid status type'),

  query('sortBy')
    .optional()
    .isIn(['statusName', 'statusType', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
