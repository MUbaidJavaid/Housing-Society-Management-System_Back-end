import { body, query, ValidationChain } from 'express-validator';

export const validateCreateTransfer = (): ValidationChain[] => [
  body('fileId')
    .notEmpty()
    .withMessage('File ID is required')
    .isMongoId()
    .withMessage('Invalid File ID'),

  body('transferTypeId')
    .notEmpty()
    .withMessage('Transfer type is required')
    .isMongoId()
    .withMessage('Invalid Transfer Type ID'),

  body('sellerMemId')
    .notEmpty()
    .withMessage('Seller is required')
    .isMongoId()
    .withMessage('Invalid Seller Member ID'),

  body('buyerMemId')
    .notEmpty()
    .withMessage('Buyer is required')
    .isMongoId()
    .withMessage('Invalid Buyer Member ID')
    .custom((value, { req }) => value !== req.body.sellerMemId)
    .withMessage('Seller and buyer cannot be the same person'),

  body('applicationId').optional().isMongoId().withMessage('Invalid Application ID'),

  body('ndcDocPath').optional().isString().withMessage('Invalid NDC document path'),

  body('transferFeeAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transfer fee must be a positive number'),

  body('transferInitDate')
    .notEmpty()
    .withMessage('Transfer initiation date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => new Date(value) <= new Date())
    .withMessage('Transfer initiation date cannot be in the future'),

  body('witness1Name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Witness 1 name must be between 2 and 100 characters'),

  body('witness1CNIC')
    .optional()
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/)
    .withMessage('Please provide a valid CNIC (XXXXX-XXXXXXX-X)'),

  body('witness2Name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Witness 2 name must be between 2 and 100 characters'),

  body('witness2CNIC')
    .optional()
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/)
    .withMessage('Please provide a valid CNIC (XXXXX-XXXXXXX-X)'),

  body('transfIsAtt')
    .optional()
    .isBoolean()
    .withMessage('Transfer attachment status must be a boolean'),

  body('nomineeId').optional().isMongoId().withMessage('Invalid Nominee ID'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),
];

export const validateUpdateTransfer = (): ValidationChain[] => [
  body('transferTypeId').optional().isMongoId().withMessage('Invalid Transfer Type ID'),

  body('ndcDocPath').optional().isString().withMessage('Invalid NDC document path'),

  body('transferFeePaid').optional().isBoolean().withMessage('Transfer fee paid must be a boolean'),

  body('transferFeeAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transfer fee must be a positive number'),

  body('transferFeePaidDate').optional().isISO8601().withMessage('Invalid date format'),

  body('transferExecutionDate').optional().isISO8601().withMessage('Invalid date format'),

  body('witness1Name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Witness 1 name must be between 2 and 100 characters'),

  body('witness1CNIC')
    .optional()
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/)
    .withMessage('Please provide a valid CNIC (XXXXX-XXXXXXX-X)'),

  body('witness2Name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Witness 2 name must be between 2 and 100 characters'),

  body('witness2CNIC')
    .optional()
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/)
    .withMessage('Please provide a valid CNIC (XXXXX-XXXXXXX-X)'),

  body('officerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Officer name must be between 2 and 100 characters'),

  body('officerDesignation')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Officer designation must be between 2 and 100 characters'),

  body('transfIsAtt')
    .optional()
    .isBoolean()
    .withMessage('Transfer attachment status must be a boolean'),

  body('nomineeId').optional().isMongoId().withMessage('Invalid Nominee ID'),

  body('status')
    .optional()
    .isIn([
      'Pending',
      'Under Review',
      'Approved',
      'Rejected',
      'Completed',
      'Cancelled',
      'On Hold',
      'Documents Required',
      'Fee Pending',
    ])
    .withMessage('Invalid status'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),

  body('legalReviewNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Legal review notes cannot exceed 2000 characters'),

  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters'),

  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
];

export const validateGetTransfers = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('fileId').optional().isMongoId().withMessage('Invalid File ID'),

  query('sellerMemId').optional().isMongoId().withMessage('Invalid Seller Member ID'),

  query('buyerMemId').optional().isMongoId().withMessage('Invalid Buyer Member ID'),

  query('transferTypeId').optional().isMongoId().withMessage('Invalid Transfer Type ID'),

  query('status')
    .optional()
    .isIn([
      'Pending',
      'Under Review',
      'Approved',
      'Rejected',
      'Completed',
      'Cancelled',
      'On Hold',
      'Documents Required',
      'Fee Pending',
    ])
    .withMessage('Invalid status'),

  query('transferFeePaid')
    .optional()
    .isBoolean()
    .withMessage('Transfer fee paid must be a boolean'),

  query('transfIsAtt')
    .optional()
    .isBoolean()
    .withMessage('Transfer attachment status must be a boolean'),

  query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),

  query('fromDate').optional().isISO8601().withMessage('Invalid from date format'),

  query('toDate').optional().isISO8601().withMessage('Invalid to date format'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),

  query('sortBy')
    .optional()
    .isIn([
      'transferInitDate',
      'createdAt',
      'updatedAt',
      'transferFeeAmount',
      'transferExecutionDate',
    ])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
];

export const validateRecordFeePayment = (): ValidationChain[] => [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  body('paymentDate')
    .notEmpty()
    .withMessage('Payment date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Cash', 'Bank Transfer', 'Cheque', 'Online Payment'])
    .withMessage('Invalid payment method'),

  body('transactionId')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Transaction ID must be between 3 and 50 characters'),

  body('receiptNumber')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Receipt number must be between 3 and 50 characters'),
];

export const validateExecuteTransfer = (): ValidationChain[] => [
  body('executionDate')
    .notEmpty()
    .withMessage('Execution date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => new Date(value) <= new Date())
    .withMessage('Execution date cannot be in the future'),

  body('witness1Name')
    .notEmpty()
    .withMessage('Primary witness name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Witness 1 name must be between 2 and 100 characters'),

  body('witness1CNIC')
    .notEmpty()
    .withMessage('Primary witness CNIC is required')
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/)
    .withMessage('Please provide a valid CNIC (XXXXX-XXXXXXX-X)'),

  body('witness2Name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Witness 2 name must be between 2 and 100 characters'),

  body('witness2CNIC')
    .optional()
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/)
    .withMessage('Please provide a valid CNIC (XXXXX-XXXXXXX-X)'),

  body('officerName')
    .notEmpty()
    .withMessage('Officer name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Officer name must be between 2 and 100 characters'),

  body('officerDesignation')
    .notEmpty()
    .withMessage('Officer designation is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Officer designation must be between 2 and 100 characters'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),
];
