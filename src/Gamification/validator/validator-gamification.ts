import { body, param, query, ValidationChain } from 'express-validator';

export const validateAwardPoints = (): ValidationChain[] => [
  body('memberId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('event')
    .trim()
    .notEmpty()
    .withMessage('Event name is required')
    .isLength({ max: 200 })
    .withMessage('Event name cannot exceed 200 characters'),

  body('points')
    .notEmpty()
    .withMessage('Points are required')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('referenceType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference type cannot exceed 100 characters'),

  body('referenceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Reference ID'),
];

export const validateGetPoints = (): ValidationChain[] => [
  query('memberId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  query('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),
];

export const validateGetHistory = (): ValidationChain[] => [
  query('memberId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  query('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const validateGetLeaderboard = (): ValidationChain[] => [
  query('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('period')
    .optional()
    .isIn(['monthly', 'yearly', 'all-time'])
    .withMessage('Period must be monthly, yearly, or all-time'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const validateCreateReward = (): ValidationChain[] => [
  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('rewardName')
    .trim()
    .notEmpty()
    .withMessage('Reward name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Reward name must be between 2 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('pointsCost')
    .notEmpty()
    .withMessage('Points cost is required')
    .isInt({ min: 1 })
    .withMessage('Points cost must be at least 1'),

  body('quantity')
    .optional()
    .isInt({ min: -1 })
    .withMessage('Quantity must be -1 (unlimited) or a positive number'),

  body('rewardType')
    .trim()
    .notEmpty()
    .withMessage('Reward type is required')
    .isIn(['discount', 'free-booking', 'merchandise', 'recognition', 'donation'])
    .withMessage('Invalid reward type'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date'),
];

export const validateUpdateReward = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Reward ID'),

  body('rewardName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Reward name must be between 2 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('pointsCost')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Points cost must be at least 1'),

  body('quantity')
    .optional()
    .isInt({ min: -1 })
    .withMessage('Quantity must be -1 (unlimited) or a positive number'),

  body('rewardType')
    .optional()
    .isIn(['discount', 'free-booking', 'merchandise', 'recognition', 'donation'])
    .withMessage('Invalid reward type'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date'),
];

export const validateRedeemReward = (): ValidationChain[] => [
  body('memberId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('rewardId')
    .trim()
    .notEmpty()
    .withMessage('Reward ID is required')
    .isMongoId()
    .withMessage('Invalid Reward ID'),
];

export const validateGetRedemptions = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('memberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Member ID'),

  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('status')
    .optional()
    .isIn(['pending', 'approved', 'fulfilled', 'rejected', 'cancelled'])
    .withMessage('Invalid status'),

  query('rewardId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Reward ID'),
];

export const validateIdParam = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID'),
];

export const validateRedemptionAction = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Redemption ID'),
];

export const validateRejectRedemption = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Redemption ID'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];
