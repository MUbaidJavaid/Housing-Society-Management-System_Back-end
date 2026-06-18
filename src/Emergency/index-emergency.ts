// Export types
export * from './types/types-emergency';

// Export models
export { default as EmergencyAlertModel } from './models/models-emergency';
export { default as MedicalProfileModel } from './models/models-medical-profile';

// Export services
export { emergencyService } from './services/service-emergency';

// Export controllers
export { emergencyController } from './controllers/controller-emergency';

// Export routes
export { default as emergencyRoutes } from './routes/routes-emergency';

// Export validators
export {
  validateTriggerAlert,
  validateRespondToAlert,
  validateResolveAlert,
  validateAlertHistory,
  validateUpsertMedicalProfile,
  validateIdParam as validateEmergencyIdParam,
  validateFalseAlarm,
} from './validators/validator-emergency';
