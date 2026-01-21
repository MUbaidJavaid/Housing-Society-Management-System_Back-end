import { body, param, query, ValidationChain } from 'express-validator';
import { PaymentModeName } from '../models/models-paymentmodule';

export const validateCreatePaymentMode = (): ValidationChain[] => [
  body('paymentModeName')
    .trim()
    .notEmpty()
    .withMessage('Payment Mode Name is required')
    .isIn(Object.values(PaymentModeName))
    .withMessage('Invalid Payment Mode'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
];

export const validateUpdatePaymentMode = (): ValidationChain[] => [
  ...validateCreatePaymentMode().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Payment Mode ID'),
];

export const validateGetPaymentModes = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),

  query('sortBy')
    .optional()
    .isIn(['paymentModeName', 'createdAt', 'updatedAt', 'modifiedOn'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
