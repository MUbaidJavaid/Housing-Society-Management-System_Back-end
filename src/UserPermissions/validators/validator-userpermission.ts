import { body, param, query, ValidationChain } from 'express-validator';
import { PermissionType } from '../types/types-userpermission';

export const validateCreateUserPermission = (): ValidationChain[] => [
  body('srModuleId')
    .trim()
    .notEmpty()
    .withMessage('Module ID is required')
    .isMongoId()
    .withMessage('Invalid Module ID'),

  body('roleId')
    .trim()
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid Role ID'),

  body('moduleName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Module Name must be between 2 and 100 characters'),

  body('canRead').isBoolean().withMessage('canRead must be a boolean'),

  body('canCreate').isBoolean().withMessage('canCreate must be a boolean'),

  body('canUpdate').isBoolean().withMessage('canUpdate must be a boolean'),

  body('canDelete').isBoolean().withMessage('canDelete must be a boolean'),

  body('canExport')
    .optional()
    .isBoolean()
    .withMessage('canExport must be a boolean')
    .default(false),

  body('canImport')
    .optional()
    .isBoolean()
    .withMessage('canImport must be a boolean')
    .default(false),

  body('canApprove')
    .optional()
    .isBoolean()
    .withMessage('canApprove must be a boolean')
    .default(false),

  body('canVerify')
    .optional()
    .isBoolean()
    .withMessage('canVerify must be a boolean')
    .default(false),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').default(true),
];

export const validateUpdateUserPermission = (): ValidationChain[] => [
  ...validateCreateUserPermission().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Permission ID'),
];

export const validateGetUserPermissions = (): ValidationChain[] => [
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

  query('srModuleId').optional().isMongoId().withMessage('Invalid Module ID'),

  query('roleId').optional().isMongoId().withMessage('Invalid Role ID'),

  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),

  query('hasAccess').optional().isBoolean().withMessage('hasAccess must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['moduleName', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('createdAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];

export const validateBulkPermissionUpdate = (): ValidationChain[] => [
  body('permissionIds').isArray({ min: 1 }).withMessage('Permission IDs must be a non-empty array'),

  body('permissionIds.*').isMongoId().withMessage('Invalid Permission ID'),

  body('canRead').optional().isBoolean().withMessage('canRead must be a boolean'),

  body('canCreate').optional().isBoolean().withMessage('canCreate must be a boolean'),

  body('canUpdate').optional().isBoolean().withMessage('canUpdate must be a boolean'),

  body('canDelete').optional().isBoolean().withMessage('canDelete must be a boolean'),

  body('canExport').optional().isBoolean().withMessage('canExport must be a boolean'),

  body('canImport').optional().isBoolean().withMessage('canImport must be a boolean'),

  body('canApprove').optional().isBoolean().withMessage('canApprove must be a boolean'),

  body('canVerify').optional().isBoolean().withMessage('canVerify must be a boolean'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const validateSetPermissions = (): ValidationChain[] => [
  body('srModuleId')
    .trim()
    .notEmpty()
    .withMessage('Module ID is required')
    .isMongoId()
    .withMessage('Invalid Module ID'),

  body('roleId')
    .trim()
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid Role ID'),

  body('permissions.canRead').isBoolean().withMessage('canRead must be a boolean'),

  body('permissions.canCreate').isBoolean().withMessage('canCreate must be a boolean'),

  body('permissions.canUpdate').isBoolean().withMessage('canUpdate must be a boolean'),

  body('permissions.canDelete').isBoolean().withMessage('canDelete must be a boolean'),

  body('permissions.canExport')
    .optional()
    .isBoolean()
    .withMessage('canExport must be a boolean')
    .default(false),

  body('permissions.canImport')
    .optional()
    .isBoolean()
    .withMessage('canImport must be a boolean')
    .default(false),

  body('permissions.canApprove')
    .optional()
    .isBoolean()
    .withMessage('canApprove must be a boolean')
    .default(false),

  body('permissions.canVerify')
    .optional()
    .isBoolean()
    .withMessage('canVerify must be a boolean')
    .default(false),
];

export const validateCopyPermissions = (): ValidationChain[] => [
  body('sourceRoleId')
    .trim()
    .notEmpty()
    .withMessage('Source Role ID is required')
    .isMongoId()
    .withMessage('Invalid Source Role ID'),

  body('targetRoleId')
    .trim()
    .notEmpty()
    .withMessage('Target Role ID is required')
    .isMongoId()
    .withMessage('Invalid Target Role ID'),

  body('overrideExisting')
    .optional()
    .isBoolean()
    .withMessage('overrideExisting must be a boolean')
    .default(false),
];

export const validateCheckPermission = (): ValidationChain[] => [
  body('roleId')
    .trim()
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid Role ID'),

  body('srModuleId')
    .trim()
    .notEmpty()
    .withMessage('Module ID is required')
    .isMongoId()
    .withMessage('Invalid Module ID'),

  body('permissionType')
    .trim()
    .notEmpty()
    .withMessage('Permission type is required')
    .isIn(Object.values(PermissionType))
    .withMessage(`Permission type must be one of: ${Object.values(PermissionType).join(', ')}`),
];

export const validateRoleIdParam = (): ValidationChain[] => [
  param('roleId').isMongoId().withMessage('Invalid Role ID'),
];

export const validateModuleIdParam = (): ValidationChain[] => [
  param('srModuleId').isMongoId().withMessage('Invalid Module ID'),
];

export const validateGetByRoleAndModule = (): ValidationChain[] => [
  query('roleId')
    .trim()
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid Role ID'),

  query('srModuleId')
    .trim()
    .notEmpty()
    .withMessage('Module ID is required')
    .isMongoId()
    .withMessage('Invalid Module ID'),
];
