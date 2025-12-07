import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import {
  authenticate,
  authRateLimiter,
  optionalAuth,
  requireEmailVerification,
  requirePermission,
  requireRole,
} from '../middleware/auth';
import { Permission, UserRole } from '../types';
import { validate } from '../validators/auth.validator';
const router: Router = Router();
// Rate limiting for auth endpoints
const loginRateLimiter = authRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const registerRateLimiter = authRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour
const passwordResetRateLimiter = authRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour

/**
 * Public routes
 */
router.post('/register', registerRateLimiter, validate('register'), authController.register);

router.post('/login', loginRateLimiter, validate('login'), authController.login);

router.post('/refresh-token', authController.refreshToken);

router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validate('forgotPassword'),
  authController.forgotPassword
);

router.post('/reset-password', validate('resetPassword'), authController.resetPassword);

router.post('/verify-email', validate('verifyEmail'), authController.verifyEmail);

router.post(
  '/resend-verification',
  validate('resendVerification'),
  authController.resendVerification
);

/**
 * Protected routes (require authentication)
 */
router.get('/me', authenticate, authController.getCurrentUser);

router.post('/logout', optionalAuth, authController.logout);

router.post('/logout-all', authenticate, authController.logoutAll);

router.post(
  '/change-password',
  authenticate,
  requireEmailVerification,
  validate('changePassword'),
  authController.changePassword
);

router.get('/sessions', authenticate, authController.getUserSessions);

router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

router.get('/validate-token', optionalAuth, authController.validateToken);

/**
 * Admin-only routes
 */
router.get(
  '/admin/users',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  requirePermission(Permission.MANAGE_USERS),
  (_req, res) => {
    // Admin user management endpoints
    res.json({ message: 'Admin access granted' });
  }
);

/**
 * Role-specific routes example
 */
router.get(
  '/moderator/dashboard',
  authenticate,
  requireRole(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (_req, res) => {
    res.json({ message: 'Moderator dashboard' });
  }
);

export default router;
