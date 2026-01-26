import { body, param, query } from 'express-validator';
import { PlotType } from '../types/types-plot';

export const validateCreatePlot = [
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid Project ID format'),

  body('plotNo')
    .notEmpty()
    .withMessage('Plot Number is required')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Plot Number must be 1-20 characters'),

  body('plotBlockId')
    .notEmpty()
    .withMessage('Plot Block is required')
    .isMongoId()
    .withMessage('Invalid Plot Block ID format'),

  body('plotSizeId')
    .notEmpty()
    .withMessage('Plot Size is required')
    .isMongoId()
    .withMessage('Invalid Plot Size ID format'),

  body('plotType')
    .notEmpty()
    .withMessage('Plot Type is required')
    .isIn(Object.values(PlotType))
    .withMessage('Invalid plot type'),

  body('plotCategoryId')
    .notEmpty()
    .withMessage('Plot Category is required')
    .isMongoId()
    .withMessage('Invalid Plot Category ID format'),

  body('salesStatusId')
    .notEmpty()
    .withMessage('Sales Status is required')
    .isMongoId()
    .withMessage('Invalid Sales Status ID format'),

  body('plotLength')
    .notEmpty()
    .withMessage('Plot Length is required')
    .isFloat({ min: 1 })
    .withMessage('Plot Length must be greater than 0'),

  body('plotWidth')
    .notEmpty()
    .withMessage('Plot Width is required')
    .isFloat({ min: 1 })
    .withMessage('Plot Width must be greater than 0'),

  body('plotBasePrice')
    .notEmpty()
    .withMessage('Base Price is required')
    .isFloat({ min: 0 })
    .withMessage('Base Price cannot be negative'),

  body('plotTotalAmount')
    .notEmpty()
    .withMessage('Total Amount is required')
    .isFloat({ min: 0 })
    .withMessage('Total Amount cannot be negative'),

  body('plotAreaUnit')
    .optional()
    .isIn(['sqft', 'sqm', 'marla', 'kanal', 'acre'])
    .withMessage('Invalid area unit'),

  body('surchargeAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Surcharge cannot be negative'),

  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative'),

  body('discountDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => {
      if (value && new Date(value) > new Date()) {
        throw new Error('Discount Date cannot be in the future');
      }
      return true;
    }),

  body('plotFacing')
    .optional()
    .isIn(['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'])
    .withMessage('Invalid facing direction'),

  body('plotLatitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('plotLongitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  // Custom validator for price consistency
  body().custom((_value, { req }) => {
    const basePrice = req.body.plotBasePrice || 0;
    const surcharge = req.body.surchargeAmount || 0;
    const discount = req.body.discountAmount || 0;
    const totalAmount = req.body.plotTotalAmount || 0;

    if (totalAmount < basePrice + surcharge - discount) {
      throw new Error('Total amount is less than (base price + surcharge - discount)');
    }

    return true;
  }),
];

export const validateUpdatePlot = [
  param('id').isMongoId().withMessage('Invalid plot ID'),

  body('plotNo')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Plot Number must be 1-20 characters'),

  body('plotType').optional().isIn(Object.values(PlotType)).withMessage('Invalid plot type'),

  body('plotLength')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Plot Length must be greater than 0'),

  body('plotWidth').optional().isFloat({ min: 1 }).withMessage('Plot Width must be greater than 0'),

  body('plotBasePrice').optional().isFloat({ min: 0 }).withMessage('Base Price cannot be negative'),

  body('plotTotalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total Amount cannot be negative'),

  body('surchargeAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Surcharge cannot be negative'),

  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative'),

  body('discountDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => {
      if (value && new Date(value) > new Date()) {
        throw new Error('Discount Date cannot be in the future');
      }
      return true;
    }),

  body('plotFacing')
    .optional()
    .isIn(['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'])
    .withMessage('Invalid facing direction'),

  // Custom validator for price consistency
  body().custom(async (_value, { req }) => {
    if (
      (req.body.plotBasePrice !== undefined ||
        req.body.surchargeAmount !== undefined ||
        req.body.discountAmount !== undefined) &&
      req.params?.id
    ) {
      const plot = await require('../services/service-plot').getPlotById(req.params.id);
      if (plot) {
        const basePrice =
          req.body.plotBasePrice !== undefined ? req.body.plotBasePrice : plot.plotBasePrice;
        const surcharge =
          req.body.surchargeAmount !== undefined ? req.body.surchargeAmount : plot.surchargeAmount;
        const discount =
          req.body.discountAmount !== undefined ? req.body.discountAmount : plot.discountAmount;
        const totalAmount =
          req.body.plotTotalAmount !== undefined ? req.body.plotTotalAmount : plot.plotTotalAmount;

        if (totalAmount < basePrice + surcharge - discount) {
          throw new Error('Total amount is less than (base price + surcharge - discount)');
        }
      }
    }

    return true;
  }),
];

export const validateGetPlots = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('projectId').optional().isMongoId().withMessage('Invalid Project ID format'),
  query('plotBlockId').optional().isMongoId().withMessage('Invalid Plot Block ID format'),
  query('plotType')
    .optional()
    .custom(value => {
      if (value) {
        const types = value.split(',');
        const invalid = types.find((t: string) => !Object.values(PlotType).includes(t as PlotType));
        if (invalid) throw new Error(`Invalid plot type: ${invalid}`);
      }
      return true;
    }),
  query('salesStatusId').optional(),
  query('srDevStatId').optional(),
  query('plotCategoryId').optional(),
  query('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean value'),
  query('isPossessionReady')
    .optional()
    .isBoolean()
    .withMessage('isPossessionReady must be a boolean value'),
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
  query('plotFacing').optional(),
  query('hasFile').optional().isBoolean().withMessage('hasFile must be a boolean value'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

export const validatePriceCalculation = [
  body('plotSizeId')
    .notEmpty()
    .withMessage('Plot Size ID is required')
    .isMongoId()
    .withMessage('Invalid Plot Size ID format'),

  body('plotCategoryId')
    .notEmpty()
    .withMessage('Plot Category ID is required')
    .isMongoId()
    .withMessage('Invalid Plot Category ID format'),

  body('plotType')
    .notEmpty()
    .withMessage('Plot Type is required')
    .isIn(Object.values(PlotType))
    .withMessage('Invalid plot type'),

  body('plotLength')
    .notEmpty()
    .withMessage('Plot Length is required')
    .isFloat({ min: 1 })
    .withMessage('Plot Length must be greater than 0'),

  body('plotWidth')
    .notEmpty()
    .withMessage('Plot Width is required')
    .isFloat({ min: 1 })
    .withMessage('Plot Width must be greater than 0'),

  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative'),
];

export const validatePlotAssignment = [
  body('plotId')
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID format'),

  body('fileId')
    .notEmpty()
    .withMessage('File ID is required')
    .isMongoId()
    .withMessage('Invalid File ID format'),

  body('salesStatusId')
    .notEmpty()
    .withMessage('Sales Status ID is required')
    .isMongoId()
    .withMessage('Invalid Sales Status ID format'),

  body('assignedBy')
    .notEmpty()
    .withMessage('Assigned By is required')
    .isMongoId()
    .withMessage('Invalid User ID format'),
];

export const validateBulkPlotUpdate = [
  body('plotIds')
    .notEmpty()
    .withMessage('Plot IDs are required')
    .isArray()
    .withMessage('Plot IDs must be an array')
    .custom(value => value.length > 0)
    .withMessage('At least one plot ID is required'),

  body('field')
    .notEmpty()
    .withMessage('Field is required')
    .isIn(['salesStatusId', 'srDevStatId', 'isPossessionReady', 'plotCategoryId'])
    .withMessage('Invalid field name'),

  body('value').custom((value, { req }) => {
    if (
      req.body.field === 'salesStatusId' ||
      req.body.field === 'srDevStatId' ||
      req.body.field === 'plotCategoryId'
    ) {
      if (!value) {
        throw new Error('Value is required for this field');
      }
      if (typeof value !== 'string') {
        throw new Error('Value must be a string ID');
      }
    } else if (req.body.field === 'isPossessionReady') {
      if (typeof value !== 'boolean') {
        throw new Error('Value must be a boolean for isPossessionReady');
      }
    }
    return true;
  }),
];

export const validatePlotDocuments = [
  param('id').isMongoId().withMessage('Invalid plot ID'),

  body('documents')
    .notEmpty()
    .withMessage('Documents are required')
    .isArray()
    .withMessage('Documents must be an array')
    .custom(value => value.length > 0)
    .withMessage('At least one document is required'),

  body('documents.*.documentType')
    .notEmpty()
    .withMessage('Document type is required')
    .isIn(['allotment', 'possession', 'survey', 'map', 'noc', 'other'])
    .withMessage('Invalid document type'),

  body('documents.*.documentPath')
    .notEmpty()
    .withMessage('Document path is required')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Document path cannot exceed 500 characters'),
];
