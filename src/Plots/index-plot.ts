// Export types
export * from './types/types-plot';

// Export services
export { plotService } from './services/service-plot';

// Export controllers
export { plotController } from './controllers/controller-plot';

// Export routes
export { default as plotRoutes } from './routes/routes-plot';

// Export validators
export {
  validateCreatePlot,
  validateGetPlots,
  validateUpdatePlot,
} from './validators/validator-plot';
