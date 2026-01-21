import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateApplication = (): ValidationChain[] => [
  body('applicationDesc')
    .trim()
    .notEmpty()
    .withMessage('Application Description is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Application Description must be between 5 and 1000 characters'),

  body('applicationTypeID')
    .trim()
    .notEmpty()
    .withMessage('Application Type is required')
    .isMongoId()
    .withMessage('Invalid Application Type ID'),
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

  query('applicationTypeID').optional().isMongoId().withMessage('Invalid Application Type ID'),

  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),

  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),

  query('sortBy')
    .optional()
    .isIn(['applicationDesc', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
