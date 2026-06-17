import { body, param, query, ValidationChain } from 'express-validator';

const facilityTypes = [
  'Community Hall',
  'Swimming Pool',
  'Gym',
  'Sports Court',
  'Park',
  'BBQ Area',
  'Meeting Room',
  'Parking',
  'Other',
];

export const validateCreateFacility = (): ValidationChain[] => [
  body('facilityName')
    .trim()
    .notEmpty()
    .withMessage('Facility name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Facility name must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('facilityType')
    .trim()
    .notEmpty()
    .withMessage('Facility type is required')
    .isIn(facilityTypes)
    .withMessage(`Facility type must be one of: ${facilityTypes.join(', ')}`),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location cannot exceed 500 characters'),

  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),

  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),

  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate cannot be negative'),

  body('halfDayRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Half day rate cannot be negative'),

  body('fullDayRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Full day rate cannot be negative'),

  body('securityDeposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Security deposit cannot be negative'),

  body('currency')
    .optional()
    .trim()
    .isLength({ max: 5 })
    .withMessage('Currency code cannot exceed 5 characters'),

  body('operatingHours')
    .optional()
    .isArray()
    .withMessage('Operating hours must be an array'),

  body('operatingHours.*.dayOfWeek')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday)'),

  body('operatingHours.*.openTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Open time must be in HH:mm format'),

  body('operatingHours.*.closeTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Close time must be in HH:mm format'),

  body('operatingHours.*.isClosed')
    .optional()
    .isBoolean()
    .withMessage('isClosed must be a boolean'),

  body('slotDurationMinutes')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Slot duration must be between 15 and 480 minutes'),

  body('maxAdvanceBookingDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max advance booking days must be at least 1'),

  body('minAdvanceBookingHours')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min advance booking hours cannot be negative'),

  body('cancellationPolicyHours')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Cancellation policy hours cannot be negative'),

  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be a boolean'),

  body('rules')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Rules cannot exceed 5000 characters'),

  body('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),
];

export const validateUpdateFacility = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Facility ID'),

  body('facilityName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Facility name cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Facility name must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('facilityType')
    .optional()
    .trim()
    .isIn(facilityTypes)
    .withMessage(`Facility type must be one of: ${facilityTypes.join(', ')}`),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location cannot exceed 500 characters'),

  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),

  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),

  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate cannot be negative'),

  body('halfDayRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Half day rate cannot be negative'),

  body('fullDayRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Full day rate cannot be negative'),

  body('securityDeposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Security deposit cannot be negative'),

  body('currency')
    .optional()
    .trim()
    .isLength({ max: 5 })
    .withMessage('Currency code cannot exceed 5 characters'),

  body('operatingHours')
    .optional()
    .isArray()
    .withMessage('Operating hours must be an array'),

  body('slotDurationMinutes')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Slot duration must be between 15 and 480 minutes'),

  body('maxAdvanceBookingDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max advance booking days must be at least 1'),

  body('minAdvanceBookingHours')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min advance booking hours cannot be negative'),

  body('cancellationPolicyHours')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Cancellation policy hours cannot be negative'),

  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be a boolean'),

  body('rules')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Rules cannot exceed 5000 characters'),

  body('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),
];

export const validateGetFacilities = (): ValidationChain[] => [
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

  query('facilityType')
    .optional()
    .isIn(facilityTypes)
    .withMessage(`Facility type must be one of: ${facilityTypes.join(', ')}`),

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
    .isIn(['facilityName', 'facilityType', 'hourlyRate', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('createdAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];
