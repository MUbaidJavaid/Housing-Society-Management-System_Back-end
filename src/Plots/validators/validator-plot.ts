import { body, param, query, ValidationChain } from 'express-validator';
import Plot from '../models/models-plot';

// Middleware to load existing plot for updates
export const loadExistingPlot = async (req: any, _res: any, next: any) => {
  if (req.params.id) {
    req.existingPlot = await Plot.findById(req.params.id);
  }
  next();
};

export const validateCreatePlot = (): ValidationChain[] => [
  body('plotNo')
    .trim()
    .notEmpty()
    .withMessage('Plot Number is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('Plot Number must be between 1 and 20 characters'),

  body('plotBlockId').isMongoId().withMessage('Invalid Plot Block ID'),

  body('plotSizeId').isMongoId().withMessage('Invalid Plot Size ID'),

  body('plotTypeId').isMongoId().withMessage('Invalid Plot Type ID'),

  body('statusId').isMongoId().withMessage('Invalid Status ID'),

  body('plotAmount')
    .isFloat({ min: 0 })
    .withMessage('Plot Amount must be a positive number')
    .toFloat(),

  body('applicationTypeId').isMongoId().withMessage('Invalid Application Type ID'),

  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount Amount must be a positive number')
    .toFloat()
    .custom((value, { req }) => {
      const plotAmount = req.body.plotAmount;
      if (plotAmount != null && value > plotAmount) {
        throw new Error('Discount Amount cannot exceed Plot Amount');
      }
      return true;
    }),

  body('discountDate').optional().isISO8601().withMessage('Invalid discount date format'),

  body('plotStreet')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street cannot exceed 100 characters'),

  body('plotRemarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
];

export const validateUpdatePlot = (): ValidationChain[] => [
  ...validateCreatePlot().map(validation => validation.optional()),
  param('id').isMongoId().withMessage('Invalid Plot ID'),
];

export const validateGetPlots = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query too long'),

  query('plotBlockId').optional().isMongoId().withMessage('Invalid Plot Block ID'),

  query('plotSizeId').optional().isMongoId().withMessage('Invalid Plot Size ID'),

  query('plotTypeId').optional().isMongoId().withMessage('Invalid Plot Type ID'),

  query('applicationTypeId').optional().isMongoId().withMessage('Invalid Application Type ID'),

  query('sortBy')
    .optional()
    .isIn(['plotNo', 'plotAmount', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];
