// Export types
export * from './types/types-project';

// Export services
export { projectService } from './services/service-project';

// Export controllers
export { projectController } from './controllers/controller-project';

// Export routes
export { default as projectRoutes } from './routes/routes-project';

// Export validators
export {
  validateCreateProject,
  validateGetProjects,
  validateUpdateProject,
} from './validator/validator-project';
