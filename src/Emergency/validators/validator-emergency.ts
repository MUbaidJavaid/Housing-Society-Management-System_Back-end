import { body, param, query, ValidationChain } from 'express-validator';

export const validateTriggerAlert = (): ValidationChain[] => [
  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('alertType')
    .trim()
    .notEmpty()
    .withMessage('Alert type is required')
    .isIn(['sos', 'fire', 'medical', 'security', 'natural_disaster', 'gas_leak', 'other'])
    .withMessage('Alert type must be one of: sos, fire, medical, security, natural_disaster, gas_leak, other'),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),

  body('description').optional().trim(),

  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be one of: low, medium, high, critical'),

  body('affectedArea').optional().trim(),

  body('triggerLocation').optional(),

  body('triggerLocation.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('triggerLocation.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('attachments').optional().isArray().withMessage('Attachments must be an array'),
];

export const validateRespondToAlert = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Alert ID'),

  body('action')
    .trim()
    .notEmpty()
    .withMessage('Action description is required'),
];

export const validateResolveAlert = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Alert ID'),

  body('notes').optional().trim(),
];

export const validateAlertHistory = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('societyId').optional().isMongoId().withMessage('Invalid Society ID'),

  query('alertType')
    .optional()
    .isIn(['sos', 'fire', 'medical', 'security', 'natural_disaster', 'gas_leak', 'other'])
    .withMessage('Invalid alert type'),

  query('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity'),

  query('status')
    .optional()
    .isIn(['active', 'responding', 'resolved', 'false_alarm'])
    .withMessage('Invalid status'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'severity', 'alertType', 'status'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateUpsertMedicalProfile = (): ValidationChain[] => [
  body('bloodGroup').optional().trim(),

  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),

  body('medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array'),

  body('medicalConditions')
    .optional()
    .isArray()
    .withMessage('Medical conditions must be an array'),

  body('emergencyContact').optional(),

  body('emergencyContact.name').optional().trim(),

  body('emergencyContact.phone').optional().trim(),

  body('emergencyContact.relationship').optional().trim(),

  body('doctorName').optional().trim(),

  body('doctorPhone').optional().trim(),

  body('hospitalPreference').optional().trim(),

  body('insuranceInfo').optional().trim(),
];

export const validateIdParam = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Alert ID'),
];

export const validateFalseAlarm = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Alert ID'),
];
