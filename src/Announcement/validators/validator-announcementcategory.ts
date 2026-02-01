import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateAnnouncementCategory = (): ValidationChain[] => [
  body('categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage(
      'Category name can only contain letters, numbers, spaces, hyphens and underscores'
    ),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon cannot exceed 50 characters'),

  body('color')
    .optional()
    .trim()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please provide a valid hex color code'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').default(true),

  body('priority')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Priority must be between 0 and 1000')
    .default(0),
];

export const validateUpdateAnnouncementCategory = (): ValidationChain[] => [
  body('categoryName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage(
      'Category name can only contain letters, numbers, spaces, hyphens and underscores'
    ),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon cannot exceed 50 characters'),

  body('color')
    .optional()
    .trim()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please provide a valid hex color code'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),

  body('priority')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Priority must be between 0 and 1000'),

  param('id').isMongoId().withMessage('Invalid Category ID'),
];

export const validateGetAnnouncementCategories = (): ValidationChain[] => [
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
    .isIn(['categoryName', 'priority', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('priority'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];

export const validateCategoryNameParam = (): ValidationChain[] => [
  param('categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
];

export const validateBulkUpdateCategories = (): ValidationChain[] => [
  body('categoryIds').isArray({ min: 1 }).withMessage('Category IDs must be a non-empty array'),

  body('categoryIds.*').isMongoId().withMessage('Invalid Category ID'),

  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];
