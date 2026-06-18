import { body, param, query, ValidationChain } from 'express-validator';

// ============ Vendor Profile Validators ============

export const validateCreateVendorProfile = (): ValidationChain[] => [
  body('vendorName')
    .trim()
    .notEmpty()
    .withMessage('Vendor name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Vendor name must be between 2 and 200 characters'),

  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isLength({ min: 7, max: 20 })
    .withMessage('Phone must be between 7 and 20 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('vendorType')
    .trim()
    .notEmpty()
    .withMessage('Vendor type is required')
    .isIn(['plumber', 'electrician', 'security', 'landscaping', 'cleaning', 'construction'])
    .withMessage(
      'Vendor type must be one of: plumber, electrician, security, landscaping, cleaning, construction'
    ),

  body('registrationNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Registration number cannot exceed 100 characters'),

  body('taxId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tax ID cannot exceed 100 characters'),

  body('serviceAreas')
    .optional()
    .isArray()
    .withMessage('Service areas must be an array'),

  body('serviceAreas.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid service area ID'),

  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),

  body('bankDetails').optional().isObject().withMessage('Bank details must be an object'),

  body('bankDetails.bankName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bank name cannot exceed 100 characters'),

  body('bankDetails.accountNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Account number cannot exceed 50 characters'),

  body('bankDetails.accountTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Account title cannot exceed 100 characters'),

  body('bankDetails.branchCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Branch code cannot exceed 20 characters'),
];

export const validateUpdateVendorProfile = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid vendor ID'),

  body('vendorName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Vendor name cannot be empty')
    .isLength({ min: 2, max: 200 })
    .withMessage('Vendor name must be between 2 and 200 characters'),

  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('Phone must be between 7 and 20 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('vendorType')
    .optional()
    .trim()
    .isIn(['plumber', 'electrician', 'security', 'landscaping', 'cleaning', 'construction'])
    .withMessage(
      'Vendor type must be one of: plumber, electrician, security, landscaping, cleaning, construction'
    ),

  body('registrationNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Registration number cannot exceed 100 characters'),

  body('taxId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tax ID cannot exceed 100 characters'),

  body('serviceAreas')
    .optional()
    .isArray()
    .withMessage('Service areas must be an array'),

  body('serviceAreas.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid service area ID'),

  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
];

export const validateRateVendor = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid vendor ID'),

  body('rating')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
];

// ============ Work Order Validators ============

export const validateCreateWorkOrder = (): ValidationChain[] => [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),

  body('estimatedBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated budget must be a positive number'),

  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),

  body('scope')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Scope cannot exceed 5000 characters'),
];

export const validateUpdateWorkOrder = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid work order ID'),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),

  body('estimatedBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated budget must be a positive number'),

  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),

  body('scope')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Scope cannot exceed 5000 characters'),
];

export const validateSubmitBid = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid work order ID'),

  body('vendorId')
    .trim()
    .notEmpty()
    .withMessage('Vendor ID is required')
    .isMongoId()
    .withMessage('Invalid Vendor ID'),

  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Bid amount must be a positive number'),

  body('proposal')
    .trim()
    .notEmpty()
    .withMessage('Proposal is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Proposal must be between 10 and 5000 characters'),
];

export const validateReviewBid = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid work order ID'),

  body('bidIndex')
    .isInt({ min: 0 })
    .withMessage('Bid index must be a non-negative integer'),

  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['under-review', 'accepted', 'rejected'])
    .withMessage('Status must be one of: under-review, accepted, rejected'),
];

export const validateAwardWorkOrder = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid work order ID'),

  body('vendorId')
    .trim()
    .notEmpty()
    .withMessage('Vendor ID is required')
    .isMongoId()
    .withMessage('Invalid Vendor ID'),
];

export const validateCompleteWorkOrder = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid work order ID'),

  body('completionNotes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Completion notes cannot exceed 5000 characters'),
];

// ============ Contract Validators ============

export const validateCreateContract = (): ValidationChain[] => [
  body('vendorId')
    .trim()
    .notEmpty()
    .withMessage('Vendor is required')
    .isMongoId()
    .withMessage('Invalid Vendor ID'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('workOrderId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Work Order ID'),

  body('contractName')
    .trim()
    .notEmpty()
    .withMessage('Contract name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Contract name must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),

  body('scope')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Scope cannot exceed 5000 characters'),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Please provide a valid start date'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Please provide a valid end date'),

  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  body('paymentFrequency')
    .optional()
    .isIn(['one-time', 'monthly', 'quarterly', 'annually'])
    .withMessage('Payment frequency must be one of: one-time, monthly, quarterly, annually'),

  body('autoRenew')
    .optional()
    .isBoolean()
    .withMessage('Auto renew must be true or false'),
];

export const validateUpdateContract = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid contract ID'),

  body('contractName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Contract name cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Contract name must be between 3 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),

  body('scope')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Scope cannot exceed 5000 characters'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),

  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  body('paymentFrequency')
    .optional()
    .isIn(['one-time', 'monthly', 'quarterly', 'annually'])
    .withMessage('Payment frequency must be one of: one-time, monthly, quarterly, annually'),

  body('autoRenew')
    .optional()
    .isBoolean()
    .withMessage('Auto renew must be true or false'),
];

export const validateTerminateContract = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid contract ID'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Termination reason is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Termination reason must be between 10 and 2000 characters'),
];

export const validateRenewContract = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid contract ID'),

  body('newEndDate')
    .notEmpty()
    .withMessage('New end date is required')
    .isISO8601()
    .withMessage('Please provide a valid date'),
];

export const validateAddPerformanceReview = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid contract ID'),

  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('comments')
    .trim()
    .notEmpty()
    .withMessage('Comments are required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Comments must be between 10 and 2000 characters'),
];

// ============ Invoice Validators ============

export const validateCreateInvoice = (): ValidationChain[] => [
  body('vendorId')
    .trim()
    .notEmpty()
    .withMessage('Vendor is required')
    .isMongoId()
    .withMessage('Invalid Vendor ID'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('contractId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Contract ID'),

  body('workOrderId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Work Order ID'),

  body('invoiceNumber')
    .trim()
    .notEmpty()
    .withMessage('Invoice number is required')
    .isLength({ max: 50 })
    .withMessage('Invoice number cannot exceed 50 characters'),

  body('invoiceDate')
    .notEmpty()
    .withMessage('Invoice date is required')
    .isISO8601()
    .withMessage('Please provide a valid invoice date'),

  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Please provide a valid due date'),

  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  body('taxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax amount must be a positive number'),

  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('lineItems')
    .optional()
    .isArray()
    .withMessage('Line items must be an array'),

  body('lineItems.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Line item description cannot exceed 500 characters'),

  body('lineItems.*.quantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a positive number'),

  body('lineItems.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),

  body('lineItems.*.total')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total must be a positive number'),
];

export const validateRejectInvoice = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid invoice ID'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Rejection reason must be between 10 and 2000 characters'),
];

export const validateMarkInvoicePaid = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid invoice ID'),

  body('paymentReference')
    .trim()
    .notEmpty()
    .withMessage('Payment reference is required')
    .isLength({ max: 200 })
    .withMessage('Payment reference cannot exceed 200 characters'),
];

// ============ Common Query Validators ============

export const validateListQuery = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .default(1),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .default(20),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query too long'),

  query('status')
    .optional()
    .trim(),

  query('sortBy')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Sort field too long'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];

export const validateIdParam = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid ID'),
];
