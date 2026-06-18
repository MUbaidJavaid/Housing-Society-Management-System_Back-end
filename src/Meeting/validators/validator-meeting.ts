import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateMeeting = (): ValidationChain[] => [
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

  body('meetingType')
    .trim()
    .notEmpty()
    .withMessage('Meeting type is required')
    .isIn(['agm', 'special', 'committee', 'emergency', 'general'])
    .withMessage('Meeting type must be one of: agm, special, committee, emergency, general'),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Please provide a valid date'),

  body('startTime')
    .trim()
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:mm format'),

  body('endTime')
    .optional()
    .trim()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:mm format'),

  body('description').optional().trim(),

  body('location').optional().trim(),

  body('isOnline').optional().isBoolean().withMessage('isOnline must be a boolean'),

  body('onlineLink').optional().trim(),

  body('quorumRequired')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Quorum required must be between 0 and 100'),

  body('agenda').optional().isArray().withMessage('Agenda must be an array'),

  body('agenda.*.title').optional().trim().notEmpty().withMessage('Agenda item title is required'),

  body('attendees').optional().isArray().withMessage('Attendees must be an array'),

  body('attendees.*.memberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid member ID in attendees'),
];

export const validateUpdateMeeting = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Meeting ID'),

  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),

  body('meetingType')
    .optional()
    .isIn(['agm', 'special', 'committee', 'emergency', 'general'])
    .withMessage('Meeting type must be one of: agm, special, committee, emergency, general'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),

  body('startTime')
    .optional()
    .trim()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:mm format'),

  body('endTime')
    .optional()
    .trim()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:mm format'),

  body('status')
    .optional()
    .isIn(['draft', 'scheduled', 'in-progress', 'completed', 'cancelled', 'adjourned'])
    .withMessage('Invalid status'),

  body('quorumRequired')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Quorum required must be between 0 and 100'),
];

export const validateGetMeetings = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('societyId').optional().isMongoId().withMessage('Invalid Society ID'),

  query('meetingType')
    .optional()
    .isIn(['agm', 'special', 'committee', 'emergency', 'general'])
    .withMessage('Invalid meeting type'),

  query('status')
    .optional()
    .isIn(['draft', 'scheduled', 'in-progress', 'completed', 'cancelled', 'adjourned'])
    .withMessage('Invalid status'),

  query('fromDate').optional().isISO8601().withMessage('Invalid from date'),

  query('toDate').optional().isISO8601().withMessage('Invalid to date'),

  query('sortBy')
    .optional()
    .isIn(['date', 'createdAt', 'title', 'status'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateAddAgendaItem = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Meeting ID'),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Agenda item title is required'),

  body('description').optional().trim(),

  body('presenter').optional().trim(),

  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (minutes)'),
];

export const validateUpdateMinutes = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Meeting ID'),

  body('minutes')
    .trim()
    .notEmpty()
    .withMessage('Minutes content is required'),
];

export const validateRecordAttendance = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Meeting ID'),

  body('memberId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('status')
    .trim()
    .notEmpty()
    .withMessage('Attendance status is required')
    .isIn(['invited', 'confirmed', 'attended', 'absent', 'proxy'])
    .withMessage('Status must be one of: invited, confirmed, attended, absent, proxy'),

  body('proxyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid proxy member ID'),
];

export const validateAddDecision = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Meeting ID'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Decision description is required'),

  body('decidedBy').optional().trim(),

  body('votesFor')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Votes for must be a non-negative integer'),

  body('votesAgainst')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Votes against must be a non-negative integer'),

  body('abstained')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Abstained must be a non-negative integer'),
];

export const validateCompleteMeeting = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Meeting ID'),
];

export const validateIdParam = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Meeting ID'),
];
