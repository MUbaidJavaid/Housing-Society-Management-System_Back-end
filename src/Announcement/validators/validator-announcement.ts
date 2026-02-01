import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateAnnouncement = (): ValidationChain[] => [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('announcementDesc')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),

  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description cannot exceed 500 characters'),

  body('authorId')
    .trim()
    .notEmpty()
    .withMessage('Author is required')
    .isMongoId()
    .withMessage('Invalid Author ID'),

  body('categoryId')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid Category ID'),

  body('targetType')
    .trim()
    .notEmpty()
    .withMessage('Target type is required')
    .isIn(['All', 'Block', 'Project', 'Individual'])
    .withMessage('Target type must be one of: All, Block, Project, Individual'),

  body('targetGroupId').optional().trim().isMongoId().withMessage('Invalid Target Group ID'),

  body('priorityLevel')
    .isInt({ min: 1, max: 3 })
    .withMessage('Priority level must be 1 (Low), 2 (Medium), or 3 (High)'),

  body('status')
    .optional()
    .isIn(['Draft', 'Published', 'Archived'])
    .withMessage('Status must be Draft, Published, or Archived')
    .default('Draft'),

  body('attachmentURL')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL')
    .isLength({ max: 500 })
    .withMessage('Attachment URL cannot exceed 500 characters'),

  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
];

export const validateUpdateAnnouncement = (): ValidationChain[] => [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('announcementDesc')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),

  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description cannot exceed 500 characters'),

  body('authorId').optional().trim().isMongoId().withMessage('Invalid Author ID'),

  body('categoryId').optional().trim().isMongoId().withMessage('Invalid Category ID'),

  body('targetType')
    .optional()
    .trim()
    .isIn(['All', 'Block', 'Project', 'Individual'])
    .withMessage('Target type must be one of: All, Block, Project, Individual'),

  body('targetGroupId').optional().trim().isMongoId().withMessage('Invalid Target Group ID'),

  body('priorityLevel')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('Priority level must be 1 (Low), 2 (Medium), or 3 (High)'),

  body('status')
    .optional()
    .isIn(['Draft', 'Published', 'Archived'])
    .withMessage('Status must be Draft, Published, or Archived'),

  body('attachmentURL')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL')
    .isLength({ max: 500 })
    .withMessage('Attachment URL cannot exceed 500 characters'),

  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),

  param('id').isMongoId().withMessage('Invalid Announcement ID'),
];

export const validateGetAnnouncements = (): ValidationChain[] => [
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

  query('categoryId').optional().isMongoId().withMessage('Invalid Category ID'),

  query('authorId').optional().isMongoId().withMessage('Invalid Author ID'),

  query('targetType')
    .optional()
    .isIn(['All', 'Block', 'Project', 'Individual'])
    .withMessage('Target type must be one of: All, Block, Project, Individual'),

  query('targetGroupId').optional().isMongoId().withMessage('Invalid Target Group ID'),

  query('priorityLevel')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('Priority level must be 1, 2, or 3'),

  query('status')
    .optional()
    .isIn(['Draft', 'Published', 'Archived'])
    .withMessage('Status must be Draft, Published, or Archived'),

  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),

  query('isPushNotificationSent')
    .optional()
    .isBoolean()
    .withMessage('isPushNotificationSent must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['title', 'priorityLevel', 'publishedAt', 'expiresAt', 'createdAt', 'updatedAt', 'views'])
    .withMessage('Invalid sort field')
    .default('createdAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];

export const validateGetActiveAnnouncements = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .default(1),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .default(10),

  query('categoryId').optional().isMongoId().withMessage('Invalid Category ID'),

  query('priorityLevel')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('Priority level must be 1, 2, or 3'),

  query('targetType')
    .optional()
    .isIn(['All', 'Block', 'Project', 'Individual'])
    .withMessage('Target type must be one of: All, Block, Project, Individual'),

  query('targetGroupId').optional().isMongoId().withMessage('Invalid Target Group ID'),

  query('includeExpired')
    .optional()
    .isBoolean()
    .withMessage('includeExpired must be true or false')
    .default(false),
];

export const validatePublishAnnouncement = (): ValidationChain[] => [
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),

  body('sendPushNotification')
    .optional()
    .isBoolean()
    .withMessage('sendPushNotification must be true or false')
    .default(false),

  param('id').isMongoId().withMessage('Invalid Announcement ID'),
];

export const validateCategoryIdParam = (): ValidationChain[] => [
  param('categoryId').isMongoId().withMessage('Invalid Category ID'),
];

export const validateAuthorIdParam = (): ValidationChain[] => [
  param('authorId').isMongoId().withMessage('Invalid Author ID'),
];
