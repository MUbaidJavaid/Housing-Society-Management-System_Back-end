// Export types
export * from './types';

// Export services
export { jwtService } from './jwt';
export { passwordService, passwordValidator } from './password';
export { authService } from './services/auth.service';

// Export middleware
export {
  authenticate,
  authRateLimiter,
  optionalAuth,
  requireEmailVerification,
  requireOwnership,
  requirePermission,
  requireRole,
} from './middleware/auth';

// Export controllers
export { authController } from './controllers/auth.controller';
export { userController } from './controllers/user.controller';

// Export routes
export { default as authRoutes } from './routes/auth.routes';

// Export validators
export { checkValidation, validate } from './validators/auth.validator';
