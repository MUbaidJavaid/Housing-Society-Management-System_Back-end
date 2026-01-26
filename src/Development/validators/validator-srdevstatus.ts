import { body, param, query } from 'express-validator';
import { srDevStatusService } from '../services/service-srdevstatus';
import { DevCategory, DevPhase } from '../types/types-srdevstatus';

export const validateCreateSrDevStatus = [
  body('srDevStatName')
    .notEmpty()
    .withMessage('Development Status Name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Development Status Name must be 2-100 characters')
    .custom(async _value => {
      const exists = await srDevStatusService.getSrDevStatusByCode('');
      if (exists) {
        throw new Error('Development Status with this name already exists');
      }
      return true;
    }),

  body('srDevStatCode')
    .notEmpty()
    .withMessage('Development Status Code is required')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Development Status Code must be 2-20 characters')
    .custom(async value => {
      const exists = await srDevStatusService.getSrDevStatusByCode(value);
      if (exists) {
        throw new Error('Development Status with this code already exists');
      }
      return true;
    }),

  body('devCategory')
    .notEmpty()
    .withMessage('Development Category is required')
    .isIn(Object.values(DevCategory))
    .withMessage('Invalid development category'),

  body('devPhase')
    .notEmpty()
    .withMessage('Development Phase is required')
    .isIn(Object.values(DevPhase))
    .withMessage('Invalid development phase'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('colorCode')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Invalid hex color code'),

  body('percentageComplete')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100'),

  body('sequence').optional().isInt({ min: 1 }).withMessage('Sequence must be at least 1'),

  body('estimatedDurationDays')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated duration cannot be negative'),

  // Custom validator for phase-percentage consistency
  body().custom((_value, { req }) => {
    if (req.body.devPhase && req.body.percentageComplete !== undefined) {
      try {
        srDevStatusService.validatePhasePercentage(req.body.devPhase, req.body.percentageComplete);
      } catch (error: any) {
        throw new Error(error.message);
      }
    }
    return true;
  }),
];

export const validateUpdateSrDevStatus = [
  param('id').isMongoId().withMessage('Invalid development status ID'),

  body('srDevStatName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Development Status Name must be 2-100 characters')
    .custom(async (value, { req }) => {
      if (value) {
        const status = await srDevStatusService.getSrDevStatusById(req.params?.id);
        if (status && status.srDevStatName !== value) {
          // Check if another status has this name
          const existing = await srDevStatusService.getSrDevStatusByCode('');
          if (existing && existing._id.toString() !== req.params?.id) {
            throw new Error('Development Status with this name already exists');
          }
        }
      }
      return true;
    }),

  body('srDevStatCode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Development Status Code must be 2-20 characters')
    .custom(async (value, { req }) => {
      if (value) {
        const existing = await srDevStatusService.getSrDevStatusByCode(value);
        if (existing && existing._id.toString() !== req.params?.id) {
          throw new Error('Development Status with this code already exists');
        }
      }
      return true;
    }),

  body('devCategory')
    .optional()
    .isIn(Object.values(DevCategory))
    .withMessage('Invalid development category'),

  body('devPhase')
    .optional()
    .isIn(Object.values(DevPhase))
    .withMessage('Invalid development phase'),

  body('percentageComplete')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100'),

  // Custom validator for phase-percentage consistency
  body().custom(async (_value, { req }) => {
    if (
      (req.body.devPhase !== undefined || req.body.percentageComplete !== undefined) &&
      req.params?.id
    ) {
      const currentStatus = await srDevStatusService.getSrDevStatusById(req.params.id);
      if (currentStatus) {
        const phase = req.body.devPhase !== undefined ? req.body.devPhase : currentStatus.devPhase;
        const percentage =
          req.body.percentageComplete !== undefined
            ? req.body.percentageComplete
            : currentStatus.percentageComplete;

        try {
          srDevStatusService.validatePhasePercentage(phase, percentage);
        } catch (error: any) {
          throw new Error(error.message);
        }
      }
    }
    return true;
  }),
];

export const validateGetSrDevStatuses = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('devCategory')
    .optional()
    .custom(value => {
      if (value) {
        const categories = value.split(',');
        const invalid = categories.find(
          (c: string) => !Object.values(DevCategory).includes(c as DevCategory)
        );
        if (invalid) throw new Error(`Invalid development category: ${invalid}`);
      }
      return true;
    }),
  query('devPhase')
    .optional()
    .custom(value => {
      if (value) {
        const phases = value.split(',');
        const invalid = phases.find(
          (p: string) => !Object.values(DevPhase).includes(p as DevPhase)
        );
        if (invalid) throw new Error(`Invalid development phase: ${invalid}`);
      }
      return true;
    }),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
  query('requiresDocumentation')
    .optional()
    .isBoolean()
    .withMessage('requiresDocumentation must be a boolean value'),
  query('minPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Minimum percentage must be 0-100'),
  query('maxPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Maximum percentage must be 0-100'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

export const validateStatusTransition = [
  body('currentStatusId')
    .notEmpty()
    .withMessage('Current Status ID is required')
    .isMongoId()
    .withMessage('Invalid current status ID'),

  body('targetStatusId')
    .notEmpty()
    .withMessage('Target Status ID is required')
    .isMongoId()
    .withMessage('Invalid target status ID'),
];

export const validateReorderStatuses = [
  body('statusOrders')
    .notEmpty()
    .withMessage('Status orders are required')
    .isArray()
    .withMessage('Status orders must be an array')
    .custom(value => value.length > 0)
    .withMessage('At least one status order is required'),

  body('statusOrders.*.id')
    .notEmpty()
    .withMessage('Status ID is required')
    .isMongoId()
    .withMessage('Invalid status ID'),

  body('statusOrders.*.sequence')
    .notEmpty()
    .withMessage('Sequence is required')
    .isInt({ min: 1 })
    .withMessage('Sequence must be at least 1'),
];

export const validateBulkUpdateStatuses = [
  body('statusIds')
    .notEmpty()
    .withMessage('Status IDs are required')
    .isArray()
    .withMessage('Status IDs must be an array')
    .custom(value => value.length > 0)
    .withMessage('At least one status ID is required'),

  body('field')
    .notEmpty()
    .withMessage('Field is required')
    .isIn(['isActive', 'requiresDocumentation'])
    .withMessage('Invalid field name'),

  body('value')
    .notEmpty()
    .withMessage('Value is required')
    .isBoolean()
    .withMessage('Value must be a boolean'),
];

export const validateProjectProgress = [
  body('statusIds')
    .notEmpty()
    .withMessage('Status IDs are required')
    .isArray()
    .withMessage('Status IDs must be an array')
    .custom(value => value.length > 0)
    .withMessage('At least one status ID is required'),
];
