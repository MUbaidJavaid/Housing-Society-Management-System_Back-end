import { body, param, query, ValidationChain } from 'express-validator';
import {
  ListingCategory,
  ListingType,
  ListingCondition,
  ContactPreference,
  ListingStatus,
} from '../types/types-marketplace';

export const validateCreateListing = (): ValidationChain[] => [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('societyId')
    .optional({ values: 'falsy' })
    .trim()
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('sellerId')
    .optional({ values: 'falsy' })
    .trim()
    .isMongoId()
    .withMessage('Invalid Seller ID'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(Object.values(ListingCategory))
    .withMessage(`Category must be one of: ${Object.values(ListingCategory).join(', ')}`),

  body('listingType')
    .trim()
    .notEmpty()
    .withMessage('Listing type is required')
    .isIn(Object.values(ListingType))
    .withMessage(`Listing type must be one of: ${Object.values(ListingType).join(', ')}`),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('currency')
    .optional()
    .trim()
    .isString()
    .withMessage('Currency must be a string'),

  body('negotiable')
    .optional()
    .isBoolean()
    .withMessage('Negotiable must be a boolean'),

  body('condition')
    .optional()
    .isIn(Object.values(ListingCondition))
    .withMessage(`Condition must be one of: ${Object.values(ListingCondition).join(', ')}`),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),

  body('images.*.url')
    .optional()
    .isString()
    .withMessage('Image URL must be a string'),

  body('images.*.publicId')
    .optional()
    .isString()
    .withMessage('Image public ID must be a string'),

  body('contactPreference')
    .optional()
    .isIn(Object.values(ContactPreference))
    .withMessage(`Contact preference must be one of: ${Object.values(ContactPreference).join(', ')}`),

  body('location')
    .optional()
    .trim()
    .isString()
    .withMessage('Location must be a string'),
];

export const validateUpdateListing = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Listing ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('category')
    .optional()
    .isIn(Object.values(ListingCategory))
    .withMessage(`Category must be one of: ${Object.values(ListingCategory).join(', ')}`),

  body('listingType')
    .optional()
    .isIn(Object.values(ListingType))
    .withMessage(`Listing type must be one of: ${Object.values(ListingType).join(', ')}`),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('currency')
    .optional()
    .trim()
    .isString()
    .withMessage('Currency must be a string'),

  body('negotiable')
    .optional()
    .isBoolean()
    .withMessage('Negotiable must be a boolean'),

  body('condition')
    .optional()
    .isIn(Object.values(ListingCondition))
    .withMessage(`Condition must be one of: ${Object.values(ListingCondition).join(', ')}`),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),

  body('contactPreference')
    .optional()
    .isIn(Object.values(ContactPreference))
    .withMessage(`Contact preference must be one of: ${Object.values(ContactPreference).join(', ')}`),

  body('location')
    .optional()
    .trim()
    .isString()
    .withMessage('Location must be a string'),

  body('status')
    .optional()
    .isIn(Object.values(ListingStatus))
    .withMessage(`Status must be one of: ${Object.values(ListingStatus).join(', ')}`),
];

export const validateGetListings = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isString()
    .withMessage('Search must be a string'),

  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('category')
    .optional()
    .isIn(Object.values(ListingCategory))
    .withMessage(`Category must be one of: ${Object.values(ListingCategory).join(', ')}`),

  query('listingType')
    .optional()
    .isIn(Object.values(ListingType))
    .withMessage(`Listing type must be one of: ${Object.values(ListingType).join(', ')}`),

  query('condition')
    .optional()
    .isIn(Object.values(ListingCondition))
    .withMessage(`Condition must be one of: ${Object.values(ListingCondition).join(', ')}`),

  query('status')
    .optional()
    .isIn(Object.values(ListingStatus))
    .withMessage(`Status must be one of: ${Object.values(ListingStatus).join(', ')}`),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'price', 'title', 'viewCount', 'favoriteCount'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateMarkAsSold = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Listing ID'),
];

export const validateToggleFavorite = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Listing ID'),
];
