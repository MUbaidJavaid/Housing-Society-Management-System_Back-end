import { body, param, query, ValidationChain } from 'express-validator';

const bookingStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'NoShow', 'Rejected'];
const paymentStatuses = ['pending', 'paid', 'refunded'];

export const validateCreateBooking = (): ValidationChain[] => [
  body('facilityId')
    .trim()
    .notEmpty()
    .withMessage('Facility ID is required')
    .isMongoId()
    .withMessage('Invalid Facility ID'),

  body('memberId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('bookingDate')
    .trim()
    .notEmpty()
    .withMessage('Booking date is required')
    .isISO8601()
    .withMessage('Booking date must be a valid date'),

  body('startTime')
    .trim()
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:mm format'),

  body('endTime')
    .trim()
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:mm format'),

  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Purpose cannot exceed 500 characters'),

  body('numberOfGuests')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Number of guests must be at least 1'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),

  body('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),
];

export const validateGetBookings = (): ValidationChain[] => [
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

  query('facilityId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Facility ID'),

  query('memberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Member ID'),

  query('status')
    .optional()
    .isIn(bookingStatuses)
    .withMessage(`Status must be one of: ${bookingStatuses.join(', ')}`),

  query('paymentStatus')
    .optional()
    .isIn(paymentStatuses)
    .withMessage(`Payment status must be one of: ${paymentStatuses.join(', ')}`),

  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('fromDate must be a valid date'),

  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('toDate must be a valid date'),

  query('sortBy')
    .optional()
    .isIn(['bookingDate', 'startTime', 'status', 'totalAmount', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field')
    .default('createdAt'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
    .default('desc'),
];

export const validateCheckAvailability = (): ValidationChain[] => [
  query('facilityId')
    .trim()
    .notEmpty()
    .withMessage('Facility ID is required')
    .isMongoId()
    .withMessage('Invalid Facility ID'),

  query('date')
    .trim()
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date'),

  query('startTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:mm format'),

  query('endTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:mm format'),
];

export const validateCancelBooking = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Booking ID'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters'),
];

export const validateBookingIdParam = (): ValidationChain[] => [
  param('id').isMongoId().withMessage('Invalid Booking ID'),
];

export const validateGetBookingStats = (): ValidationChain[] => [
  query('facilityId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Facility ID'),

  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('fromDate must be a valid date'),

  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('toDate must be a valid date'),
];
