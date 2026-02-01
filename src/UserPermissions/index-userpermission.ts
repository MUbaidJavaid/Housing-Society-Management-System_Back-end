// Export types
export * from './types/types-userpermission';

// Export models
export { default as UserPermissionModel } from './models/models-userpermission';

// Export services
export { userPermissionService } from './services/service-userpermission';

// Export controllers
export { userPermissionController } from './controllers/controller-userpermission';

// Export routes
export { default as userPermissionRoutes } from './routes/routes-userpermission';

// Export validators
export {
  validateBulkPermissionUpdate,
  validateCheckPermission,
  validateCopyPermissions,
  validateCreateUserPermission,
  validateGetByRoleAndModule,
  validateGetUserPermissions,
  validateModuleIdParam,
  validateRoleIdParam,
  validateSetPermissions,
  validateUpdateUserPermission,
} from './validators/validator-userpermission';
