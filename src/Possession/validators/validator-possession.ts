import { body, param, query } from 'express-validator';
import { PossessionStatus } from '../types/types-possession';

export const validateCreatePossession = [
  body('fileId')
    .notEmpty()
    .withMessage('File ID is required')
    .isMongoId()
    .withMessage('Invalid File ID format'),

  body('plotId')
    .notEmpty()
    .withMessage('Plot ID is required')
    .isMongoId()
    .withMessage('Invalid Plot ID format'),

  body('possessionInitDate')
    .notEmpty()
    .withMessage('Application Date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => {
      const date = new Date(value);
      if (date > new Date()) {
        throw new Error('Application Date cannot be in the future');
      }
      return true;
    }),

  body('possessionHandoverCSR')
    .notEmpty()
    .withMessage('Handover CSR is required')
    .isMongoId()
    .withMessage('Invalid CSR ID format'),

  body('possessionStatus')
    .optional()
    .isIn(Object.values(PossessionStatus))
    .withMessage('Invalid possession status'),

  body('possessionCollectorNic')
    .optional()
    .matches(/^\d{5}-\d{7}-\d{1}$|^\d{13}$/)
    .withMessage('Please enter a valid CNIC (XXXXX-XXXXXXX-X or 13 digits)'),

  body('possessionLatitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('possessionLongitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  // Custom validator for date consistency
  body().custom((_value, { req }) => {
    if (req.body.possessionHandoverDate && req.body.possessionInitDate) {
      const handoverDate = new Date(req.body.possessionHandoverDate);
      const initDate = new Date(req.body.possessionInitDate);

      if (handoverDate < initDate) {
        throw new Error('Handover Date must be after Application Date');
      }
    }

    if (req.body.possessionSurveyDate && req.body.possessionInitDate) {
      const surveyDate = new Date(req.body.possessionSurveyDate);
      const initDate = new Date(req.body.possessionInitDate);

      if (surveyDate < initDate) {
        throw new Error('Survey Date must be after Application Date');
      }
    }

    if (req.body.possessionCollectionDate && req.body.possessionInitDate) {
      const collectionDate = new Date(req.body.possessionCollectionDate);
      const initDate = new Date(req.body.possessionInitDate);

      if (collectionDate < initDate) {
        throw new Error('Collection Date must be after Application Date');
      }
    }

    return true;
  }),
];

export const validateUpdatePossession = [
  param('id').isMongoId().withMessage('Invalid possession ID'),

  body('possessionInitDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => {
      const date = new Date(value);
      if (date > new Date()) {
        throw new Error('Application Date cannot be in the future');
      }
      return true;
    }),

  body('possessionCollectorNic')
    .optional()
    .matches(/^\d{5}-\d{7}-\d{1}$|^\d{13}$/)
    .withMessage('Please enter a valid CNIC (XXXXX-XXXXXXX-X or 13 digits)'),

  body('possessionLatitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('possessionLongitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  // Custom validator for date consistency
  body().custom((_value, { req }) => {
    if (req.body.possessionHandoverDate && req.body.possessionInitDate) {
      const handoverDate = new Date(req.body.possessionHandoverDate);
      const initDate = new Date(req.body.possessionInitDate);

      if (handoverDate < initDate) {
        throw new Error('Handover Date must be after Application Date');
      }
    }

    if (req.body.possessionSurveyDate && req.body.possessionInitDate) {
      const surveyDate = new Date(req.body.possessionSurveyDate);
      const initDate = new Date(req.body.possessionInitDate);

      if (surveyDate < initDate) {
        throw new Error('Survey Date must be after Application Date');
      }
    }

    if (req.body.possessionCollectionDate && req.body.possessionInitDate) {
      const collectionDate = new Date(req.body.possessionCollectionDate);
      const initDate = new Date(req.body.possessionInitDate);

      if (collectionDate < initDate) {
        throw new Error('Collection Date must be after Application Date');
      }
    }

    return true;
  }),
];

export const validateGetPossessions = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('fileId').optional().isMongoId().withMessage('Invalid File ID format'),
  query('plotId').optional().isMongoId().withMessage('Invalid Plot ID format'),
  query('status')
    .optional()
    .custom(value => {
      if (value) {
        const statuses = value.split(',');
        const invalid = statuses.find(
          (s: string) => !Object.values(PossessionStatus).includes(s as PossessionStatus)
        );
        if (invalid) throw new Error(`Invalid status: ${invalid}`);
      }
      return true;
    }),
  query('isCollected').optional().isBoolean().withMessage('isCollected must be a boolean value'),
  query('csrId').optional().isMongoId().withMessage('Invalid CSR ID format'),
  query('startDate').optional().isISO8601().withMessage('Invalid date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid date format'),
  query('minDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum duration must be non-negative'),
  query('maxDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum duration must be non-negative'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

export const validateStatusTransition = [
  param('id').isMongoId().withMessage('Invalid possession ID'),
  body('newStatus')
    .notEmpty()
    .withMessage('New status is required')
    .isIn(Object.values(PossessionStatus))
    .withMessage('Invalid possession status'),

  body('surveyDate').optional().isISO8601().withMessage('Invalid date format'),

  body('handoverDate').optional().isISO8601().withMessage('Invalid date format'),
];

export const validateCollectorUpdate = [
  param('id').isMongoId().withMessage('Invalid possession ID'),
  body('collectorName')
    .notEmpty()
    .withMessage('Collector Name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Collector Name must be 2-100 characters'),

  body('collectorNic')
    .notEmpty()
    .withMessage('Collector CNIC is required')
    .matches(/^\d{5}-\d{7}-\d{1}$|^\d{13}$/)
    .withMessage('Please enter a valid CNIC (XXXXX-XXXXXXX-X or 13 digits)'),

  body('collectionDate').optional().isISO8601().withMessage('Invalid date format'),

  body('isCollected')
    .notEmpty()
    .withMessage('isCollected is required')
    .isBoolean()
    .withMessage('isCollected must be a boolean value'),
];

export const validateBulkStatusUpdate = [
  body('possessionIds')
    .notEmpty()
    .withMessage('Possession IDs are required')
    .isArray()
    .withMessage('Possession IDs must be an array')
    .custom(value => value.length > 0)
    .withMessage('At least one possession ID is required'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(PossessionStatus))
    .withMessage('Invalid possession status'),
];

export const validateReportGeneration = [
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('status')
    .optional()
    .isIn(Object.values(PossessionStatus))
    .withMessage('Invalid possession status'),

  body('csrId').optional().isMongoId().withMessage('Invalid CSR ID format'),

  body('projectId').optional().isMongoId().withMessage('Invalid Project ID format'),

  // Custom validator for date range
  body().custom((_value, { req }) => {
    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);

      if (endDate < startDate) {
        throw new Error('End date must be after start date');
      }
    }
    return true;
  }),
];

export const validateHandoverCertificate = [
  body('possessionId')
    .notEmpty()
    .withMessage('Possession ID is required')
    .isMongoId()
    .withMessage('Invalid Possession ID format'),

  body('certificateNumber')
    .notEmpty()
    .withMessage('Certificate Number is required')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Certificate Number must be 3-50 characters'),

  body('certificateDate')
    .notEmpty()
    .withMessage('Certificate Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('issuedBy')
    .notEmpty()
    .withMessage('Issued By is required')
    .isMongoId()
    .withMessage('Invalid User ID format'),

  body('authorizedSignatory')
    .notEmpty()
    .withMessage('Authorized Signatory is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Authorized Signatory must be 2-100 characters'),

  body('certificatePath')
    .notEmpty()
    .withMessage('Certificate Path is required')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Certificate Path cannot exceed 500 characters'),
];

export const validateSurveyUpdate = [
  param('id').isMongoId().withMessage('Invalid possession ID'),
  body('surveyPerson')
    .notEmpty()
    .withMessage('Survey Person is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Survey Person must be 2-100 characters'),

  body('surveyDate').optional().isISO8601().withMessage('Invalid date format'),

  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];
