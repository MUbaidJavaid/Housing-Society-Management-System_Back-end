import { body, param, query } from 'express-validator';

export const validateInitiatePayment = [
  body('societyId')
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('billId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Bill ID'),

  body('installmentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Installment ID'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),

  body('currency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),

  body('gateway')
    .notEmpty()
    .withMessage('Gateway is required')
    .isIn(['jazzcash', 'easypaisa', 'bank_transfer', 'stripe', 'manual'])
    .withMessage('Invalid payment gateway'),

  body('payerName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Payer name must be 1-200 characters'),

  body('payerPhone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Payer phone must be 10-15 characters'),

  body('payerEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid payer email'),

  body('paymentMethod')
    .optional()
    .trim()
    .isIn(['MWALLET', 'CC', 'DC', 'OTC'])
    .withMessage('Payment method must be MWALLET, CC, DC, or OTC'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('callbackUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid callback URL'),

  body('returnUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid return URL'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
];

export const validateGetTransactions = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be 1-200'),

  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('memberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Member ID'),

  query('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'])
    .withMessage('Invalid status'),

  query('gateway')
    .optional()
    .isIn(['jazzcash', 'easypaisa', 'bank_transfer', 'stripe', 'manual'])
    .withMessage('Invalid gateway'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateRefund = [
  param('id')
    .isMongoId()
    .withMessage('Invalid transaction ID'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be a positive number'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

export const validateVerifyTransaction = [
  param('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .trim(),
];
