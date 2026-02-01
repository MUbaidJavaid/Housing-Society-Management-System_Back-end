import { body, query, ValidationChain } from 'express-validator';
import { BillTypeCategory } from '../models/models-bill-type';

export const validateCreateBillType = (): ValidationChain[] => [
  body('billTypeName')
    .trim()
    .notEmpty()
    .withMessage('Bill type name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Bill type name must be between 2 and 100 characters'),

  body('billTypeCategory')
    .notEmpty()
    .withMessage('Bill type category is required')
    .isIn(Object.values(BillTypeCategory))
    .withMessage('Invalid bill type category'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('isRecurring')
    .notEmpty()
    .withMessage('Is recurring flag is required')
    .isBoolean()
    .withMessage('Is recurring must be a boolean'),

  body('defaultAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Default amount must be a positive number'),

  body('frequency')
    .optional()
    .isIn(['MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY', 'ONE_TIME', null])
    .withMessage('Invalid frequency'),

  body('calculationMethod')
    .optional()
    .isIn(['FIXED', 'PER_UNIT', 'PERCENTAGE', 'TIERED', null])
    .withMessage('Invalid calculation method'),

  body('unitType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Unit type cannot exceed 50 characters'),

  body('ratePerUnit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rate per unit must be a positive number'),

  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),

  body('isTaxable').optional().isBoolean().withMessage('Is taxable must be a boolean'),

  // Custom validation for recurring bill types
  body().custom((_value, { req }) => {
    if (req.body.isRecurring === true && !req.body.frequency) {
      throw new Error('Frequency is required for recurring bill types');
    }

    if (req.body.isRecurring === false && req.body.frequency && req.body.frequency !== 'ONE_TIME') {
      throw new Error('Non-recurring bill types can only have ONE_TIME frequency');
    }

    if (req.body.calculationMethod === 'PER_UNIT') {
      if (!req.body.unitType) {
        throw new Error('Unit type is required for PER_UNIT calculation method');
      }
      if (!req.body.ratePerUnit || req.body.ratePerUnit <= 0) {
        throw new Error(
          'Rate per unit is required and must be positive for PER_UNIT calculation method'
        );
      }
    }

    if (req.body.isTaxable === true && (!req.body.taxRate || req.body.taxRate <= 0)) {
      throw new Error('Tax rate is required and must be positive for taxable bill types');
    }

    return true;
  }),
];

export const validateUpdateBillType = (): ValidationChain[] => [
  body('billTypeName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Bill type name must be between 2 and 100 characters'),

  body('billTypeCategory')
    .optional()
    .isIn(Object.values(BillTypeCategory))
    .withMessage('Invalid bill type category'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('isRecurring').optional().isBoolean().withMessage('Is recurring must be a boolean'),

  body('defaultAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Default amount must be a positive number'),

  body('frequency')
    .optional()
    .isIn(['MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY', 'ONE_TIME', null])
    .withMessage('Invalid frequency'),

  body('calculationMethod')
    .optional()
    .isIn(['FIXED', 'PER_UNIT', 'PERCENTAGE', 'TIERED', null])
    .withMessage('Invalid calculation method'),

  body('unitType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Unit type cannot exceed 50 characters'),

  body('ratePerUnit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rate per unit must be a positive number'),

  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),

  body('isTaxable').optional().isBoolean().withMessage('Is taxable must be a boolean'),

  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
];

export const validateGetBillTypes = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),

  query('category')
    .optional()
    .isIn(Object.values(BillTypeCategory))
    .withMessage('Invalid bill type category'),

  query('isRecurring').optional().isBoolean().withMessage('Is recurring must be a boolean'),

  query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),

  query('sortBy')
    .optional()
    .isIn(['billTypeName', 'billTypeCategory', 'isRecurring', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
];

export const validateCalculateAmount = (): ValidationChain[] => [
  query('units').optional().isFloat({ min: 0 }).withMessage('Units must be a positive number'),

  query('baseAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base amount must be a positive number'),

  query('applyTax').optional().isBoolean().withMessage('Apply tax must be a boolean'),
];

export const validateBulkUpdateStatus = (): ValidationChain[] => [
  body('billTypeIds')
    .notEmpty()
    .withMessage('Bill type IDs are required')
    .isArray()
    .withMessage('Bill type IDs must be an array')
    .custom(ids => ids.length > 0)
    .withMessage('Bill type IDs array must not be empty')
    .custom(ids => ids.every((id: string) => typeof id === 'string'))
    .withMessage('All bill type IDs must be strings'),

  body('isActive')
    .notEmpty()
    .withMessage('Status is required')
    .isBoolean()
    .withMessage('Status must be a boolean'),
];
