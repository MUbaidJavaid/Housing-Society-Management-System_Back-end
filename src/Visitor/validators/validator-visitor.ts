import { body, param, query, ValidationChain } from 'express-validator';
import { VehicleType, VisitorPurpose, VisitorStatus } from '../types/types-visitor';

export const validateCreateVisitor = (): ValidationChain[] => [
  body('visitorName')
    .trim()
    .notEmpty()
    .withMessage('Visitor name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Visitor name must be between 2 and 200 characters'),

  body('visitorPhone')
    .trim()
    .notEmpty()
    .withMessage('Visitor phone is required'),

  body('visitorNic')
    .optional()
    .trim()
    .isString()
    .withMessage('Visitor NIC must be a string'),

  body('visitorEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address'),

  body('visitorCompany')
    .optional()
    .trim()
    .isString()
    .withMessage('Visitor company must be a string'),

  body('visitorPhoto')
    .optional()
    .trim()
    .isString()
    .withMessage('Visitor photo must be a string'),

  body('vehicleNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('Vehicle number must be a string'),

  body('vehicleType')
    .optional()
    .isIn(Object.values(VehicleType))
    .withMessage(`Vehicle type must be one of: ${Object.values(VehicleType).join(', ')}`),

  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Visit purpose is required')
    .isIn(Object.values(VisitorPurpose))
    .withMessage(`Purpose must be one of: ${Object.values(VisitorPurpose).join(', ')}`),

  body('hostMemberId')
    .trim()
    .notEmpty()
    .withMessage('Host member ID is required')
    .isMongoId()
    .withMessage('Invalid Host Member ID'),

  body('hostPlotId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Host Plot ID'),

  body('expectedDate')
    .trim()
    .notEmpty()
    .withMessage('Expected date is required')
    .isISO8601()
    .withMessage('Invalid expected date format')
    .toDate(),

  body('expectedTimeIn')
    .optional()
    .trim()
    .isString()
    .withMessage('Expected time in must be a string'),

  body('expectedTimeOut')
    .optional()
    .trim()
    .isString()
    .withMessage('Expected time out must be a string'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),

  body('gateNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('Gate number must be a string'),

  body('numberOfGuests')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of guests must be between 1 and 20'),

  body('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),
];

export const validateUpdateVisitor = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Visitor ID'),

  body('visitorName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Visitor name must be between 2 and 200 characters'),

  body('visitorPhone')
    .optional()
    .trim()
    .isString()
    .withMessage('Visitor phone must be a string'),

  body('visitorNic')
    .optional()
    .trim()
    .isString()
    .withMessage('Visitor NIC must be a string'),

  body('visitorEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address'),

  body('visitorCompany')
    .optional()
    .trim()
    .isString()
    .withMessage('Visitor company must be a string'),

  body('vehicleNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('Vehicle number must be a string'),

  body('vehicleType')
    .optional()
    .isIn(Object.values(VehicleType))
    .withMessage(`Vehicle type must be one of: ${Object.values(VehicleType).join(', ')}`),

  body('purpose')
    .optional()
    .isIn(Object.values(VisitorPurpose))
    .withMessage(`Purpose must be one of: ${Object.values(VisitorPurpose).join(', ')}`),

  body('hostMemberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Host Member ID'),

  body('hostPlotId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Host Plot ID'),

  body('expectedDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expected date format')
    .toDate(),

  body('expectedTimeIn')
    .optional()
    .trim()
    .isString()
    .withMessage('Expected time in must be a string'),

  body('expectedTimeOut')
    .optional()
    .trim()
    .isString()
    .withMessage('Expected time out must be a string'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),

  body('gateNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('Gate number must be a string'),

  body('numberOfGuests')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of guests must be between 1 and 20'),

  body('status')
    .optional()
    .isIn(Object.values(VisitorStatus))
    .withMessage(`Status must be one of: ${Object.values(VisitorStatus).join(', ')}`),
];

export const validateCheckIn = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Visitor ID'),

  body('gateNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('Gate number must be a string'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),
];

export const validateCheckOut = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Visitor ID'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),
];

export const validatePreApprove = (): ValidationChain[] => [
  body('visitorName')
    .trim()
    .notEmpty()
    .withMessage('Visitor name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Visitor name must be between 2 and 200 characters'),

  body('visitorPhone')
    .trim()
    .notEmpty()
    .withMessage('Visitor phone is required'),

  body('visitorNic')
    .optional()
    .trim()
    .isString()
    .withMessage('Visitor NIC must be a string'),

  body('visitorEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address'),

  body('visitorCompany')
    .optional()
    .trim()
    .isString()
    .withMessage('Visitor company must be a string'),

  body('vehicleNumber')
    .optional()
    .trim()
    .isString()
    .withMessage('Vehicle number must be a string'),

  body('vehicleType')
    .optional()
    .isIn(Object.values(VehicleType))
    .withMessage(`Vehicle type must be one of: ${Object.values(VehicleType).join(', ')}`),

  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Visit purpose is required')
    .isIn(Object.values(VisitorPurpose))
    .withMessage(`Purpose must be one of: ${Object.values(VisitorPurpose).join(', ')}`),

  body('hostPlotId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Host Plot ID'),

  body('expectedDate')
    .trim()
    .notEmpty()
    .withMessage('Expected date is required')
    .isISO8601()
    .withMessage('Invalid expected date format')
    .toDate(),

  body('expectedTimeIn')
    .optional()
    .trim()
    .isString()
    .withMessage('Expected time in must be a string'),

  body('expectedTimeOut')
    .optional()
    .trim()
    .isString()
    .withMessage('Expected time out must be a string'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),

  body('numberOfGuests')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of guests must be between 1 and 20'),
];

export const validateVerifyPassCode = (): ValidationChain[] => [
  param('passCode')
    .trim()
    .notEmpty()
    .withMessage('Pass code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Pass code must be 6 characters')
    .isAlphanumeric()
    .withMessage('Pass code must be alphanumeric'),
];

export const validateGetVisitors = (): ValidationChain[] => [
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

  query('status')
    .optional()
    .isIn(Object.values(VisitorStatus))
    .withMessage(`Status must be one of: ${Object.values(VisitorStatus).join(', ')}`),

  query('purpose')
    .optional()
    .isIn(Object.values(VisitorPurpose))
    .withMessage(`Purpose must be one of: ${Object.values(VisitorPurpose).join(', ')}`),

  query('hostMemberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Host Member ID'),

  query('hostPlotId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Host Plot ID'),

  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid from date format'),

  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid to date format'),

  query('preApproved')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('preApproved must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'expectedDate', 'visitorName', 'status', 'actualTimeIn'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];
