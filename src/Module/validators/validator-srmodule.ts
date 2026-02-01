import { body, param, query, ValidationChain } from 'express-validator';
import { ModulePermission } from '../types/types-srmodule';

export const validateCreateSrModule = (): ValidationChain[] => [
  body('moduleName')
    .trim()
    .notEmpty()
    .withMessage('Module Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Module Name must be between 2 and 100 characters')
    .customSanitizer(value => value.trim()),

  body('moduleCode')
    .trim()
    .notEmpty()
    .withMessage('Module Code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Module Code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Module Code must contain only uppercase letters, numbers, and underscores')
    .customSanitizer(value => value.toUpperCase().trim()),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('displayOrder')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Display Order must be at least 1')
    .default(1),

  body('iconName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon name cannot exceed 50 characters')
    .default('FolderIcon'),

  body('routePath')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Route path cannot exceed 200 characters'),

  body('parentModuleId').optional().isMongoId().withMessage('Invalid Parent Module ID'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').default(true),

  body('permissions').optional().isArray().withMessage('Permissions must be an array'),

  body('permissions.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Permission cannot be empty')
    .isIn(Object.values(ModulePermission))
    .withMessage(`Permission must be one of: ${Object.values(ModulePermission).join(', ')}`)
    .customSanitizer(value => value.toUpperCase().trim()),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean')
    .default(false),
];

export const validateUpdateSrModule = (): ValidationChain[] => [
  ...validateCreateSrModule().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Module ID'),
];

export const validateGetSrModules = (): ValidationChain[] => [
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

  query('sortBy')
    .optional()
    .isIn(['moduleName', 'moduleCode', 'displayOrder', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('displayOrder'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('asc'),

  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),

  query('parentModuleId').optional().isMongoId().withMessage('Invalid Parent Module ID'),

  query('isDefault').optional().isBoolean().withMessage('isDefault must be true or false'),
];

export const validateBulkStatusUpdate = (): ValidationChain[] => [
  body('moduleIds').isArray({ min: 1 }).withMessage('Module IDs must be a non-empty array'),

  body('moduleIds.*').isMongoId().withMessage('Invalid Module ID'),

  body('isActive').isBoolean().withMessage('isActive must be a boolean value'),
];

export const validateSearchModules = (): ValidationChain[] => [
  query('searchTerm').optional().trim().isLength({ max: 100 }).withMessage('Search term too long'),

  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),

  query('isDefault').optional().isBoolean().withMessage('isDefault must be true or false'),

  query('hasParent').optional().isBoolean().withMessage('hasParent must be true or false'),
];

export const validateImportModules = (): ValidationChain[] => [
  body().isArray({ min: 1 }).withMessage('Modules must be a non-empty array'),

  body('*.moduleName')
    .trim()
    .notEmpty()
    .withMessage('Module Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Module Name must be between 2 and 100 characters'),

  body('*.moduleCode')
    .trim()
    .notEmpty()
    .withMessage('Module Code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Module Code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Module Code must contain only uppercase letters, numbers, and underscores')
    .customSanitizer(value => value.toUpperCase().trim()),

  body('*.displayOrder')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Display Order must be at least 1')
    .default(1),

  body('*.isActive').optional().isBoolean().withMessage('isActive must be a boolean').default(true),

  body('*.isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean')
    .default(false),
];

export const validateModuleCodeParam = (): ValidationChain[] => [
  param('code')
    .trim()
    .notEmpty()
    .withMessage('Module Code is required')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Module Code must contain only uppercase letters, numbers, and underscores')
    .customSanitizer(value => value.toUpperCase()),
];

export const validateUpdatePermissions = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Module ID'),

  body('permissions').isArray().withMessage('Permissions must be an array'),

  body('permissions.*')
    .trim()
    .notEmpty()
    .withMessage('Permission cannot be empty')
    .isIn(Object.values(ModulePermission))
    .withMessage(`Permission must be one of: ${Object.values(ModulePermission).join(', ')}`)
    .customSanitizer(value => value.toUpperCase().trim()),
];

export const validateReorderModules = (): ValidationChain[] => [
  body('moduleOrders').isArray({ min: 1 }).withMessage('Module orders must be a non-empty array'),

  body('moduleOrders.*.id').isMongoId().withMessage('Invalid Module ID'),

  body('moduleOrders.*.displayOrder')
    .isInt({ min: 1 })
    .withMessage('Display Order must be at least 1'),
];

export const validateSetDefaultStatus = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Module ID'),

  body('isDefault').isBoolean().withMessage('isDefault must be a boolean value'),
];
