import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateUserStaff = (): ValidationChain[] => [
  body('userName')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Username can only contain letters, numbers, dots and underscores')
    .toLowerCase(),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('cnic')
    .trim()
    .notEmpty()
    .withMessage('CNIC is required')
    .matches(/^\d{5}-\d{7}-\d{1}$/)
    .withMessage('Please provide a valid CNIC (XXXXX-XXXXXXX-X)'),

  body('mobileNo')
    .optional()
    .trim()
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage('Please provide a valid mobile number'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('roleId')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isMongoId()
    .withMessage('Invalid Role ID'),

  body('cityId')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isMongoId()
    .withMessage('Invalid City ID'),

  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Designation cannot exceed 100 characters'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').default(true),
];

export const validateUpdateUserStaff = (): ValidationChain[] => [
  body('userName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Username cannot be empty')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Username can only contain letters, numbers, dots and underscores')
    .toLowerCase(),

  body('password')
    .optional()
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('cnic')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('CNIC cannot be empty')
    .matches(/^\d{5}-\d{7}-\d{1}$/)
    .withMessage('Please provide a valid CNIC (XXXXX-XXXXXXX-X)'),

  body('mobileNo')
    .optional()
    .trim()
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage('Please provide a valid mobile number'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('roleId').optional().trim().isMongoId().withMessage('Invalid Role ID'),

  body('cityId').optional().trim().isMongoId().withMessage('Invalid City ID'),

  body('designation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Designation cannot exceed 100 characters'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),

  param('id').isMongoId().withMessage('Invalid User ID'),
];

export const validateGetUserStaffs = (): ValidationChain[] => [
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

  query('roleId').optional().isMongoId().withMessage('Invalid Role ID'),

  query('cityId').optional().isMongoId().withMessage('Invalid City ID'),

  query('designation').optional().trim().isLength({ max: 100 }).withMessage('Designation too long'),

  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['userName', 'fullName', 'email', 'designation', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('createdAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];

export const validateRoleIdParam = (): ValidationChain[] => [
  param('roleId').isMongoId().withMessage('Invalid Role ID'),
];

export const validateCityIdParam = (): ValidationChain[] => [
  param('cityId').isMongoId().withMessage('Invalid City ID'),
];

export const validateChangePassword = (): ValidationChain[] => [
  body('currentPassword').trim().notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),

  body('confirmPassword')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const validateResetPassword = (): ValidationChain[] => [
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),

  body('confirmPassword')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  param('id').isMongoId().withMessage('Invalid User ID'),
];

export const validateChangeUserStatus = (): ValidationChain[] => [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];
