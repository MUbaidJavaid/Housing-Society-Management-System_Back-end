import { body, param, query, ValidationChain } from 'express-validator';

const PASS_TYPES = [
  'material_in', 'material_out', 'furniture_in', 'furniture_out',
  'construction_material', 'delivery_large', 'moving_in', 'moving_out',
];

const STATUSES = [
  'requested', 'approved', 'rejected', 'checked_in',
  'checked_out', 'expired', 'cancelled',
];

export const validateCreateGatePass = (): ValidationChain[] => [
  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid society ID'),

  body('passType')
    .trim()
    .notEmpty()
    .withMessage('Pass type is required')
    .isIn(PASS_TYPES)
    .withMessage(`Pass type must be one of: ${PASS_TYPES.join(', ')}`),

  body('requestedBy')
    .trim()
    .notEmpty()
    .withMessage('Requested by is required')
    .isMongoId()
    .withMessage('Invalid member ID'),

  body('plotId')
    .optional()
    .isMongoId()
    .withMessage('Invalid plot ID'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Description must be between 5 and 1000 characters'),

  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),

  body('items.*.name')
    .optional()
    .isString()
    .withMessage('Item name must be a string'),

  body('items.*.quantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a positive number'),

  body('items.*.unit')
    .optional()
    .isString()
    .withMessage('Unit must be a string'),

  body('items.*.estimatedValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated value must be a positive number'),

  body('vehicleNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Vehicle number cannot exceed 20 characters'),

  body('vehicleType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Vehicle type cannot exceed 50 characters'),

  body('driverName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Driver name cannot exceed 200 characters'),

  body('driverCNIC')
    .optional()
    .trim()
    .matches(/^\d{13}$/)
    .withMessage('Driver CNIC must be exactly 13 digits'),

  body('driverPhone')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('Driver phone must be between 7 and 20 characters'),

  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),

  body('expectedDate')
    .notEmpty()
    .withMessage('Expected date is required')
    .isISO8601()
    .withMessage('Expected date must be a valid date'),

  body('expectedTime')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Expected time cannot exceed 20 characters'),
];

export const validateUpdateGatePass = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid gate pass ID'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Description must be between 5 and 1000 characters'),

  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),

  body('vehicleNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Vehicle number cannot exceed 20 characters'),

  body('vehicleType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Vehicle type cannot exceed 50 characters'),

  body('driverName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Driver name cannot exceed 200 characters'),

  body('driverCNIC')
    .optional()
    .trim()
    .matches(/^\d{13}$/)
    .withMessage('Driver CNIC must be exactly 13 digits'),

  body('driverPhone')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('Driver phone must be between 7 and 20 characters'),

  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),

  body('expectedDate')
    .optional()
    .isISO8601()
    .withMessage('Expected date must be a valid date'),

  body('expectedTime')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Expected time cannot exceed 20 characters'),
];

export const validateRejectPass = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid gate pass ID'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
];

export const validateCheckIn = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid gate pass ID'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const validateCheckOut = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid gate pass ID'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

  body('photos')
    .optional()
    .isArray()
    .withMessage('Photos must be an array'),

  body('photos.*.url')
    .optional()
    .isURL()
    .withMessage('Photo URL must be a valid URL'),

  body('photos.*.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Photo description cannot exceed 200 characters'),
];

export const validatePassCode = (): ValidationChain[] => [
  param('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Pass code must be exactly 6 digits'),
];

export const validateIdParam = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid ID'),
];

export const validateListQuery = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search term cannot exceed 200 characters'),

  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid society ID'),

  query('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),

  query('passType')
    .optional()
    .isIn(PASS_TYPES)
    .withMessage(`Pass type must be one of: ${PASS_TYPES.join(', ')}`),

  query('requestedBy')
    .optional()
    .isMongoId()
    .withMessage('Invalid member ID'),

  query('expectedDate')
    .optional()
    .isISO8601()
    .withMessage('Expected date must be a valid date'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'expectedDate', 'status', 'passType'])
    .withMessage('Sort by must be one of: createdAt, expectedDate, status, passType'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];
