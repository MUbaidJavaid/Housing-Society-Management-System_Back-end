import { body, ValidationChain } from 'express-validator';

export const validateSignup = (): ValidationChain[] => [
  body('memNic')
    .trim()
    .notEmpty()
    .withMessage('CNIC is required')
    .isLength({ min: 13, max: 15 })
    .withMessage('CNIC must be 13-15 characters')
    .matches(/^[0-9]+$/)
    .withMessage('CNIC must contain only numeric characters')
    .customSanitizer(value => value.toUpperCase()),

  body('memContEmail')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),

  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const validateLogin = (): ValidationChain[] => [
  body('identifier').trim().notEmpty().withMessage('CNIC or Email is required'),

  body('password').trim().notEmpty().withMessage('Password is required'),
];

export const validateForgotPassword = (): ValidationChain[] => [
  body('identifier').trim().notEmpty().withMessage('CNIC or Email is required'),
];

export const validateResetPassword = (): ValidationChain[] => [
  body('token').trim().notEmpty().withMessage('Reset token is required'),

  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const validateChangePassword = (): ValidationChain[] => [
  body('currentPassword').trim().notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const validateProfileUpdate = (): ValidationChain[] => [
  body('memContEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),

  body('memContMob')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Invalid mobile number'),

  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),

  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),

  body('memName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
];

export const validateVerifyEmail = (): ValidationChain[] => [
  body('token').trim().notEmpty().withMessage('Verification token is required'),
];

export const validateResendVerification = (): ValidationChain[] => [
  body('identifier').trim().notEmpty().withMessage('CNIC or Email is required'),
];

export const validateRefreshToken = (): ValidationChain[] => [
  body('refreshToken').trim().notEmpty().withMessage('Refresh token is required'),
];

export const validateLogout = (): ValidationChain[] => [
  body('refreshToken').trim().notEmpty().withMessage('Refresh token is required'),
];
