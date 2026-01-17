// Export types
export * from './types/types-status';

// Export services
export { statusService } from './services/service-status';

// Export controllers
export { statusController } from './controllers/controller-status';

// Export routes
export { default as statusRoutes } from './routes/routes-status';

// Export validators
export {
  validateCreateStatus,
  validateGetStatuses,
  validateUpdateStatus,
} from './validator/validator-satus';
