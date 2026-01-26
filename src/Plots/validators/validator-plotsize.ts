import { body, query } from 'express-validator';
import { plotSizeService } from '../services/service-plotsize';

export const validateCreatePlotSize = [
  body('plotSizeName')
    .notEmpty()
    .withMessage('Plot Size Name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Plot Size Name must be 2-100 characters')
    .custom(async value => {
      const exists = await plotSizeService.checkPlotSizeExists(value);
      if (exists) {
        throw new Error('Plot Size with this name already exists');
      }
      return true;
    }),

  body('totalArea')
    .notEmpty()
    .withMessage('Total Area is required')
    .isFloat({ min: 0.01 })
    .withMessage('Total Area must be greater than 0'),

  body('areaUnit')
    .notEmpty()
    .withMessage('Area Unit is required')
    .isIn(plotSizeService.getAvailableAreaUnits())
    .withMessage('Invalid area unit'),

  body('ratePerUnit')
    .notEmpty()
    .withMessage('Rate per Unit is required')
    .isFloat({ min: 0 })
    .withMessage('Rate per Unit cannot be negative'),

  body('standardBasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Standard Base Price cannot be negative'),
];

export const validateUpdatePlotSize = [
  body('plotSizeName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Plot Size Name must be 2-100 characters')
    .custom(async (value, { req }) => {
      const exists = await plotSizeService.checkPlotSizeExists(value, req.params?.id);
      if (exists) {
        throw new Error('Plot Size with this name already exists');
      }
      return true;
    }),

  body('totalArea')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Total Area must be greater than 0'),

  body('areaUnit')
    .optional()
    .isIn(plotSizeService.getAvailableAreaUnits())
    .withMessage('Invalid area unit'),

  body('ratePerUnit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rate per Unit cannot be negative'),

  body('standardBasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Standard Base Price cannot be negative'),
];

export const validateGetPlotSizes = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be non-negative'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be non-negative'),
  query('minArea').optional().isFloat({ min: 0 }).withMessage('Minimum area must be non-negative'),
  query('maxArea').optional().isFloat({ min: 0 }).withMessage('Maximum area must be non-negative'),
  query('areaUnit')
    .optional()
    .isIn(plotSizeService.getAvailableAreaUnits())
    .withMessage('Invalid area unit'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

export const validateCalculatePrice = [
  body('totalArea')
    .notEmpty()
    .withMessage('Total Area is required')
    .isFloat({ min: 0.01 })
    .withMessage('Total Area must be greater than 0'),

  body('areaUnit')
    .notEmpty()
    .withMessage('Area Unit is required')
    .isIn(plotSizeService.getAvailableAreaUnits())
    .withMessage('Invalid area unit'),

  body('ratePerUnit')
    .notEmpty()
    .withMessage('Rate per Unit is required')
    .isFloat({ min: 0 })
    .withMessage('Rate per Unit cannot be negative'),
];

export const validateConvertArea = [
  body('value')
    .notEmpty()
    .withMessage('Value is required')
    .isFloat({ min: 0.01 })
    .withMessage('Value must be greater than 0'),

  body('fromUnit')
    .notEmpty()
    .withMessage('From Unit is required')
    .isIn(plotSizeService.getAvailableAreaUnits())
    .withMessage('Invalid from unit'),

  body('toUnit')
    .notEmpty()
    .withMessage('To Unit is required')
    .isIn(plotSizeService.getAvailableAreaUnits())
    .withMessage('Invalid to unit'),
];
