import { body, param, query, ValidationChain } from 'express-validator';

export const validateGenerateCertificate = (): ValidationChain[] => [
  body('plotId')
    .trim()
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID'),

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

  body('certificateType')
    .trim()
    .notEmpty()
    .withMessage('Certificate type is required')
    .isIn(['ownership', 'allotment', 'transfer', 'possession'])
    .withMessage('Certificate type must be ownership, allotment, transfer, or possession'),

  body('issuedDate')
    .notEmpty()
    .withMessage('Issued date is required')
    .isISO8601()
    .withMessage('Issued date must be a valid date'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date'),

  body('propertyDetails')
    .optional()
    .isObject()
    .withMessage('Property details must be an object'),

  body('propertyDetails.area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Area must be a positive number'),

  body('propertyDetails.areaUnit')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Area unit cannot exceed 50 characters'),

  body('ownerDetails')
    .optional()
    .isObject()
    .withMessage('Owner details must be an object'),

  body('ownerDetails.name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Owner name cannot exceed 200 characters'),

  body('ownerDetails.cnic')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('CNIC cannot exceed 20 characters'),

  body('digitalSignature')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Digital signature is too long'),
];

export const validateUpdateCertificate = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Certificate ID'),

  body('certificateType')
    .optional()
    .isIn(['ownership', 'allotment', 'transfer', 'possession'])
    .withMessage('Certificate type must be ownership, allotment, transfer, or possession'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Valid until must be a valid date'),

  body('propertyDetails')
    .optional()
    .isObject()
    .withMessage('Property details must be an object'),

  body('ownerDetails')
    .optional()
    .isObject()
    .withMessage('Owner details must be an object'),

  body('status')
    .optional()
    .isIn(['draft', 'issued', 'verified', 'revoked', 'expired'])
    .withMessage('Invalid status'),

  body('pdfUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('PDF URL must be a valid URL'),

  body('digitalSignature')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Digital signature is too long'),
];

export const validateGetCertificates = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('societyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Society ID'),

  query('plotId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Plot ID'),

  query('memberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Member ID'),

  query('certificateType')
    .optional()
    .isIn(['ownership', 'allotment', 'transfer', 'possession'])
    .withMessage('Invalid certificate type'),

  query('status')
    .optional()
    .isIn(['draft', 'issued', 'verified', 'revoked', 'expired'])
    .withMessage('Invalid status'),

  query('syncStatus')
    .optional()
    .isIn(['pending', 'synced', 'failed', 'manual'])
    .withMessage('Invalid sync status'),

  query('sortBy')
    .optional()
    .isIn(['issuedDate', 'certificateNumber', 'status', 'createdAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateRevokeCertificate = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid Certificate ID'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Revocation reason is required')
    .isLength({ max: 1000 })
    .withMessage('Reason cannot exceed 1000 characters'),
];

export const validateIdParam = (): ValidationChain[] => [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID'),
];

export const validateQRCodeParam = (): ValidationChain[] => [
  param('qrCode')
    .trim()
    .notEmpty()
    .withMessage('QR code is required')
    .isLength({ min: 12, max: 12 })
    .withMessage('QR code must be 12 characters')
    .isAlphanumeric()
    .withMessage('QR code must be alphanumeric'),
];

export const validateGetCompliance = (): ValidationChain[] => [
  query('societyId')
    .trim()
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),
];
