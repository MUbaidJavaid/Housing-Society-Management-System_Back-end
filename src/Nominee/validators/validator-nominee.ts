import { body, param, query, ValidationChain } from 'express-validator';
import { RelationType } from '../models/models-nominee';

export const validateCreateNominee = (): ValidationChain[] => [
  body('memId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('nomineeName')
    .trim()
    .notEmpty()
    .withMessage('Nominee name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nominee name must be between 2 and 100 characters'),

  body('nomineeCNIC')
    .trim()
    .notEmpty()
    .withMessage('Nominee CNIC is required')
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/)
    .withMessage('Please provide a valid CNIC (XXXXX-XXXXXXX-X)'),

  body('relationWithMember')
    .notEmpty()
    .withMessage('Relation with member is required')
    .isIn(Object.values(RelationType))
    .withMessage('Invalid relation type'),

  body('nomineeContact')
    .trim()
    .notEmpty()
    .withMessage('Nominee contact is required')
    .matches(/^[0-9]{11,15}$/)
    .withMessage('Please provide a valid contact number (11-15 digits)'),

  body('nomineeEmail')
    .optional()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('nomineeAddress')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Nominee address cannot exceed 500 characters'),

  body('nomineeSharePercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Nominee share percentage must be between 0 and 100'),

  body('nomineePhoto')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Nominee photo path cannot exceed 500 characters'),
];

export const validateUpdateNominee = (): ValidationChain[] => [
  body('nomineeName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nominee name must be between 2 and 100 characters'),

  body('nomineeCNIC')
    .optional()
    .trim()
    .matches(/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/)
    .withMessage('Please provide a valid CNIC (XXXXX-XXXXXXX-X)'),

  body('relationWithMember')
    .optional()
    .isIn(Object.values(RelationType))
    .withMessage('Invalid relation type'),

  body('nomineeContact')
    .optional()
    .trim()
    .matches(/^[0-9]{11,15}$/)
    .withMessage('Please provide a valid contact number (11-15 digits)'),

  body('nomineeEmail')
    .optional()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('nomineeAddress')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Nominee address cannot exceed 500 characters'),

  body('nomineeSharePercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Nominee share percentage must be between 0 and 100'),

  body('nomineePhoto')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Nominee photo path cannot exceed 500 characters'),

  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
];

export const validateGetNominees = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('memId').optional().isMongoId().withMessage('Invalid Member ID'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),

  query('relationWithMember')
    .optional()
    .isIn(Object.values(RelationType))
    .withMessage('Invalid relation type'),

  query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),

  query('sortBy')
    .optional()
    .isIn(['nomineeName', 'createdAt', 'updatedAt', 'nomineeSharePercentage', 'relationWithMember'])
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

export const validateBulkUpdateStatus = (): ValidationChain[] => [
  body('nomineeIds')
    .notEmpty()
    .withMessage('Nominee IDs are required')
    .isArray()
    .withMessage('Nominee IDs must be an array')
    .custom(ids => ids.length > 0)
    .withMessage('Nominee IDs array must not be empty')
    .custom(ids => ids.every((id: string) => typeof id === 'string'))
    .withMessage('All nominee IDs must be strings'),

  body('isActive')
    .notEmpty()
    .withMessage('Status is required')
    .isBoolean()
    .withMessage('Status must be a boolean'),
];
