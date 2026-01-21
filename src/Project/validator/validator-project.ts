import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateProject = (): ValidationChain[] => [
  body('projName')
    .trim()
    .notEmpty()
    .withMessage('Project Name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Project Name must be between 2 and 200 characters'),

  body('projLocation')
    .trim()
    .notEmpty()
    .withMessage('Project Location is required')
    .isLength({ max: 500 })
    .withMessage('Location cannot exceed 500 characters'),

  body('projSiteName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Site Name cannot exceed 200 characters'),

  body('projStartDate').optional().isISO8601().withMessage('Invalid start date format'),

  body('projEndDate').optional().isISO8601().withMessage('Invalid end date format'),

  body('projCovArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Coverage Area must be a positive number'),

  body('projRemarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),
];

export const validateUpdateProject = (): ValidationChain[] => [
  ...validateCreateProject().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Project ID'),
];

export const validateGetProjects = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('status')
    .optional()
    .isIn(['active', 'completed', 'upcoming'])
    .withMessage('Invalid status value'),

  query('sortBy')
    .optional()
    .isIn(['projName', 'projStartDate', 'projEndDate', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
