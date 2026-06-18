import { body, param, query, ValidationChain } from 'express-validator';
import { ThreadCategory, ThreadStatus } from '../types/types-forum';

// ── Thread Validators ──

export const validateCreateThread = (): ValidationChain[] => [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 300 })
    .withMessage('Title cannot exceed 300 characters'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(Object.values(ThreadCategory))
    .withMessage(`Category must be one of: ${Object.values(ThreadCategory).join(', ')}`),

  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isString()
    .withMessage('Each tag must be a string'),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),

  body('attachments.*.name')
    .optional()
    .isString()
    .withMessage('Attachment name must be a string'),

  body('attachments.*.fileUrl')
    .optional()
    .isString()
    .withMessage('Attachment file URL must be a string'),
];

export const validateUpdateThread = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Thread ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Title cannot exceed 300 characters'),

  body('content')
    .optional()
    .trim()
    .isString()
    .withMessage('Content must be a string'),

  body('category')
    .optional()
    .isIn(Object.values(ThreadCategory))
    .withMessage(`Category must be one of: ${Object.values(ThreadCategory).join(', ')}`),

  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),

  body('status')
    .optional()
    .isIn(Object.values(ThreadStatus))
    .withMessage(`Status must be one of: ${Object.values(ThreadStatus).join(', ')}`),
];

export const validateGetThreads = (): ValidationChain[] => [
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

  query('category')
    .optional()
    .isIn(Object.values(ThreadCategory))
    .withMessage(`Category must be one of: ${Object.values(ThreadCategory).join(', ')}`),

  query('isPinned')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isPinned must be true or false'),

  query('status')
    .optional()
    .isIn(Object.values(ThreadStatus))
    .withMessage(`Status must be one of: ${Object.values(ThreadStatus).join(', ')}`),

  query('authorId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Author ID'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'lastReplyAt', 'viewCount', 'replyCount', 'likeCount'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

// ── Reply Validators ──

export const validateCreateReply = (): ValidationChain[] => [
  param('threadId')
    .isMongoId()
    .withMessage('Invalid Thread ID'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required'),

  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),

  body('parentReplyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent reply ID'),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),

  body('attachments.*.name')
    .optional()
    .isString()
    .withMessage('Attachment name must be a string'),

  body('attachments.*.fileUrl')
    .optional()
    .isString()
    .withMessage('Attachment file URL must be a string'),
];

export const validateUpdateReply = (): ValidationChain[] => [
  param('threadId')
    .isMongoId()
    .withMessage('Invalid Thread ID'),

  param('replyId')
    .isMongoId()
    .withMessage('Invalid Reply ID'),

  body('content')
    .optional()
    .trim()
    .isString()
    .withMessage('Content must be a string'),

  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
];

export const validateGetReplies = (): ValidationChain[] => [
  param('threadId')
    .isMongoId()
    .withMessage('Invalid Thread ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('parentReplyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent reply ID'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'likeCount'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateThreadIdParam = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Thread ID'),
];

export const validateReplyIdParam = (): ValidationChain[] => [
  param('threadId')
    .isMongoId()
    .withMessage('Invalid Thread ID'),

  param('replyId')
    .isMongoId()
    .withMessage('Invalid Reply ID'),
];
