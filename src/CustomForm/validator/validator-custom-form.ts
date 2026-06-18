import { body, param, query, ValidationChain } from 'express-validator';

const fieldTypes = [
  'text',
  'number',
  'date',
  'select',
  'multiselect',
  'file',
  'boolean',
  'textarea',
  'email',
  'phone',
  'url',
];

const widthOptions = ['full', 'half', 'third'];

const entityTypes = ['member', 'plot', 'complaint', 'application', 'visitor'];

export const validateCreateCustomForm = (): ValidationChain[] => [
  body('entityType')
    .trim()
    .notEmpty()
    .withMessage('Entity type is required')
    .isIn(entityTypes)
    .withMessage(`Entity type must be one of: ${entityTypes.join(', ')}`),

  body('fieldName')
    .trim()
    .notEmpty()
    .withMessage('Field name is required')
    .matches(/^[a-z][a-zA-Z0-9_]*$/)
    .withMessage('Field name must be in slug format (start with lowercase letter, alphanumeric and underscores only)')
    .isLength({ max: 100 })
    .withMessage('Field name cannot exceed 100 characters'),

  body('fieldLabel')
    .trim()
    .notEmpty()
    .withMessage('Field label is required')
    .isLength({ max: 200 })
    .withMessage('Field label cannot exceed 200 characters'),

  body('fieldType')
    .trim()
    .notEmpty()
    .withMessage('Field type is required')
    .isIn(fieldTypes)
    .withMessage(`Field type must be one of: ${fieldTypes.join(', ')}`),

  body('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),

  body('options.*.value')
    .optional()
    .isString()
    .withMessage('Option value must be a string'),

  body('options.*.label')
    .optional()
    .isString()
    .withMessage('Option label must be a string'),

  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),

  body('validationRules')
    .optional()
    .isObject()
    .withMessage('Validation rules must be an object'),

  body('placeholder')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Placeholder cannot exceed 500 characters'),

  body('helpText')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Help text cannot exceed 1000 characters'),

  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),

  body('section')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Section cannot exceed 200 characters'),

  body('visibility')
    .optional()
    .isObject()
    .withMessage('Visibility must be an object'),

  body('width')
    .optional()
    .isIn(widthOptions)
    .withMessage(`Width must be one of: ${widthOptions.join(', ')}`),

  body('societyId')
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),
];

export const validateUpdateCustomForm = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Custom Form ID'),

  body('entityType')
    .optional()
    .trim()
    .isIn(entityTypes)
    .withMessage(`Entity type must be one of: ${entityTypes.join(', ')}`),

  body('fieldName')
    .optional()
    .trim()
    .matches(/^[a-z][a-zA-Z0-9_]*$/)
    .withMessage('Field name must be in slug format (start with lowercase letter, alphanumeric and underscores only)')
    .isLength({ max: 100 })
    .withMessage('Field name cannot exceed 100 characters'),

  body('fieldLabel')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Field label cannot exceed 200 characters'),

  body('fieldType')
    .optional()
    .trim()
    .isIn(fieldTypes)
    .withMessage(`Field type must be one of: ${fieldTypes.join(', ')}`),

  body('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),

  body('options.*.value')
    .optional()
    .isString()
    .withMessage('Option value must be a string'),

  body('options.*.label')
    .optional()
    .isString()
    .withMessage('Option label must be a string'),

  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),

  body('validationRules')
    .optional()
    .isObject()
    .withMessage('Validation rules must be an object'),

  body('placeholder')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Placeholder cannot exceed 500 characters'),

  body('helpText')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Help text cannot exceed 1000 characters'),

  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),

  body('section')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Section cannot exceed 200 characters'),

  body('visibility')
    .optional()
    .isObject()
    .withMessage('Visibility must be an object'),

  body('width')
    .optional()
    .isIn(widthOptions)
    .withMessage(`Width must be one of: ${widthOptions.join(', ')}`),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const validateGetCustomForms = (): ValidationChain[] => [
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

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query too long'),

  query('entityType')
    .optional()
    .isIn(entityTypes)
    .withMessage(`Entity type must be one of: ${entityTypes.join(', ')}`),

  query('fieldType')
    .optional()
    .isIn(fieldTypes)
    .withMessage(`Field type must be one of: ${fieldTypes.join(', ')}`),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false'),

  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('sortBy')
    .optional()
    .isIn(['fieldName', 'fieldLabel', 'entityType', 'fieldType', 'order', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('createdAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];

export const validateReorder = (): ValidationChain[] => [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),

  body('items.*.id')
    .isMongoId()
    .withMessage('Each item must have a valid ID'),

  body('items.*.order')
    .isInt({ min: 1 })
    .withMessage('Each item must have a positive order number'),
];

export const validateEntityType = (): ValidationChain[] => [
  param('entityType')
    .trim()
    .notEmpty()
    .withMessage('Entity type is required')
    .isIn(entityTypes)
    .withMessage(`Entity type must be one of: ${entityTypes.join(', ')}`),

  query('societyId')
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),
];

export const validateMetadata = (): ValidationChain[] => [
  body('entityType')
    .trim()
    .notEmpty()
    .withMessage('Entity type is required')
    .isIn(entityTypes)
    .withMessage(`Entity type must be one of: ${entityTypes.join(', ')}`),

  body('societyId')
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('metadata')
    .isObject()
    .withMessage('Metadata must be an object'),
];
