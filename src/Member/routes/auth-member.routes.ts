import { Router } from 'express';
import { authenticate, requireMember } from '../../auth/middleware/auth';
import { authMemberController } from '../controllers/auth-member.controller';
import {
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateLogout,
  validateProfileUpdate,
  validateRefreshToken,
  validateResendVerification,
  validateResetPassword,
  validateSignup,
  validateVerifyEmail,
} from '../validator/auth-member.validator';

const router: Router = Router();

// Public routes (no authentication required)
router.post('/signup', validateSignup(), authMemberController.signup);
router.post('/login', validateLogin(), authMemberController.login);
router.post('/forgot-password', validateForgotPassword(), authMemberController.forgotPassword);
router.post('/reset-password', validateResetPassword(), authMemberController.resetPassword);
router.post('/verify-email', validateVerifyEmail(), authMemberController.verifyEmail);
router.post(
  '/resend-verification',
  validateResendVerification(),
  authMemberController.resendVerification
);
router.post('/refresh-token', validateRefreshToken(), authMemberController.refreshToken);
router.post('/logout', validateLogout(), authMemberController.logout);

// Protected routes (requires member authentication)
router.get('/profile', authenticate, requireMember, authMemberController.getProfile);
router.put(
  '/profile',
  authenticate,
  requireMember,
  validateProfileUpdate(),
  authMemberController.updateProfile
);
router.post(
  '/change-password',
  authenticate,
  requireMember,
  validateChangePassword(),
  authMemberController.changePassword
);

export default router;
