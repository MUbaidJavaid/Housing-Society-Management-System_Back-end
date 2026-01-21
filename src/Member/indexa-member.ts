// Export existing modules
export { memberController } from './controllers/controller-member';
export { default as memberRoutes } from './routes/routes-member';
export { memberService } from './services/service-member';
export * from './types/types-member';
export {
  validateCreateMember,
  validateGetMembers,
  validateUpdateMember,
} from './validator/validator-member';

// Export new auth modules
export { authMemberController } from './controllers/auth-member.controller';
export { default as authMemberRoutes } from './routes/auth-member.routes';
export { authMemberService } from './services/auth-member.service';

export {
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
} from './validator/auth-member.validator';
