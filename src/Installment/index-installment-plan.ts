// Export types
export * from './types/types-installment-plan';

// Export services
export { installmentPlanService } from './services/service-installment-plan';

// Export controllers
export { installmentPlanController } from './controllers/controller-installment-plan';

// Export routes
export { default as installmentPlanRoutes } from './routes/routes-installment-plan';

// Export validators
export {
  validateCreateInstallmentPlan,
  validateGetInstallmentPlans,
  validateSearchInstallmentPlans,
  validateUpdateInstallmentPlan,
} from './validator/validator-installment-plan';
