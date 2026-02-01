// Export types
export * from './types/types-announcement';

// Export models
export { default as AnnouncementModel } from './models/models-announcement';

// Export services
export { announcementService } from './services/service-announcement';

// Export controllers
export { announcementController } from './controllers/controller-announcement';

// Export routes
export { default as announcementRoutes } from './routes/routes-announcement';

// Export validators
export {
  validateCreateAnnouncement,
  validateUpdateAnnouncement,
  validateGetAnnouncements,
  validateGetActiveAnnouncements,
  validatePublishAnnouncement,
  validateCategoryIdParam,
  validateAuthorIdParam,
} from './validators/validator-announcement';
