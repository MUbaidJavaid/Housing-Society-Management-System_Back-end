import { NextFunction, Request, Response } from 'express';
import { body, ValidationChain, validationResult } from 'express-validator';
import { passwordValidator } from '../password';

export const validate = (method: string): ValidationChain[] => {
  switch (method) {
    case 'register':
      return [
        body('email')
          .isEmail()
          .normalizeEmail()
          .withMessage('Please provide a valid email address'),

        body('password')
          .isLength({ min: 8 })
          .withMessage('Password must be at least 8 characters long')
          .custom((value: string) => {
            const validation = passwordValidator.validate(value);
            if (!validation.isValid) {
              throw new Error(validation.errors.join(', '));
            }
            return true;
          }),

        body('firstName')
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('First name must be between 2 and 50 characters'),

        body('lastName')
          .trim()
          .isLength({ min: 2, max: 50 })
          .withMessage('Last name must be between 2 and 50 characters'),

        body('phone')
          .optional()
          .isMobilePhone('any')
          .withMessage('Please provide a valid phone number'),
      ];

    case 'login':
      return [
        body('email')
          .isEmail()
          .normalizeEmail()
          .withMessage('Please provide a valid email address'),

        body('password').notEmpty().withMessage('Password is required'),
      ];

    case 'changePassword':
      return [
        body('currentPassword').notEmpty().withMessage('Current password is required'),

        body('newPassword')
          .isLength({ min: 8 })
          .withMessage('New password must be at least 8 characters long')
          .custom((value: string, { req }: { req: any }) => {
            if (value === req.body.currentPassword) {
              throw new Error('New password must be different from current password');
            }
            const validation = passwordValidator.validate(value);
            if (!validation.isValid) {
              throw new Error(validation.errors.join(', '));
            }
            return true;
          }),
      ];

    case 'forgotPassword':
      return [
        body('email')
          .isEmail()
          .normalizeEmail()
          .withMessage('Please provide a valid email address'),
      ];

    case 'resetPassword':
      return [
        body('token').notEmpty().withMessage('Reset token is required'),

        body('newPassword')
          .isLength({ min: 8 })
          .withMessage('New password must be at least 8 characters long')
          .custom((value: string) => {
            const validation = passwordValidator.validate(value);
            if (!validation.isValid) {
              throw new Error(validation.errors.join(', '));
            }
            return true;
          }),
      ];

    case 'verifyEmail':
      return [body('token').notEmpty().withMessage('Verification token is required')];

    case 'resendVerification':
      return [
        body('email')
          .isEmail()
          .normalizeEmail()
          .withMessage('Please provide a valid email address'),
      ];

    default:
      return [];
  }
};

// Middleware to check validation results
export const checkValidation = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map((err: any) => ({
        field: err.param,
        message: err.msg,
      })),
    });
    return;
  }

  next();
};
