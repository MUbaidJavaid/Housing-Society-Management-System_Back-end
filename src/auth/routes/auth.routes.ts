import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

import { googleAuthController } from '../controllers/google.controller';
import {
  authenticate,
  authRateLimiter,
  optionalAuth,
  requireEmailVerification,
} from '../middleware/auth';
import { validate } from '../validators/auth.validator';

const router: Router = Router();

// Rate limiting
const loginRateLimiter = authRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const registerRateLimiter = authRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour
const otpRateLimiter = authRateLimiter(3, 15 * 60 * 1000); // 3 attempts per 15 minutes

/**
 * Public routes
 */
// Email/password auth
router.post('/register', registerRateLimiter, validate('register'), authController.register);
router.post('/login', loginRateLimiter, validate('login'), authController.login);
router.post('/refresh-token', authController.refreshToken);

// Register with OTP verification flow
// router.post('/register', registerRateLimiter, validate('register'), authController.register);
// Update the OTP routes section
router.post('/verify-registration-otp', authController.verifyRegistrationOTP);
router.post('/resend-registration-otp', authController.resendRegistrationOTP);

// Email verification with OTP
router.post('/send-verification-otp', otpRateLimiter, authController.sendVerificationOTP);
router.post('/verify-email-otp', authController.verifyEmailWithOTP);

// Password reset with OTP
router.post('/forgot-password', otpRateLimiter, authController.forgotPasswordWithOTP);
router.post('/reset-password-otp', authController.resetPasswordWithOTP);

// Google OAuth
router.get('/google/url', googleAuthController.getAuthUrl);
router.post('/google/callback', googleAuthController.callback);

/**
 * Protected routes
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

export default router;
