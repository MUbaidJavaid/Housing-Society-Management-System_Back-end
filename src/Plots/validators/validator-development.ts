import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateDevelopment = (): ValidationChain[] => [
  body('plotId').isMongoId().withMessage('Invalid Plot ID'),

  body('memId').isMongoId().withMessage('Invalid Member ID'),

  body('developmentStatusName')
    .trim()
    .notEmpty()
    .withMessage('Development Status Name is required')
    .isLength({ max: 100 })
    .withMessage('Status Name cannot exceed 100 characters'),

  body('applicationId').isMongoId().withMessage('Invalid Application ID'),

  body('approvedBy').optional().isMongoId().withMessage('Invalid Approver ID'),

  body('approvedOn').optional().isISO8601().withMessage('Invalid approval date format'),
];

export const validateUpdateDevelopment = (): ValidationChain[] => [
  ...validateCreateDevelopment().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Development ID'),
];

export const validateGetDevelopments = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('plotId').optional().isMongoId().withMessage('Invalid Plot ID'),

  query('memId').optional().isMongoId().withMessage('Invalid Member ID'),

  query('applicationId').optional().isMongoId().withMessage('Invalid Application ID'),

  query('sortBy')
    .optional()
    .isIn(['developmentStatusName', 'approvedOn', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
