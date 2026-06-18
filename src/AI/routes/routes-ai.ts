import { Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { aiController } from '../controllers/controller-ai';
import {
  validateChat,
  validateConversationId,
  validateCreateInsight,
  validateGetConversations,
  validateGetDashboardInsights,
  validateGetInsights,
  validateInsightId,
} from '../validator/validator-ai';

// Create a local validateRequest function to avoid circular dependencies
import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    const formattedErrors = errorMessages.map(err => `${err.field}: ${err.message}`).join(', ');
    const error = new Error(`Validation failed: ${formattedErrors}`);
    (error as any).statusCode = 400;
    throw error;
  }
  next();
};

const router: Router = Router();

// Chat routes
router.post(
  '/chat',
  authenticate,
  validateChat(),
  validateRequest,
  aiController.chat
);

// Conversation routes
router.get(
  '/conversations',
  authenticate,
  validateGetConversations(),
  validateRequest,
  aiController.getConversations
);

router.get(
  '/conversations/:id',
  authenticate,
  validateConversationId(),
  validateRequest,
  aiController.getConversation
);

router.delete(
  '/conversations/:id',
  authenticate,
  validateConversationId(),
  validateRequest,
  aiController.deleteConversation
);

router.post(
  '/conversations/:id/archive',
  authenticate,
  validateConversationId(),
  validateRequest,
  aiController.archiveConversation
);

// Insight routes
router.get(
  '/insights',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetInsights(),
  validateRequest,
  aiController.getInsights
);

router.post(
  '/insights',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateCreateInsight(),
  validateRequest,
  aiController.createInsight
);

router.post(
  '/insights/:id/acknowledge',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateInsightId(),
  validateRequest,
  aiController.acknowledgeInsight
);

router.delete(
  '/insights/:id',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN),
  validateInsightId(),
  validateRequest,
  aiController.deleteInsight
);

// Dashboard insights
router.get(
  '/dashboard-insights',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateGetDashboardInsights(),
  validateRequest,
  aiController.getDashboardInsights
);

export default router;
