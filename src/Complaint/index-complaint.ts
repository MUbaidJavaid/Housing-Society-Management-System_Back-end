// Export types
export * from './types/types-complaint';

// Export models
export { default as ComplaintModel } from './models/models-complaint';

// Export services
export { complaintService } from './services/service-complaint';

// Export controllers
export { complaintController } from './controllers/controller-complaint';

// Export routes
export { default as complaintRoutes } from './routes/routes-complaint';

// Export validators
export {
  validateAddAttachment,
  validateAssignComplaint,
  validateBulkStatusUpdate,
  validateCreateComplaint,
  validateEscalateComplaint,
  validateGetComplaints,
  validateRemoveAttachment,
  validateResolveComplaint,
  validateUpdateComplaint,
} from './validators/validator-complaint';
