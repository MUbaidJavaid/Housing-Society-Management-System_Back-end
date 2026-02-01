import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateSrComplaintCategory = (): ValidationChain[] => [
  body('categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category Name must be between 2 and 100 characters')
    .customSanitizer(value => value.trim()),

  body('categoryCode')
    .trim()
    .notEmpty()
    .withMessage('Category Code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Category Code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Category Code must contain only uppercase letters and numbers')
    .customSanitizer(value => value.toUpperCase().trim()),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('priorityLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Priority Level must be an integer between 1 and 10')
    .default(5),

  body('slaHours')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('SLA Hours must be at least 1')
    .default(72),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').default(true),

  body('escalationLevels').optional().isArray().withMessage('Escalation Levels must be an array'),

  body('escalationLevels.*.level')
    .if(body('escalationLevels').exists())
    .isInt({ min: 1, max: 5 })
    .withMessage('Escalation Level must be between 1 and 5'),

  body('escalationLevels.*.role')
    .if(body('escalationLevels').exists())
    .trim()
    .notEmpty()
    .withMessage('Escalation Role is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Escalation Role must be between 1 and 50 characters'),

  body('escalationLevels.*.hoursAfterCreation')
    .if(body('escalationLevels').exists())
    .isFloat({ min: 1 })
    .withMessage('Hours After Creation must be at least 1'),
];

export const validateUpdateSrComplaintCategory = (): ValidationChain[] => [
  ...validateCreateSrComplaintCategory().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Complaint Category ID'),
];

export const validateGetSrComplaintCategories = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .default(1),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .default(10),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('sortBy')
    .optional()
    .isIn(['categoryName', 'categoryCode', 'priorityLevel', 'slaHours', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('priorityLevel'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('asc'),

  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),

  query('minPriority')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Minimum Priority must be between 1 and 10'),

  query('maxPriority')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Maximum Priority must be between 1 and 10'),
];

export const validateBulkStatusUpdate = (): ValidationChain[] => [
  body('categoryIds').isArray({ min: 1 }).withMessage('Category IDs must be a non-empty array'),

  body('categoryIds.*').isMongoId().withMessage('Invalid Category ID'),

  body('isActive').isBoolean().withMessage('isActive must be a boolean value'),
];

export const validateGetByPriority = (): ValidationChain[] => [
  query('min')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Minimum Priority must be between 1 and 10')
    .default(1),

  query('max')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Maximum Priority must be between 1 and 10')
    .default(10),
];

export const validateSearchCategories = (): ValidationChain[] => [
  query('searchTerm').optional().trim().isLength({ max: 100 }).withMessage('Search term too long'),

  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),

  query('minPriority')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Minimum Priority must be between 1 and 10'),

  query('maxPriority')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Maximum Priority must be between 1 and 10'),

  query('minSlaHours')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Minimum SLA Hours must be at least 1'),

  query('maxSlaHours')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Maximum SLA Hours must be at least 1'),
];

export const validateImportCategories = (): ValidationChain[] => [
  body().isArray({ min: 1 }).withMessage('Categories must be a non-empty array'),

  body('*.categoryName')
    .trim()
    .notEmpty()
    .withMessage('Category Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category Name must be between 2 and 100 characters'),

  body('*.categoryCode')
    .trim()
    .notEmpty()
    .withMessage('Category Code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Category Code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Category Code must contain only uppercase letters and numbers')
    .customSanitizer(value => value.toUpperCase().trim()),

  body('*.priorityLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Priority Level must be between 1 and 10')
    .default(5),

  body('*.slaHours')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('SLA Hours must be at least 1')
    .default(72),

  body('*.isActive').optional().isBoolean().withMessage('isActive must be a boolean').default(true),
];

export const validateCategoryCodeParam = (): ValidationChain[] => [
  param('code')
    .trim()
    .notEmpty()
    .withMessage('Category Code is required')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Category Code must contain only uppercase letters and numbers')
    .customSanitizer(value => value.toUpperCase()),
];
