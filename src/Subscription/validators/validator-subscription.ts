import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreatePackage = (): ValidationChain[] => [
  body('packageName')
    .trim()
    .notEmpty()
    .withMessage('Package name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Package name must be between 2 and 100 characters'),

  body('packageCode')
    .trim()
    .notEmpty()
    .withMessage('Package code is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Package code must be between 2 and 50 characters')
    .matches(/^[a-z0-9_-]+$/)
    .withMessage('Package code can only contain lowercase letters, numbers, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('monthlyPrice')
    .notEmpty()
    .withMessage('Monthly price is required')
    .isFloat({ min: 0 })
    .withMessage('Monthly price must be a non-negative number'),

  body('yearlyPrice')
    .notEmpty()
    .withMessage('Yearly price is required')
    .isFloat({ min: 0 })
    .withMessage('Yearly price must be a non-negative number'),

  body('currency')
    .optional()
    .trim()
    .isLength({ min: 2, max: 5 })
    .withMessage('Currency code must be between 2 and 5 characters'),

  body('features')
    .optional()
    .isObject()
    .withMessage('Features must be an object'),

  body('features.maxMembers')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max members must be a non-negative integer'),

  body('features.maxProjects')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max projects must be a non-negative integer'),

  body('features.maxStaff')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max staff must be a non-negative integer'),

  body('features.maxPlots')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max plots must be a non-negative integer'),

  body('features.modules')
    .optional()
    .isArray()
    .withMessage('Modules must be an array'),

  body('features.modules.*')
    .optional()
    .isString()
    .withMessage('Each module must be a string'),

  body('features.storageGB')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Storage GB must be a non-negative number'),

  body('features.supportLevel')
    .optional()
    .isIn(['email', 'priority', 'dedicated'])
    .withMessage('Support level must be one of: email, priority, dedicated'),

  body('features.customBranding')
    .optional()
    .isBoolean()
    .withMessage('Custom branding must be true or false'),

  body('features.apiAccess')
    .optional()
    .isBoolean()
    .withMessage('API access must be true or false'),

  body('features.visitorManagement')
    .optional()
    .isBoolean()
    .withMessage('Visitor management must be true or false'),

  body('features.facilityBooking')
    .optional()
    .isBoolean()
    .withMessage('Facility booking must be true or false'),

  body('features.advancedReporting')
    .optional()
    .isBoolean()
    .withMessage('Advanced reporting must be true or false'),

  body('isPopular')
    .optional()
    .isBoolean()
    .withMessage('isPopular must be true or false'),

  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
];

export const validateUpdatePackage = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Package ID'),

  body('packageName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Package name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Package name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('monthlyPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly price must be a non-negative number'),

  body('yearlyPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Yearly price must be a non-negative number'),

  body('currency')
    .optional()
    .trim()
    .isLength({ min: 2, max: 5 })
    .withMessage('Currency code must be between 2 and 5 characters'),

  body('features')
    .optional()
    .isObject()
    .withMessage('Features must be an object'),

  body('features.maxMembers')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max members must be a non-negative integer'),

  body('features.maxProjects')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max projects must be a non-negative integer'),

  body('features.maxStaff')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max staff must be a non-negative integer'),

  body('features.maxPlots')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max plots must be a non-negative integer'),

  body('features.modules')
    .optional()
    .isArray()
    .withMessage('Modules must be an array'),

  body('features.modules.*')
    .optional()
    .isString()
    .withMessage('Each module must be a string'),

  body('features.storageGB')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Storage GB must be a non-negative number'),

  body('features.supportLevel')
    .optional()
    .isIn(['email', 'priority', 'dedicated'])
    .withMessage('Support level must be one of: email, priority, dedicated'),

  body('features.customBranding')
    .optional()
    .isBoolean()
    .withMessage('Custom branding must be true or false'),

  body('features.apiAccess')
    .optional()
    .isBoolean()
    .withMessage('API access must be true or false'),

  body('features.visitorManagement')
    .optional()
    .isBoolean()
    .withMessage('Visitor management must be true or false'),

  body('features.facilityBooking')
    .optional()
    .isBoolean()
    .withMessage('Facility booking must be true or false'),

  body('features.advancedReporting')
    .optional()
    .isBoolean()
    .withMessage('Advanced reporting must be true or false'),

  body('isPopular')
    .optional()
    .isBoolean()
    .withMessage('isPopular must be true or false'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false'),

  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
];

export const validateGetPackages = (): ValidationChain[] => [
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

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['packageName', 'monthlyPrice', 'yearlyPrice', 'sortOrder', 'createdAt'])
    .withMessage('Invalid sort field')
    .default('sortOrder'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('asc'),
];

export const validateSubscribe = (): ValidationChain[] => [
  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('packageId')
    .trim()
    .notEmpty()
    .withMessage('Package ID is required')
    .isMongoId()
    .withMessage('Invalid Package ID'),

  body('billingCycle')
    .trim()
    .notEmpty()
    .withMessage('Billing cycle is required')
    .isIn(['monthly', 'yearly'])
    .withMessage('Billing cycle must be monthly or yearly'),

  body('paymentReference')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Payment reference cannot exceed 200 characters'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
];

export const validateCancelSubscription = (): ValidationChain[] => [
  param('societyId').isMongoId().withMessage('Invalid Society ID'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
];

export const validatePackageIdParam = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Package ID'),
];

export const validateSocietyIdParam = (): ValidationChain[] => [
  param('societyId').isMongoId().withMessage('Invalid Society ID'),
];

export const validateGetHistory = (): ValidationChain[] => [
  param('societyId').isMongoId().withMessage('Invalid Society ID'),

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
];
