import { body, param, query, ValidationChain } from 'express-validator';
import { SpotType, VehicleType, SpotStatus, PassPurpose, PassStatus } from '../types/types-parking';

// ── Spot Validators ──

export const validateCreateSpot = (): ValidationChain[] => [
  body('spotNumber')
    .trim()
    .notEmpty()
    .withMessage('Spot number is required'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('blockId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Block ID'),

  body('spotType')
    .trim()
    .notEmpty()
    .withMessage('Spot type is required')
    .isIn(Object.values(SpotType))
    .withMessage(`Spot type must be one of: ${Object.values(SpotType).join(', ')}`),

  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('assignedPlotId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Plot ID'),

  body('vehicleNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('Vehicle number must be a string'),

  body('vehicleType')
    .optional()
    .isIn(Object.values(VehicleType))
    .withMessage(`Vehicle type must be one of: ${Object.values(VehicleType).join(', ')}`),

  body('isOccupied')
    .optional()
    .isBoolean()
    .withMessage('isOccupied must be a boolean'),

  body('isAvailableForRent')
    .optional()
    .isBoolean()
    .withMessage('isAvailableForRent must be a boolean'),

  body('rentPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rent price must be a positive number'),

  body('status')
    .optional()
    .isIn(Object.values(SpotStatus))
    .withMessage(`Status must be one of: ${Object.values(SpotStatus).join(', ')}`),

  body('location')
    .optional()
    .trim()
    .isString()
    .withMessage('Location must be a string'),
];

export const validateUpdateSpot = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Spot ID'),

  body('spotNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('Spot number must be a string'),

  body('blockId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Block ID'),

  body('spotType')
    .optional()
    .isIn(Object.values(SpotType))
    .withMessage(`Spot type must be one of: ${Object.values(SpotType).join(', ')}`),

  body('vehicleNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('Vehicle number must be a string'),

  body('vehicleType')
    .optional()
    .isIn(Object.values(VehicleType))
    .withMessage(`Vehicle type must be one of: ${Object.values(VehicleType).join(', ')}`),

  body('isOccupied')
    .optional()
    .isBoolean()
    .withMessage('isOccupied must be a boolean'),

  body('status')
    .optional()
    .isIn(Object.values(SpotStatus))
    .withMessage(`Status must be one of: ${Object.values(SpotStatus).join(', ')}`),

  body('location')
    .optional()
    .trim()
    .isString()
    .withMessage('Location must be a string'),
];

export const validateAssignSpot = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Spot ID'),

  body('memberId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('vehicleNumber')
    .trim()
    .notEmpty()
    .withMessage('Vehicle number is required'),

  body('plotId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Plot ID'),
];

export const validateUnassignSpot = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Spot ID'),
];

export const validateToggleRent = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Spot ID'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
];

export const validateGetSpots = (): ValidationChain[] => [
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
    .isString()
    .withMessage('Search must be a string'),

  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('spotType')
    .optional()
    .isIn(Object.values(SpotType))
    .withMessage(`Spot type must be one of: ${Object.values(SpotType).join(', ')}`),

  query('status')
    .optional()
    .isIn(Object.values(SpotStatus))
    .withMessage(`Status must be one of: ${Object.values(SpotStatus).join(', ')}`),

  query('isOccupied')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isOccupied must be true or false'),

  query('isAvailableForRent')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isAvailableForRent must be true or false'),

  query('blockId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Block ID'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'spotNumber', 'spotType', 'status'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

// ── Pass Validators ──

export const validateIssuePass = (): ValidationChain[] => [
  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('spotId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Spot ID'),

  body('issuedTo')
    .trim()
    .notEmpty()
    .withMessage('Issued to is required')
    .isLength({ max: 200 })
    .withMessage('Issued to cannot exceed 200 characters'),

  body('vehicleNumber')
    .trim()
    .notEmpty()
    .withMessage('Vehicle number is required'),

  body('vehicleType')
    .optional()
    .trim()
    .isString()
    .withMessage('Vehicle type must be a string'),

  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Purpose is required')
    .isIn(Object.values(PassPurpose))
    .withMessage(`Purpose must be one of: ${Object.values(PassPurpose).join(', ')}`),

  body('authorizedBy')
    .optional()
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('validFrom')
    .trim()
    .notEmpty()
    .withMessage('Valid from date is required')
    .isISO8601()
    .withMessage('Invalid valid from date format')
    .toDate(),

  body('validUntil')
    .trim()
    .notEmpty()
    .withMessage('Valid until date is required')
    .isISO8601()
    .withMessage('Invalid valid until date format')
    .toDate(),
];

export const validateGetPasses = (): ValidationChain[] => [
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
    .isString()
    .withMessage('Search must be a string'),

  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('purpose')
    .optional()
    .isIn(Object.values(PassPurpose))
    .withMessage(`Purpose must be one of: ${Object.values(PassPurpose).join(', ')}`),

  query('status')
    .optional()
    .isIn(Object.values(PassStatus))
    .withMessage(`Status must be one of: ${Object.values(PassStatus).join(', ')}`),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'validFrom', 'validUntil', 'issuedTo'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateVerifyPass = (): ValidationChain[] => [
  param('code')
    .trim()
    .notEmpty()
    .withMessage('Pass code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Pass code must be 6 characters')
    .isAlphanumeric()
    .withMessage('Pass code must be alphanumeric'),
];

export const validateCancelPass = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Pass ID'),
];
