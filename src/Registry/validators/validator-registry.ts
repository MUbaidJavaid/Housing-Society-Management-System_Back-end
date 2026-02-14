import { body, param, query, ValidationChain } from 'express-validator';

export const validateCreateRegistry = (): ValidationChain[] => [
  body('plotId')
    .trim()
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID'),

  body('memId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),

  body('registryNo')
    .trim()
    .notEmpty()
    .withMessage('Registry number is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Registry number must be between 3 and 100 characters')
    .matches(/^[A-Z0-9\-_\/]+$/)
    .withMessage(
      'Registry number can only contain uppercase letters, numbers, hyphens, underscores, and slashes'
    ),

  body('mozaVillage')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Moza/Village cannot exceed 200 characters'),

  body('khasraNo')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Khasra number cannot exceed 50 characters'),

  body('khewatNo')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Khewat number cannot exceed 50 characters'),

  body('khatoniNo')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Khatoni number cannot exceed 50 characters'),

  body('mutationNo')
    .trim()
    .notEmpty()
    .withMessage('Mutation number is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Mutation number must be between 3 and 100 characters')
    .matches(/^[A-Z0-9\-_\/]+$/)
    .withMessage(
      'Mutation number can only contain uppercase letters, numbers, hyphens, underscores, and slashes'
    ),

  body('mutationDate').optional().isISO8601().withMessage('Please provide a valid mutation date'),

  body('areaKanal')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Area in Kanal must be between 0 and 1000'),

  body('areaMarla')
    .optional()
    .isFloat({ min: 0, max: 20000 })
    .withMessage('Area in Marla must be between 0 and 20000'),

  body('areaSqft')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Area in Sqft must be between 0 and 1,000,000'),

  body('mutationArea')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Mutation area cannot exceed 100 characters'),

  body('legalOfficeDetails')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Legal & office details cannot exceed 1000 characters'),

  body('subRegistrarName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Sub-registrar name cannot exceed 200 characters'),

  body('agreementDate').optional().isISO8601().withMessage('Please provide a valid agreement date'),

  body('stampPaperNo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Stamp paper number cannot exceed 100 characters'),

  body('tabadlaNama')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Tabadla Nama details cannot exceed 500 characters'),

  body('bookNo')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Book number cannot exceed 50 characters'),

  body('volumeNo')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Volume number cannot exceed 50 characters'),

  body('documentNo')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Document number cannot exceed 50 characters'),

  body('reportNo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Report number cannot exceed 100 characters'),

  body('scanCopyPath')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Scan copy path cannot exceed 500 characters'),

  body('landOwnerPhoto')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Land owner photo path cannot exceed 500 characters'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),

  // Validate that at least one area field is provided
  body().custom((_value, { req }) => {
    const { areaKanal, areaMarla, areaSqft } = req.body;

    if (!areaKanal && !areaMarla && !areaSqft) {
      throw new Error(
        'At least one area measurement is required (areaKanal, areaMarla, or areaSqft)'
      );
    }

    return true;
  }),
];

export const validateUpdateRegistry = (): ValidationChain[] => [
  body('plotId').optional().trim().isMongoId().withMessage('Invalid Plot ID'),

  body('memId').optional().trim().isMongoId().withMessage('Invalid Member ID'),

  body('registryNo')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Registry number must be between 3 and 100 characters')
    .matches(/^[A-Z0-9\-_\/]+$/)
    .withMessage(
      'Registry number can only contain uppercase letters, numbers, hyphens, underscores, and slashes'
    ),

  body('mutationNo')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Mutation number must be between 3 and 100 characters')
    .matches(/^[A-Z0-9\-_\/]+$/)
    .withMessage(
      'Mutation number can only contain uppercase letters, numbers, hyphens, underscores, and slashes'
    ),

  // All other optional fields with same validation as create
  body('mozaVillage')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Moza/Village cannot exceed 200 characters'),

  body('khasraNo')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Khasra number cannot exceed 50 characters'),

  body('khewatNo')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Khewat number cannot exceed 50 characters'),

  body('khatoniNo')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Khatoni number cannot exceed 50 characters'),

  body('mutationDate').optional().isISO8601().withMessage('Please provide a valid mutation date'),

  body('areaKanal')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Area in Kanal must be between 0 and 1000'),

  body('areaMarla')
    .optional()
    .isFloat({ min: 0, max: 20000 })
    .withMessage('Area in Marla must be between 0 and 20000'),

  body('areaSqft')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Area in Sqft must be between 0 and 1,000,000'),

  body('subRegistrarName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Sub-registrar name cannot exceed 200 characters'),

  body('agreementDate').optional().isISO8601().withMessage('Please provide a valid agreement date'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks cannot exceed 1000 characters'),
];

export const validateGetRegistries = (): ValidationChain[] => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),

  query('plotId').optional().isMongoId().withMessage('Invalid Plot ID'),

  query('memId').optional().isMongoId().withMessage('Invalid Member ID'),

  query('registryNo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Registry number cannot exceed 100 characters'),

  query('mutationNo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Mutation number cannot exceed 100 characters'),

  query('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear()}`),

  query('verificationStatus')
    .optional()
    .isIn(['Pending', 'Verified', 'Rejected'])
    .withMessage('Verification status must be Pending, Verified, or Rejected'),

  query('sortBy')
    .optional()
    .isIn([
      'createdAt',
      'updatedAt',
      'registryNo',
      'mutationNo',
      'mutationDate',
      'agreementDate',
      'verificationStatus',
      'areaKanal',
      'areaMarla',
      'areaSqft',
    ])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
];

export const validateRegistryNoParam = (): ValidationChain[] => [
  param('registryNo')
    .trim()
    .notEmpty()
    .withMessage('Registry number is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Registry number must be between 3 and 100 characters')
    .matches(/^[A-Z0-9\-_\/]+$/)
    .withMessage(
      'Registry number can only contain uppercase letters, numbers, hyphens, underscores, and slashes'
    ),
];

export const validateMutationNoParam = (): ValidationChain[] => [
  param('mutationNo')
    .trim()
    .notEmpty()
    .withMessage('Mutation number is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Mutation number must be between 3 and 100 characters')
    .matches(/^[A-Z0-9\-_\/]+$/)
    .withMessage(
      'Mutation number can only contain uppercase letters, numbers, hyphens, underscores, and slashes'
    ),
];

export const validatePlotIdParam = (): ValidationChain[] => [
  param('plotId')
    .trim()
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID'),
];

export const validateMemIdParam = (): ValidationChain[] => [
  param('memId')
    .trim()
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid Member ID'),
];

export const validateYearParam = (): ValidationChain[] => [
  param('year')
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear()}`),
];

export const validateVerification = (): ValidationChain[] => [
  body('verificationStatus')
    .notEmpty()
    .withMessage('Verification status is required')
    .isIn(['Verified', 'Rejected'])
    .withMessage('Verification status must be either "Verified" or "Rejected"'),

  body('verificationRemarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Verification remarks cannot exceed 500 characters'),
];
