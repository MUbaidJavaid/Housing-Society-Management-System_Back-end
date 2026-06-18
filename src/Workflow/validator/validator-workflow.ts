import { body, param, query } from 'express-validator';
import { TriggerType, StepType } from '../models/models-workflow';
import { WorkflowInstanceStatus } from '../models/models-workflow-instance';

export const validateCreateWorkflow = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be 1-200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('societyId')
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),

  body('triggerType')
    .notEmpty()
    .withMessage('Trigger type is required')
    .isIn(Object.values(TriggerType))
    .withMessage('Invalid trigger type'),

  body('triggerEntity')
    .notEmpty()
    .withMessage('Trigger entity is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Trigger entity must be 1-100 characters'),

  body('triggerConditions')
    .optional()
    .isObject()
    .withMessage('Trigger conditions must be an object'),

  body('steps')
    .optional()
    .isArray()
    .withMessage('Steps must be an array'),

  body('steps.*.stepNumber')
    .if(body('steps').exists())
    .notEmpty()
    .withMessage('Step number is required')
    .isInt({ min: 1 })
    .withMessage('Step number must be at least 1'),

  body('steps.*.stepType')
    .if(body('steps').exists())
    .notEmpty()
    .withMessage('Step type is required')
    .isIn(Object.values(StepType))
    .withMessage('Invalid step type'),

  body('steps.*.config')
    .optional()
    .isObject()
    .withMessage('Step config must be an object'),

  body('steps.*.nextStepOnSuccess')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Next step on success must be a positive integer'),

  body('steps.*.nextStepOnFailure')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Next step on failure must be a positive integer'),

  body('steps.*.nextStepOnTimeout')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Next step on timeout must be a positive integer'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const validateUpdateWorkflow = [
  param('id')
    .isMongoId()
    .withMessage('Invalid workflow ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be 1-200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('triggerType')
    .optional()
    .isIn(Object.values(TriggerType))
    .withMessage('Invalid trigger type'),

  body('triggerEntity')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Trigger entity must be 1-100 characters'),

  body('triggerConditions')
    .optional()
    .isObject()
    .withMessage('Trigger conditions must be an object'),

  body('steps')
    .optional()
    .isArray()
    .withMessage('Steps must be an array'),

  body('steps.*.stepNumber')
    .if(body('steps').exists())
    .notEmpty()
    .withMessage('Step number is required')
    .isInt({ min: 1 })
    .withMessage('Step number must be at least 1'),

  body('steps.*.stepType')
    .if(body('steps').exists())
    .notEmpty()
    .withMessage('Step type is required')
    .isIn(Object.values(StepType))
    .withMessage('Invalid step type'),

  body('steps.*.config')
    .optional()
    .isObject()
    .withMessage('Step config must be an object'),

  body('steps.*.nextStepOnSuccess')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Next step on success must be a positive integer'),

  body('steps.*.nextStepOnFailure')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Next step on failure must be a positive integer'),

  body('steps.*.nextStepOnTimeout')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Next step on timeout must be a positive integer'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const validateGetWorkflows = [
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

  query('triggerEntity')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Trigger entity must not be empty'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateGetWorkflowById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid workflow ID'),
];

export const validateDeleteWorkflow = [
  param('id')
    .isMongoId()
    .withMessage('Invalid workflow ID'),
];

export const validateCreateInstance = [
  param('id')
    .isMongoId()
    .withMessage('Invalid workflow ID'),

  body('entityType')
    .notEmpty()
    .withMessage('Entity type is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Entity type must be 1-100 characters'),

  body('entityId')
    .notEmpty()
    .withMessage('Entity ID is required')
    .isMongoId()
    .withMessage('Invalid entity ID'),

  body('societyId')
    .notEmpty()
    .withMessage('Society ID is required')
    .isMongoId()
    .withMessage('Invalid Society ID'),
];

export const validateGetInstances = [
  param('id')
    .isMongoId()
    .withMessage('Invalid workflow ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be 1-200'),

  query('status')
    .optional()
    .isIn(Object.values(WorkflowInstanceStatus))
    .withMessage('Invalid instance status'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export const validateGetInstance = [
  param('instanceId')
    .isMongoId()
    .withMessage('Invalid instance ID'),
];

export const validateApproveRejectStep = [
  param('instanceId')
    .isMongoId()
    .withMessage('Invalid instance ID'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),
];
