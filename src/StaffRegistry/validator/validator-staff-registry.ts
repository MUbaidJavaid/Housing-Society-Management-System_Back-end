import { body, param, query, ValidationChain } from 'express-validator';

const STAFF_TYPES = ['maid', 'driver', 'cook', 'gardener', 'guard', 'sweeper', 'nanny', 'tutor', 'other'];
const VERIFICATION_METHODS = ['cnic_check', 'reference', 'police_clearance', 'self_declared'];

export const validateCreateStaff = (): ValidationChain[] => [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Full name must be between 2 and 200 characters'),

  body('cnic')
    .trim()
    .notEmpty()
    .withMessage('CNIC is required')
    .matches(/^\d{13}$/)
    .withMessage('CNIC must be exactly 13 digits'),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('Phone must be between 7 and 20 characters'),

  body('photo')
    .optional()
    .trim()
    .isURL()
    .withMessage('Photo must be a valid URL'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('staffType')
    .trim()
    .notEmpty()
    .withMessage('Staff type is required')
    .isIn(STAFF_TYPES)
    .withMessage(`Staff type must be one of: ${STAFF_TYPES.join(', ')}`),

  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),

  body('skills.*')
    .optional()
    .isString()
    .withMessage('Each skill must be a string'),

  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),

  body('languages.*')
    .optional()
    .isString()
    .withMessage('Each language must be a string'),

  body('documents')
    .optional()
    .isArray()
    .withMessage('Documents must be an array'),

  body('documents.*.type')
    .optional()
    .isString()
    .withMessage('Document type must be a string'),

  body('documents.*.fileUrl')
    .optional()
    .isURL()
    .withMessage('Document file URL must be a valid URL'),
];

export const validateUpdateStaff = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid staff ID'),

  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Full name must be between 2 and 200 characters'),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('Phone must be between 7 and 20 characters'),

  body('photo')
    .optional()
    .trim()
    .isURL()
    .withMessage('Photo must be a valid URL'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('staffType')
    .optional()
    .isIn(STAFF_TYPES)
    .withMessage(`Staff type must be one of: ${STAFF_TYPES.join(', ')}`),

  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),

  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),
];

export const validateVerifyStaff = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid staff ID'),

  body('method')
    .trim()
    .notEmpty()
    .withMessage('Verification method is required')
    .isIn(VERIFICATION_METHODS)
    .withMessage(`Verification method must be one of: ${VERIFICATION_METHODS.join(', ')}`),
];

export const validateAddEmployment = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid staff ID'),

  body('memberId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid member ID'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid society ID'),

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isLength({ max: 100 })
    .withMessage('Role cannot exceed 100 characters'),
];

export const validateEndEmployment = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid staff ID'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid society ID'),

  body('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('review')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review cannot exceed 1000 characters'),
];

export const validateRateStaff = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid staff ID'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid society ID'),

  body('memberId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid member ID'),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('review')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review cannot exceed 1000 characters'),
];

export const validateBlacklistStaff = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid staff ID'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Blacklist reason is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
];

export const validateCnicParam = (): ValidationChain[] => [
  param('cnic')
    .trim()
    .matches(/^\d{13}$/)
    .withMessage('CNIC must be exactly 13 digits'),
];

export const validateSocietyIdParam = (): ValidationChain[] => [
  param('societyId').isMongoId().withMessage('Invalid society ID'),
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

  query('staffType')
    .optional()
    .isIn(STAFF_TYPES)
    .withMessage(`Staff type must be one of: ${STAFF_TYPES.join(', ')}`),

  query('isVerified')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isVerified must be true or false'),

  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),

  query('blacklisted')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('blacklisted must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'fullName', 'averageRating', 'staffType'])
    .withMessage('Sort by must be one of: createdAt, fullName, averageRating, staffType'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];
