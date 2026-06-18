import { body, param, query, ValidationChain } from 'express-validator';

export const validateUpdatePrivacySettings = (): ValidationChain[] => [
  body('profileVisibility')
    .optional()
    .isIn(['everyone', 'committee-only', 'hidden'])
    .withMessage('Profile visibility must be everyone, committee-only, or hidden'),

  body('showEmail').optional().isBoolean().withMessage('showEmail must be true or false'),

  body('showPhone').optional().isBoolean().withMessage('showPhone must be true or false'),

  body('showAddress').optional().isBoolean().withMessage('showAddress must be true or false'),

  body('directoryOptOut')
    .optional()
    .isBoolean()
    .withMessage('directoryOptOut must be true or false'),

  body('allowAnonymousComplaints')
    .optional()
    .isBoolean()
    .withMessage('allowAnonymousComplaints must be true or false'),

  body('thirdPartySharing')
    .optional()
    .isBoolean()
    .withMessage('thirdPartySharing must be true or false'),

  body('showOnLeaderboard')
    .optional()
    .isBoolean()
    .withMessage('showOnLeaderboard must be true or false'),

  body('notificationPreferences')
    .optional()
    .isObject()
    .withMessage('notificationPreferences must be an object'),

  body('notificationPreferences.email')
    .optional()
    .isBoolean()
    .withMessage('notificationPreferences.email must be true or false'),

  body('notificationPreferences.push')
    .optional()
    .isBoolean()
    .withMessage('notificationPreferences.push must be true or false'),

  body('notificationPreferences.sms')
    .optional()
    .isBoolean()
    .withMessage('notificationPreferences.sms must be true or false'),

  body('notificationPreferences.digest')
    .optional()
    .isBoolean()
    .withMessage('notificationPreferences.digest must be true or false'),

  body('dataRetentionConsent')
    .optional()
    .isBoolean()
    .withMessage('dataRetentionConsent must be true or false'),

  body('marketingConsent')
    .optional()
    .isBoolean()
    .withMessage('marketingConsent must be true or false'),
];

export const validateGetAccessLog = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('accessType')
    .optional()
    .isIn([
      'view-profile',
      'view-contact',
      'view-documents',
      'export-data',
      'view-financial',
      'view-directory',
    ])
    .withMessage('Invalid access type'),

  query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO 8601 date'),

  query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO 8601 date'),

  query('sortBy')
    .optional()
    .isIn(['timestamp', 'accessType'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

export const validateUpdateConsent = (): ValidationChain[] => [
  param('consentType')
    .trim()
    .notEmpty()
    .withMessage('Consent type is required')
    .isIn([
      'dataRetentionConsent',
      'marketingConsent',
      'thirdPartySharing',
      'allowAnonymousComplaints',
    ])
    .withMessage('Invalid consent type'),

  body('granted').isBoolean().withMessage('granted must be true or false'),
];

export const validateGetMemberSettings = (): ValidationChain[] => [
  param('memberId').isMongoId().withMessage('Invalid Member ID'),
];
