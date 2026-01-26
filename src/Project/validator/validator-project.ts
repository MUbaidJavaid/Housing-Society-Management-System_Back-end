import { body, param, query } from 'express-validator';
import { projectService } from '../services/service-project';
import { ProjectStatus, ProjectType } from '../types/types-project';
import { Types } from 'mongoose';

export const validateCreateProject = [
  body('projName')
    .notEmpty()
    .withMessage('Project Name is required')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Project Name must be 2-200 characters')
    .custom(async value => {
      const exists = await projectService.checkProjectExists(value, '');
      if (exists.nameExists) {
        throw new Error('Project with this name already exists');
      }
      return true;
    }),

  body('projCode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Project Code must be 2-20 characters')
    .custom(async value => {
      if (value) {
        const exists = await projectService.checkProjectExists('', value.toUpperCase());
        if (exists.codeExists) {
          throw new Error('Project with this code already exists');
        }
      }
      return true;
    }),

  body('projLocation')
    .notEmpty()
    .withMessage('Project Location is required')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),

  body('projPrefix')
    .notEmpty()
    .withMessage('Project Prefix is required')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Project Prefix must be 2-10 characters'),

  body('totalArea')
    .notEmpty()
    .withMessage('Total Area is required')
    .isFloat({ min: 0.01 })
    .withMessage('Total Area must be greater than 0'),

  body('areaUnit')
    .notEmpty()
    .withMessage('Area Unit is required')
    .isIn(['acres', 'hectares', 'sqft', 'sqm', 'km²', 'marla', 'kanal'])
    .withMessage('Invalid area unit'),

  body('totalPlots')
    .notEmpty()
    .withMessage('Total Plots is required')
    .isInt({ min: 1 })
    .withMessage('Total Plots must be at least 1'),

  body('launchDate')
    .notEmpty()
    .withMessage('Launch Date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => {
      const date = new Date(value);
      if (date > new Date()) {
        throw new Error('Launch Date cannot be in the future');
      }
      return true;
    }),

  body('completionDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),

  body('projStatus')
    .optional()
    .isIn(Object.values(ProjectStatus))
    .withMessage('Invalid project status'),

  body('projType')
    .optional()
    .isIn(Object.values(ProjectType))
    .withMessage('Invalid project type'),

  body('cityId')
    .notEmpty()
    .withMessage('City ID is required')
    .custom(value => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('Invalid city ID format');
      }
      return true;
    }),

  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),

  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  // Custom validator for date consistency
  body().custom((_value, { req }) => {
    if (req.body.completionDate && req.body.launchDate) {
      const completionDate = new Date(req.body.completionDate);
      const launchDate = new Date(req.body.launchDate);

      if (completionDate < launchDate) {
        throw new Error('Completion Date must be after Launch Date');
      }
    }
    return true;
  }),
];

export const validateUpdateProject = [
  param('id').isMongoId().withMessage('Invalid project ID'),

  body('projName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Project Name must be 2-200 characters')
    .custom(async (value, { req }) => {
      if (value) {
        const exists = await projectService.checkProjectExists(value, '', req.params?.id);
        if (exists.nameExists) {
          throw new Error('Project with this name already exists');
        }
      }
      return true;
    }),

  body('projCode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Project Code must be 2-20 characters')
    .custom(async (value, { req }) => {
      if (value) {
        const exists = await projectService.checkProjectExists(
          '',
          value.toUpperCase(),
          req.params?.id
        );
        if (exists.codeExists) {
          throw new Error('Project with this code already exists');
        }
      }
      return true;
    }),

  body('cityId') // Changed from city to cityId
    .optional()
    .custom(value => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('Invalid city ID format');
      }
      return true
    }),

  body('launchDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => {
      const date = new Date(value);
      if (date > new Date()) {
        throw new Error('Launch Date cannot be in the future');
      }
      return true;
    }),

  body('completionDate').optional().isISO8601().withMessage('Invalid date format'),

  body('totalPlots').optional().isInt({ min: 1 }).withMessage('Total Plots must be at least 1'),

  body('plotsSold').optional().isInt({ min: 0 }).withMessage('Plots Sold cannot be negative'),

  body('plotsReserved').optional().isInt({ min: 0 }).withMessage('Plots Reserved cannot be negative'),

  // Custom validator for plot count consistency
  body().custom(async (_value, { req }) => {
    if (
      req.body.totalPlots !== undefined ||
      req.body.plotsSold !== undefined ||
      req.body.plotsReserved !== undefined) {  // Get current project
      const project = await projectService.getProjectById(req.params?.id);
      if (project) {
        const totalPlots =
          req.body.totalPlots !== undefined ? req.body.totalPlots : project.totalPlots;
        const plotsSold = req.body.plotsSold !== undefined ? req.body.plotsSold : project.plotsSold;
        const plotsReserved =
          req.body.plotsReserved !== undefined ? req.body.plotsReserved : project.plotsReserved;

        if (plotsSold + plotsReserved > totalPlots) {
          throw new Error('Plots sold + reserved cannot exceed total plots');
        }
      }
    }

    // Validate date consistency
    if (req.body.completionDate && req.body.launchDate) {
      const completionDate = new Date(req.body.completionDate);
      const launchDate = new Date(req.body.launchDate);

      if (completionDate < launchDate) {
        throw new Error('Completion Date must be after Launch Date');
      }
    }

    return true;
  }),
];

export const validateGetProjects = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('cityId') // Changed from city to cityId
    .optional()
    .custom(value => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('Invalid city ID format');
      }
      return true;
    }),
  query('status')
    .optional()
    .custom(value => {
      if (value) {
        const statuses = value.split(',');
        const invalid = statuses.find(
          (s: string) => !Object.values(ProjectStatus).includes(s as ProjectStatus)
        );
        if (invalid) throw new Error(`Invalid status: ${invalid}`);
      }
      return true;
    }),
  query('type')
    .optional()
    .custom(value => {
      if (value) {
        const types = value.split(',');
        const invalid = types.find(
          (t: string) => !Object.values(ProjectType).includes(t as ProjectType)
        );
        if (invalid) throw new Error(`Invalid type: ${invalid}`);
      }
      return true;
    }),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
  query('minPlots').optional().isInt({ min: 0 }).withMessage('Minimum plots must be non-negative'),
  query('maxPlots').optional().isInt({ min: 0 }).withMessage('Maximum plots must be non-negative'),
  query('minArea').optional().isFloat({ min: 0 }).withMessage('Minimum area must be non-negative'),
  query('maxArea').optional().isFloat({ min: 0 }).withMessage('Maximum area must be non-negative'),
  query('launchedAfter').optional().isISO8601().withMessage('Invalid date format'),
  query('launchedBefore').optional().isISO8601().withMessage('Invalid date format'),
];

export const validateUpdateProjectStatus = [
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(ProjectStatus))
    .withMessage('Invalid project status'),
];

export const validateBulkUpdateStatus = [
  body('projectIds')
    .notEmpty()
    .withMessage('Project IDs are required')
    .isArray()
    .withMessage('Project IDs must be an array')
    .custom(value => value.length > 0)
    .withMessage('At least one project ID is required'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(ProjectStatus))
    .withMessage('Invalid project status'),
];

export const validatePlotCountUpdate = [
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['sold', 'reserved'])
    .withMessage('Type must be either "sold" or "reserved"'),

  body('count').optional().isInt({ min: 1 }).withMessage('Count must be at least 1'),
];

export const validateLocationSearch = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  query('maxDistance')
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage('Max distance must be between 100 and 50000 meters'),
];
