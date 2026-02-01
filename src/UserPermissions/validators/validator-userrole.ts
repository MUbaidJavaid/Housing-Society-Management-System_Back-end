import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateUserRole = (): ValidationChain[] => [
  body('roleName')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Role name must be between 2 and 100 characters'),

  body('roleCode')
    .trim()
    .notEmpty()
    .withMessage('Role code is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Role code must contain only uppercase letters, numbers, and underscores')
    .toUpperCase(),

  body('roleDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Role description cannot exceed 500 characters'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').default(true),

  body('priority')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Priority must be between 0 and 1000')
    .default(0),
];

export const validateUpdateUserRole = (): ValidationChain[] => [
  body('roleName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Role name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Role name must be between 2 and 100 characters'),

  body('roleCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Role code cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Role code must contain only uppercase letters, numbers, and underscores')
    .toUpperCase(),

  body('roleDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Role description cannot exceed 500 characters'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),

  body('priority')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Priority must be between 0 and 1000'),

  param('id').isMongoId().withMessage('Invalid Role ID'),
];

export const validateGetUserRoles = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .default(1),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .default(20),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['roleName', 'roleCode', 'priority', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('priority'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];

export const validateRoleCodeParam = (): ValidationChain[] => [
  param('roleCode')
    .trim()
    .notEmpty()
    .withMessage('Role code is required')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Invalid role code format')
    .toUpperCase(),
];

export const validateBulkUpdateRoles = (): ValidationChain[] => [
  body('roleIds').isArray({ min: 1 }).withMessage('Role IDs must be a non-empty array'),

  body('roleIds.*').isMongoId().withMessage('Invalid Role ID'),

  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];
