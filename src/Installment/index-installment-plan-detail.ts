export * from './types/types-installment-plan-detail';
export { installmentPlanDetailService } from './services/service-installment-plan-detail';
export { installmentPlanDetailController } from './controllers/controller-installment-plan-detail';
export { default as installmentPlanDetailRoutes } from './routes/routes-installment-plan-detail';
export {
  validateBulkInstallmentPlanDetails,
  validateCreateInstallmentPlanDetail,
  validateGetInstallmentPlanDetails,
  validateSearchInstallmentPlanDetails,
  validateUpdateInstallmentPlanDetail,
} from './validator/validator-installment-plan-detail';
