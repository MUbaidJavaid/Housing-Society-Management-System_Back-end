import { body, param, query, ValidationChain } from 'express-validator';

export const validateCheckIn = (): ValidationChain[] => [
  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('location')
    .notEmpty()
    .withMessage('Location is required'),

  body('location.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('location.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('location.accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accuracy must be a positive number'),

  body('geofenceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Geofence ID'),

  body('shiftName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Shift name cannot exceed 100 characters'),
];

export const validateCheckOut = (): ValidationChain[] => [
  body('location')
    .notEmpty()
    .withMessage('Location is required'),

  body('location.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('location.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('location.accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accuracy must be a positive number'),
];

export const validateGetAttendance = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('staffId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Staff ID'),

  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'half-day', 'leave', 'holiday'])
    .withMessage('Invalid status value'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('sortBy')
    .optional()
    .isIn(['date', 'checkInTime', 'totalHours', 'createdAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateGetSummary = (): ValidationChain[] => [
  query('staffId')
    .trim()
    .notEmpty()
    .withMessage('Staff ID is required')
    .isMongoId()
    .withMessage('Invalid Staff ID'),

  query('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
];

export const validateGetSocietySummary = (): ValidationChain[] => [
  query('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date'),
];

export const validateCreateGeofence = (): ValidationChain[] => [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Geofence name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('radius')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Radius must be a positive number in meters'),
];

export const validateUpdateGeofence = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Geofence ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Name must be between 2 and 200 characters'),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('radius')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Radius must be a positive number in meters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const validateIdParam = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID'),
];
