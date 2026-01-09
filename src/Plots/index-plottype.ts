// Export types
export * from './types/types-plottype';

// Export services
export { plotTypeService } from './services/service-plottype';

// Export controllers
export { plotTypeController } from './controllers/controller-plottype';

// Export routes
export { default as plotTypeRoutes } from './routes/routes-plottype';

// Export validators
export {
  validateCreatePlotType,
  validateGetPlotTypes,
  validateUpdatePlotType,
} from './validators/validator-plottype';
