import { body, query, ValidationChain } from 'express-validator';

export const validateCreateInstallmentPlan = (): ValidationChain[] => [
  body('projId')
    .notEmpty()
    .withMessage('Project is required')
    .isMongoId()
    .withMessage('Invalid Project ID'),

  body('planName')
    .notEmpty()
    .withMessage('Plan name is required')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Plan name must be between 3 and 100 characters'),

  body('totalMonths')
    .notEmpty()
    .withMessage('Total months is required')
    .isInt({ min: 1, max: 360 })
    .withMessage('Total months must be between 1 and 360'),

  body('totalAmount')
    .notEmpty()
    .withMessage('Total amount is required')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
];

export const validateUpdateInstallmentPlan = (): ValidationChain[] => [
  body('planName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Plan name must be between 3 and 100 characters'),

  body('totalMonths')
    .optional()
    .isInt({ min: 1, max: 360 })
    .withMessage('Total months must be between 1 and 360'),

  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
];

export const validateGetInstallmentPlans = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Project ID'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must be at least 1 character'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),

  query('sortBy')
    .optional()
    .isIn(['planName', 'totalMonths', 'totalAmount', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
];

export const validateSearchInstallmentPlans = (): ValidationChain[] => [
  query('q')
    .notEmpty()
    .withMessage('Search term is required')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];
