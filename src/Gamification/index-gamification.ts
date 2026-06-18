// Export types
export * from './types/types-gamification';

// Export models
export { default as GamificationPointsModel } from './models/models-gamification-points';
export { default as GamificationRewardModel } from './models/models-gamification-reward';
export { default as GamificationRedemptionModel } from './models/models-gamification-redemption';

// Export services
export { gamificationService } from './services/service-gamification';

// Export controllers
export { gamificationController } from './controllers/controller-gamification';

// Export routes
export { default as gamificationRoutes } from './routes/routes-gamification';

// Export validators
export {
  validateAwardPoints,
  validateGetPoints,
  validateGetHistory,
  validateGetLeaderboard,
  validateCreateReward,
  validateUpdateReward,
  validateRedeemReward,
  validateGetRedemptions,
  validateIdParam,
  validateRedemptionAction,
  validateRejectRedemption,
} from './validator/validator-gamification';
