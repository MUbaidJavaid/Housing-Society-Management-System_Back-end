// src/database/File/validators/validator-file.ts
import { body, param, query, ValidationChain } from 'express-validator';
import { FileStatus, PaymentMode } from '../models/models-file';

export const validateCreateFile = (): ValidationChain[] => [
  body('fileRegNo')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('File registration number must be between 5 and 50 characters'),

  body('planId')
    .trim()
    .notEmpty()
    .withMessage('Installment plan is required')
    .isMongoId()
    .withMessage('Invalid Installment Plan ID'),

  body('memId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('nomineeId').optional().isMongoId().withMessage('Invalid Nominee ID'),

  body('applicationId').optional().isMongoId().withMessage('Invalid Application ID'),

  body('plotId') // REQUIRED now
    .trim()
    .notEmpty()
    .withMessage('Plot ID is required - file must be associated with a plot')
    .isMongoId()
    .withMessage('Invalid Plot ID'),

  body('totalAmount')
    .notEmpty()
    .withMessage('Total amount is required')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('downPayment')
    .notEmpty()
    .withMessage('Down payment is required')
    .isFloat({ min: 0 })
    .withMessage('Down payment must be a positive number'),

  body('paymentMode')
    .notEmpty()
    .withMessage('Payment mode is required')
    .isIn(Object.values(PaymentMode))
    .withMessage('Invalid payment mode'),

  body('isAdjusted').optional().isBoolean().withMessage('Is adjusted must be a boolean'),

  body('adjustmentRef')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Adjustment reference cannot exceed 100 characters'),

  body('fileRemarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('File remarks cannot exceed 1000 characters'),

  body('bookingDate')
    .notEmpty()
    .withMessage('Booking date is required')
    .isISO8601()
    .withMessage('Please provide a valid booking date'),

  body('expectedCompletionDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Please provide a valid expected completion date'),

  // Custom validation for down payment
  body().custom((_value, { req }) => {
    if (req.body.downPayment > req.body.totalAmount) {
      throw new Error('Down payment cannot exceed total amount');
    }
    return true;
  }),
];

export const validateUpdateFile = (): ValidationChain[] => [
  body('planId').optional().isMongoId().withMessage('Invalid Installment Plan ID'),

  body('nomineeId').optional().isMongoId().withMessage('Invalid Nominee ID'),

  body('plotId').optional().isMongoId().withMessage('Invalid Plot ID'),

  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('downPayment')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Down payment must be a positive number'),

  body('paymentMode')
    .optional()
    .isIn(Object.values(PaymentMode))
    .withMessage('Invalid payment mode'),

  body('isAdjusted').optional().isBoolean().withMessage('Is adjusted must be a boolean'),

  body('adjustmentRef')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Adjustment reference cannot exceed 100 characters'),

  body('status').optional().isIn(Object.values(FileStatus)).withMessage('Invalid file status'),

  body('fileRemarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('File remarks cannot exceed 1000 characters'),

  body('expectedCompletionDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Please provide a valid expected completion date'),

  body('actualCompletionDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Please provide a valid actual completion date'),

  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters'),

  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
];

export const validateGetFiles = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('projId').optional().isMongoId().withMessage('Invalid Project ID'),

  query('projectId').optional().isMongoId().withMessage('Invalid Project ID'),

  query('memId').optional().isMongoId().withMessage('Invalid Member ID'),

  query('nomineeId').optional().isMongoId().withMessage('Invalid Nominee ID'),

  query('plotId').optional().isMongoId().withMessage('Invalid Plot ID'),

  query('planId').optional().isMongoId().withMessage('Invalid Installment Plan ID'),

  query('status').optional().isIn(Object.values(FileStatus)).withMessage('Invalid file status'),

  query('isAdjusted').optional().isBoolean().withMessage('Is adjusted must be a boolean'),

  query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),

  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),

  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number'),

  query('fromDate').optional().isISO8601().withMessage('Please provide a valid from date'),

  query('toDate').optional().isISO8601().withMessage('Please provide a valid to date'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),

  query('sortBy')
    .optional()
    .isIn([
      'fileRegNo',
      'bookingDate',
      'totalAmount',
      'downPayment',
      'status',
      'createdAt',
      'updatedAt',
      'planId',
    ])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
];

export const validateMemIdParam = (): ValidationChain[] => [
  param('memId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),
];

export const validateProjIdParam = (): ValidationChain[] => [
  param('projId')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid Project ID'),
];

export const validatePlanIdParam = (): ValidationChain[] => [
  param('planId')
    .trim()
    .notEmpty()
    .withMessage('Plan ID is required')
    .isMongoId()
    .withMessage('Invalid Installment Plan ID'),
];

export const validateTransferFile = (): ValidationChain[] => [
  body('newMemberId')
    .notEmpty()
    .withMessage('New member ID is required')
    .isMongoId()
    .withMessage('Invalid new member ID'),

  body('transferDate')
    .notEmpty()
    .withMessage('Transfer date is required')
    .isISO8601()
    .withMessage('Please provide a valid transfer date'),

  body('transferReason')
    .notEmpty()
    .withMessage('Transfer reason is required')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Transfer reason must be between 5 and 500 characters'),

  body('transferFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transfer fee must be a positive number'),

  body('transferRemarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Transfer remarks cannot exceed 500 characters'),
];

export const validateAdjustFile = (): ValidationChain[] => [
  body('adjustmentType')
    .notEmpty()
    .withMessage('Adjustment type is required')
    .isIn(['REFUND', 'CREDIT', 'TRANSFER'])
    .withMessage('Adjustment type must be REFUND, CREDIT, or TRANSFER'),

  body('adjustmentAmount')
    .notEmpty()
    .withMessage('Adjustment amount is required')
    .isFloat({ min: 0 })
    .withMessage('Adjustment amount must be a positive number'),

  body('adjustmentDate')
    .notEmpty()
    .withMessage('Adjustment date is required')
    .isISO8601()
    .withMessage('Please provide a valid adjustment date'),

  body('adjustmentReason')
    .notEmpty()
    .withMessage('Adjustment reason is required')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Adjustment reason must be between 5 and 500 characters'),

  body('referenceFileId').optional().isMongoId().withMessage('Invalid reference file ID'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters'),
];

export const validateAssignPlot = (): ValidationChain[] => [
  body('plotId')
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID'),
];

export const validateBulkUpdateStatus = (): ValidationChain[] => [
  body('fileIds')
    .notEmpty()
    .withMessage('File IDs are required')
    .isArray()
    .withMessage('File IDs must be an array')
    .custom(ids => ids.length > 0)
    .withMessage('File IDs array must not be empty')
    .custom(ids => ids.every((id: string) => typeof id === 'string'))
    .withMessage('All file IDs must be strings'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(FileStatus))
    .withMessage('Invalid file status'),
];
