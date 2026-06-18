import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreatePoll = (): ValidationChain[] => [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('pollType')
    .trim()
    .notEmpty()
    .withMessage('Poll type is required')
    .isIn(['survey', 'vote', 'election', 'feedback'])
    .withMessage('Poll type must be one of: survey, vote, election, feedback'),

  body('options')
    .isArray({ min: 2 })
    .withMessage('At least 2 options are required'),

  body('options.*.text')
    .trim()
    .notEmpty()
    .withMessage('Option text is required'),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Please provide a valid start date'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),

  body('allowMultipleChoices')
    .optional()
    .isBoolean()
    .withMessage('allowMultipleChoices must be a boolean'),

  body('maxChoices')
    .optional()
    .isInt({ min: 1 })
    .withMessage('maxChoices must be a positive integer'),

  body('targetAudience')
    .optional(),

  body('targetAudience.type')
    .optional()
    .isIn(['all', 'block', 'role'])
    .withMessage('Target audience type must be one of: all, block, role'),
];

export const validateUpdatePoll = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Poll ID'),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty'),

  body('pollType')
    .optional()
    .isIn(['survey', 'vote', 'election', 'feedback'])
    .withMessage('Poll type must be one of: survey, vote, election, feedback'),

  body('options')
    .optional()
    .isArray({ min: 2 })
    .withMessage('At least 2 options are required'),

  body('options.*.text')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Option text is required'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),

  body('status')
    .optional()
    .isIn(['draft', 'active', 'closed', 'cancelled'])
    .withMessage('Invalid status'),
];

export const validateGetPolls = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('societyId').optional().isMongoId().withMessage('Invalid Society ID'),

  query('pollType')
    .optional()
    .isIn(['survey', 'vote', 'election', 'feedback'])
    .withMessage('Invalid poll type'),

  query('status')
    .optional()
    .isIn(['draft', 'active', 'closed', 'cancelled'])
    .withMessage('Invalid status'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'startDate', 'endDate', 'title', 'status'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateCastVote = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Poll ID'),

  body('optionIndexes')
    .isArray({ min: 1 })
    .withMessage('At least one option index is required'),

  body('optionIndexes.*')
    .isInt({ min: 0 })
    .withMessage('Option index must be a non-negative integer'),
];

export const validateIdParam = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Poll ID'),
];
