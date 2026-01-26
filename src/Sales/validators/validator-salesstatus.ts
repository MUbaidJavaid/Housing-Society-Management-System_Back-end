import { body, param, query } from 'express-validator';
import { salesStatusService } from '../services/service-salesstatus';
import { SalesStatusType } from '../types/types-salesstatus';

export const validateCreateSalesStatus = [
  body('statusName')
    .notEmpty()
    .withMessage('Status Name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Status Name must be 2-50 characters')
    .custom(async value => {
      const exists = await salesStatusService.getSalesStatusByCode('');
      console.log('Checking if status exists:', exists, value);
      if (exists) {
        throw new Error('Sales Status with this name already exists');
      }
      return true;
    }),

  body('statusCode')
    .notEmpty()
    .withMessage('Status Code is required')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Status Code must be 2-20 characters')
    .custom(async value => {
      const exists = await salesStatusService.getSalesStatusByCode(value);
      if (exists) {
        throw new Error('Sales Status with this code already exists');
      }
      return true;
    }),

  body('statusType')
    .notEmpty()
    .withMessage('Status Type is required')
    .isIn(Object.values(SalesStatusType))
    .withMessage('Invalid status type'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('colorCode')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Invalid hex color code'),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),

  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean value'),

  body('sequence').optional().isInt({ min: 1 }).withMessage('Sequence must be at least 1'),

  body('allowsSale').optional().isBoolean().withMessage('allowsSale must be a boolean value'),

  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be a boolean value'),

  body('notificationTemplate')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notification template cannot exceed 1000 characters'),
];

export const validateUpdateSalesStatus = [
  param('id').isMongoId().withMessage('Invalid sales status ID'),

  body('statusName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Status Name must be 2-50 characters')
    .custom(async (value, { req }) => {
      if (value) {
        const status = await salesStatusService.getSalesStatusById(req.params?.id);
        if (status && status.statusName !== value) {
          // Check if another status has this name
          const existing = await salesStatusService.getSalesStatusByCode('');
          if (existing && existing._id.toString() !== req.params?.id) {
            throw new Error('Sales Status with this name already exists');
          }
        }
      }
      return true;
    }),

  body('statusCode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Status Code must be 2-20 characters')
    .custom(async (value, { req }) => {
      if (value) {
        const existing = await salesStatusService.getSalesStatusByCode(value);
        if (existing && existing._id.toString() !== req.params?.id) {
          throw new Error('Sales Status with this code already exists');
        }
      }
      return true;
    }),

  body('statusType')
    .optional()
    .isIn(Object.values(SalesStatusType))
    .withMessage('Invalid status type'),

  body('colorCode')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Invalid hex color code'),

  body('sequence').optional().isInt({ min: 1 }).withMessage('Sequence must be at least 1'),
];

export const validateGetSalesStatuses = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('statusType')
    .optional()
    .custom(value => {
      if (value) {
        const types = value.split(',');
        const invalid = types.find(
          (t: string) => !Object.values(SalesStatusType).includes(t as SalesStatusType)
        );
        if (invalid) throw new Error(`Invalid status type: ${invalid}`);
      }
      return true;
    }),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
  query('allowsSale').optional().isBoolean().withMessage('allowsSale must be a boolean value'),
  query('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be a boolean value'),
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
    .isIn(['isActive', 'allowsSale', 'requiresApproval'])
    .withMessage('Invalid field name'),

  body('value')
    .notEmpty()
    .withMessage('Value is required')
    .isBoolean()
    .withMessage('Value must be a boolean'),
];
