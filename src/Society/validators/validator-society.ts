import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateSociety = (): ValidationChain[] => [
  body('societyName')
    .trim()
    .notEmpty()
    .withMessage('Society name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Society name must be between 3 and 200 characters'),

  body('societyCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Society code must be between 3 and 20 characters')
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('Society code can only contain letters, numbers, and hyphens'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('cityId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid City ID'),

  body('stateId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid State ID'),

  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),

  body('zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code cannot exceed 20 characters'),

  body('contactEmail')
    .trim()
    .notEmpty()
    .withMessage('Contact email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('contactPhone')
    .trim()
    .notEmpty()
    .withMessage('Contact phone is required')
    .isLength({ min: 7, max: 20 })
    .withMessage('Contact phone must be between 7 and 20 characters'),

  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL'),

  body('logo')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid logo URL'),

  body('subscriptionPlanId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid Subscription Plan ID'),

  body('maxMembers')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max members must be a positive integer'),

  body('maxProjects')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max projects must be a positive integer'),

  body('maxStaff')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max staff must be a positive integer'),

  body('enabledModules')
    .optional()
    .isArray()
    .withMessage('Enabled modules must be an array'),

  body('enabledModules.*')
    .optional()
    .isString()
    .withMessage('Each module must be a string'),

  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),

  body('settings.currency')
    .optional()
    .trim()
    .isLength({ min: 2, max: 5 })
    .withMessage('Currency code must be between 2 and 5 characters'),

  body('settings.dateFormat')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Date format cannot exceed 20 characters'),

  body('settings.timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone cannot exceed 50 characters'),

  body('settings.lateFeeEnabled')
    .optional()
    .isBoolean()
    .withMessage('Late fee enabled must be true or false'),

  body('settings.lateFeeRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Late fee rate must be a non-negative number'),
];

export const validateUpdateSociety = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Society ID'),

  body('societyName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Society name cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Society name must be between 3 and 200 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('cityId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid City ID'),

  body('stateId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid State ID'),

  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),

  body('zipCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code cannot exceed 20 characters'),

  body('contactEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('contactPhone')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('Contact phone must be between 7 and 20 characters'),

  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL'),

  body('logo')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid logo URL'),

  body('subscriptionPlanId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Invalid Subscription Plan ID'),

  body('maxMembers')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max members must be a positive integer'),

  body('maxProjects')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max projects must be a positive integer'),

  body('maxStaff')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max staff must be a positive integer'),

  body('enabledModules')
    .optional()
    .isArray()
    .withMessage('Enabled modules must be an array'),

  body('enabledModules.*')
    .optional()
    .isString()
    .withMessage('Each module must be a string'),

  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),

  body('settings.currency')
    .optional()
    .trim()
    .isLength({ min: 2, max: 5 })
    .withMessage('Currency code must be between 2 and 5 characters'),

  body('settings.dateFormat')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Date format cannot exceed 20 characters'),

  body('settings.timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone cannot exceed 50 characters'),

  body('settings.lateFeeEnabled')
    .optional()
    .isBoolean()
    .withMessage('Late fee enabled must be true or false'),

  body('settings.lateFeeRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Late fee rate must be a non-negative number'),
];

export const validateGetSocieties = (): ValidationChain[] => [
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

  query('subscriptionStatus')
    .optional()
    .isIn(['trial', 'active', 'expired', 'suspended'])
    .withMessage('Subscription status must be one of: trial, active, expired, suspended'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['societyName', 'societyCode', 'subscriptionStatus', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('createdAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];

export const validateSocietyIdParam = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Society ID'),
];
