import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateSrApplicationType = (): ValidationChain[] => [
  body('applicationName')
    .trim()
    .notEmpty()
    .withMessage('Application Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Application Name must be between 2 and 100 characters'),

  body('applicationFee')
    .isFloat({ min: 0 })
    .withMessage('Application Fee must be a positive number'),

  body('applicationDesc')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

export const validateUpdateSrApplicationType = (): ValidationChain[] => [
  ...validateCreateSrApplicationType().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Application Type ID'),
];

export const validateGetSrApplicationTypes = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('sortBy')
    .optional()
    .isIn(['applicationName', 'applicationFee', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
