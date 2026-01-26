import { body, query } from 'express-validator';
import { plotCategoryService } from '../services/service-plotcategory';

export const validateCreatePlotCategory = [
  body('categoryName')
    .notEmpty()
    .withMessage('Category Name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category Name must be 2-100 characters')
    .custom(async value => {
      const exists = await plotCategoryService.checkPlotCategoryExists(value);
      if (exists) {
        throw new Error('Plot Category with this name already exists');
      }
      return true;
    }),

  body('surchargePercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Surcharge percentage must be between 0 and 100'),

  body('surchargeFixedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Surcharge fixed amount cannot be negative'),

  body('categoryDesc')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),

  // Custom validator to ensure only one type of surcharge
  body().custom((_value, { req }) => {
    if (req.body.surchargePercentage && req.body.surchargeFixedAmount) {
      throw new Error('Cannot have both percentage and fixed amount surcharge');
    }
    return true;
  }),
];

export const validateUpdatePlotCategory = [
  body('categoryName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category Name must be 2-100 characters')
    .custom(async (value, { req }) => {
      const exists = await plotCategoryService.checkPlotCategoryExists(value, req.params?.id);
      if (exists) {
        throw new Error('Plot Category with this name already exists');
      }
      return true;
    }),

  body('surchargePercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Surcharge percentage must be between 0 and 100'),

  body('surchargeFixedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Surcharge fixed amount cannot be negative'),

  body('categoryDesc')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),

  // Custom validator to ensure only one type of surcharge
  body().custom((_value, { req }) => {
    if (req.body.surchargePercentage !== undefined && req.body.surchargeFixedAmount !== undefined) {
      if (req.body.surchargePercentage > 0 && req.body.surchargeFixedAmount > 0) {
        throw new Error('Cannot have both percentage and fixed amount surcharge');
      }
    }
    return true;
  }),
];

export const validateGetPlotCategories = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
  query('surchargeType')
    .optional()
    .isIn(['percentage', 'fixed', 'none'])
    .withMessage('Invalid surcharge type'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

export const validateCalculatePrice = [
  body('basePrice')
    .notEmpty()
    .withMessage('Base price is required')
    .isFloat({ min: 0.01 })
    .withMessage('Base price must be greater than 0'),

  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid Category ID format'),
];

export const validateBulkUpdateSurcharge = [
  body('categoryIds')
    .notEmpty()
    .withMessage('Category IDs are required')
    .isArray()
    .withMessage('Category IDs must be an array')
    .custom(value => value.length > 0)
    .withMessage('At least one category ID is required'),

  body('surchargePercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Surcharge percentage must be between 0 and 100'),

  body('surchargeFixedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Surcharge fixed amount cannot be negative'),

  // Custom validator to ensure only one type of surcharge
  body().custom((_value, { req }) => {
    if (req.body.surchargePercentage !== undefined && req.body.surchargeFixedAmount !== undefined) {
      throw new Error('Cannot set both percentage and fixed amount surcharge');
    }
    return true;
  }),
];
