import { body, param, query, ValidationChain } from 'express-validator';

const CATEGORIES = [
  'plumbing', 'electrical', 'carpentry', 'painting', 'pest_control',
  'hvac', 'elevator', 'generator', 'water_supply', 'sewerage',
  'road_repair', 'landscaping', 'security_equipment', 'other',
];

const STATUSES = [
  'submitted', 'acknowledged', 'assigned', 'in_progress',
  'on_hold', 'completed', 'verified', 'closed', 'rejected',
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const validateCreateMaintenanceRequest = (): ValidationChain[] => [
  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid society ID'),

  body('requestedBy')
    .trim()
    .notEmpty()
    .withMessage('Requested by is required')
    .isMongoId()
    .withMessage('Invalid member ID'),

  body('plotId')
    .optional()
    .isMongoId()
    .withMessage('Invalid plot ID'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 500 })
    .withMessage('Location cannot exceed 500 characters'),

  body('priority')
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),

  body('images.*.url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),

  body('images.*.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Image description cannot exceed 200 characters'),
];

export const validateUpdateMaintenanceRequest = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid request ID'),

  body('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location cannot exceed 500 characters'),

  body('priority')
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
];

export const validateAssignStaff = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid request ID'),

  body('staffId')
    .trim()
    .notEmpty()
    .withMessage('Staff ID is required')
    .isMongoId()
    .withMessage('Invalid staff ID'),
];

export const validateAssignVendor = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid request ID'),

  body('vendorId')
    .trim()
    .notEmpty()
    .withMessage('Vendor ID is required')
    .isMongoId()
    .withMessage('Invalid vendor ID'),

  body('estimatedCost')
    .notEmpty()
    .withMessage('Estimated cost is required')
    .isFloat({ min: 0 })
    .withMessage('Estimated cost must be a positive number'),

  body('estimatedDate')
    .notEmpty()
    .withMessage('Estimated completion date is required')
    .isISO8601()
    .withMessage('Estimated date must be a valid date'),
];

export const validateAddWorkLog = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid request ID'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Description must be between 5 and 1000 characters'),

  body('hoursWorked')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Hours worked must be between 0 and 24'),

  body('photos')
    .optional()
    .isArray()
    .withMessage('Photos must be an array'),

  body('photos.*')
    .optional()
    .isURL()
    .withMessage('Each photo must be a valid URL'),
];

export const validateSubmitFeedback = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid request ID'),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
];

export const validateRejectRequest = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid request ID'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
];

export const validateIdParam = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid ID'),
];

export const validateListQuery = (): ValidationChain[] => [
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
    .isLength({ max: 200 })
    .withMessage('Search term cannot exceed 200 characters'),

  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid society ID'),

  query('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),

  query('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  query('priority')
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),

  query('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid assigned to ID'),

  query('isOverdue')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isOverdue must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'priority', 'status', 'category', 'slaDeadline'])
    .withMessage('Sort by must be one of: createdAt, priority, status, category, slaDeadline'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];
