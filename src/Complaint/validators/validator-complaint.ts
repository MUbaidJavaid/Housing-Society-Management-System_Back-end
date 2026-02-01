import { body, param, query, ValidationChain } from 'express-validator';
import { ComplaintPriority } from '../types/types-complaint';

export const validateCreateComplaint = (): ValidationChain[] => [
  body('memId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('compCatId')
    .trim()
    .notEmpty()
    .withMessage('Complaint category ID is required')
    .isMongoId()
    .withMessage('Invalid Complaint Category ID'),

  body('compTitle')
    .trim()
    .notEmpty()
    .withMessage('Complaint title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Complaint title must be between 5 and 200 characters'),

  body('compDescription')
    .trim()
    .notEmpty()
    .withMessage('Complaint description is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Complaint description must be between 10 and 5000 characters'),

  body('fileId').optional().isMongoId().withMessage('Invalid File ID'),

  body('compDate').optional().isISO8601().withMessage('Invalid complaint date format').toDate(),

  body('compPriority')
    .optional()
    .isIn(Object.values(ComplaintPriority))
    .withMessage('Invalid complaint priority'),

  body('statusId').optional().isMongoId().withMessage('Invalid Status ID'),

  body('assignedTo').optional().isMongoId().withMessage('Invalid Assigned Staff ID'),

  body('attachmentPaths').optional().isArray().withMessage('Attachment paths must be an array'),

  body('attachmentPaths.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each attachment path must be a string'),

  body('slaHours').optional().isFloat({ min: 1 }).withMessage('SLA hours must be at least 1'),

  body('tags').optional().isArray().withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters'),

  body('followUpDate').optional().isISO8601().withMessage('Invalid follow-up date format').toDate(),
];

export const validateUpdateComplaint = (): ValidationChain[] => [
  ...validateCreateComplaint().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Complaint ID'),
];

export const validateGetComplaints = (): ValidationChain[] => [
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

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('memId').optional().isMongoId().withMessage('Invalid Member ID'),

  query('fileId').optional().isMongoId().withMessage('Invalid File ID'),

  query('compCatId').optional().isMongoId().withMessage('Invalid Complaint Category ID'),

  query('statusId').optional().isMongoId().withMessage('Invalid Status ID'),

  query('assignedTo').optional().isMongoId().withMessage('Invalid Assigned Staff ID'),

  query('compPriority')
    .optional()
    .isIn(Object.values(ComplaintPriority))
    .withMessage('Invalid complaint priority'),

  query('fromDate').optional().isISO8601().withMessage('Invalid from date format'),

  query('toDate').optional().isISO8601().withMessage('Invalid to date format'),

  query('slaBreached').optional().isBoolean().withMessage('slaBreached must be true or false'),

  query('isEscalated').optional().isBoolean().withMessage('isEscalated must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['compDate', 'dueDate', 'compPriority', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('compDate'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];

export const validateAssignComplaint = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Complaint ID'),

  body('assignedTo')
    .trim()
    .notEmpty()
    .withMessage('Staff member ID is required')
    .isMongoId()
    .withMessage('Invalid Staff ID'),

  body('estimatedResolutionDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid estimated resolution date format')
    .toDate(),
];

export const validateResolveComplaint = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Complaint ID'),

  body('resolutionNotes')
    .trim()
    .notEmpty()
    .withMessage('Resolution notes are required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Resolution notes must be between 10 and 2000 characters'),

  body('satisfactionRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Satisfaction rating must be between 1 and 5'),

  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback cannot exceed 1000 characters'),
];

export const validateEscalateComplaint = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Complaint ID'),

  body('escalationLevel')
    .isInt({ min: 1, max: 5 })
    .withMessage('Escalation level must be between 1 and 5'),

  body('assignedTo').optional().isMongoId().withMessage('Invalid Staff ID'),

  body('notes')
    .trim()
    .notEmpty()
    .withMessage('Escalation notes are required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Escalation notes must be between 10 and 1000 characters'),
];

export const validateBulkStatusUpdate = (): ValidationChain[] => [
  body('complaintIds').isArray({ min: 1 }).withMessage('Complaint IDs must be a non-empty array'),

  body('complaintIds.*').isMongoId().withMessage('Invalid Complaint ID'),

  body('statusId')
    .trim()
    .notEmpty()
    .withMessage('Status ID is required')
    .isMongoId()
    .withMessage('Invalid Status ID'),

  body('resolutionNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Resolution notes cannot exceed 2000 characters'),
];

export const validateAddAttachment = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Complaint ID'),

  body('attachmentPath')
    .trim()
    .notEmpty()
    .withMessage('Attachment path is required')
    .isLength({ max: 500 })
    .withMessage('Attachment path too long'),
];

export const validateRemoveAttachment = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Complaint ID'),

  body('attachmentPath')
    .trim()
    .notEmpty()
    .withMessage('Attachment path is required')
    .isLength({ max: 500 })
    .withMessage('Attachment path too long'),
];
