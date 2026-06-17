import { body, param, query } from 'express-validator';
import { LookupCategory } from '../models/models-lookup-value';

export const validateCreateLookupValue = [
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(Object.values(LookupCategory))
    .withMessage('Invalid lookup category'),

  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Code must be 1-50 characters'),

  body('label')
    .notEmpty()
    .withMessage('Label is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Label must be 1-100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('colorCode')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Invalid hex color code'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Icon name cannot exceed 100 characters'),

  body('sequence')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sequence must be at least 1'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),

  body('isSystem')
    .optional()
    .isBoolean()
    .withMessage('isSystem must be a boolean'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),

  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent ID'),

  body('allowedTransitions')
    .optional()
    .isArray()
    .withMessage('Allowed transitions must be an array'),
];

export const validateUpdateLookupValue = [
  param('id')
    .isMongoId()
    .withMessage('Invalid lookup value ID'),

  body('label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Label must be 1-100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('colorCode')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Invalid hex color code'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Icon name cannot exceed 100 characters'),

  body('sequence')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sequence must be at least 1'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),

  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent ID'),

  body('allowedTransitions')
    .optional()
    .isArray()
    .withMessage('Allowed transitions must be an array'),
];

export const validateGetLookupValues = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be 1-200'),

  query('category')
    .optional()
    .isIn(Object.values(LookupCategory))
    .withMessage('Invalid lookup category'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateReorderLookupValues = [
  body('items')
    .notEmpty()
    .withMessage('Items array is required')
    .isArray()
    .withMessage('Items must be an array')
    .custom(value => value.length > 0)
    .withMessage('At least one item is required'),

  body('items.*.id')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID'),

  body('items.*.sequence')
    .notEmpty()
    .withMessage('Sequence is required')
    .isInt({ min: 1 })
    .withMessage('Sequence must be at least 1'),
];
