// Export types
export * from './types/types-privacy';

// Export services
export { privacyService } from './services/service-privacy';

// Export controllers
export { privacyController } from './controllers/controller-privacy';

// Export routes
export { default as privacyRoutes } from './routes/routes-privacy';

// Export validators
export {
  validateUpdatePrivacySettings,
  validateGetAccessLog,
  validateUpdateConsent,
  validateGetMemberSettings,
} from './validator/validator-privacy';

// Export middleware
export { applyPrivacyFilters } from './middleware/privacy.middleware';
