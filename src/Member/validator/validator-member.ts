import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateMember = (): ValidationChain[] => [
  body('memName')
    .trim()
    .notEmpty()
    .withMessage('Member Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Member Name must be between 2 and 100 characters'),

  body('memNic')
    .trim()
    .notEmpty()
    .withMessage('NIC is required')
    .isLength({ min: 13, max: 15 })
    .withMessage('NIC must be between 13 and 15 characters'),

  body('memAddr1')
    .trim()
    .notEmpty()
    .withMessage('Address Line 1 is required')
    .isLength({ max: 200 })
    .withMessage('Address Line 1 cannot exceed 200 characters'),

  body('memContMob')
    .trim()
    .notEmpty()
    .withMessage('Mobile Contact is required')
    .isLength({ max: 20 })
    .withMessage('Mobile Contact cannot exceed 20 characters'),

  body('memContEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),

  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),

  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender value'),

  body('memFHRelation')
    .optional()
    .isIn(['father', 'husband', 'guardian'])
    .withMessage('Invalid relation value'),

  body('statusId').optional().isMongoId().withMessage('Invalid Status ID'),

  body('cityId').optional().isMongoId().withMessage('Invalid City ID'),
];

export const validateUpdateMember = (): ValidationChain[] => [
  ...validateCreateMember().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Member ID'),
];

export const validateGetMembers = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),

  query('statusId').optional().isMongoId().withMessage('Invalid Status ID'),

  query('cityId').optional().isMongoId().withMessage('Invalid City ID'),

  query('memIsOverseas')
    .optional()
    .isBoolean()
    .withMessage('Overseas filter must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['memName', 'memNic', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
