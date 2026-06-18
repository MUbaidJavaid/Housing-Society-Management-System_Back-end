import { Router } from 'express';
import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../database/models/User';
import { forumController } from '../controllers/controller-forum';
import {
  validateCreateReply,
  validateCreateThread,
  validateGetReplies,
  validateGetThreads,
  validateReplyIdParam,
  validateThreadIdParam,
  validateUpdateReply,
  validateUpdateThread,
} from '../validator/validator-forum';

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

// ── Stats ──
router.get(
  '/stats',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  forumController.getStats
);

// ── Thread Routes ──

router.get(
  '/threads',
  authenticate,
  validateGetThreads(),
  validateRequest,
  forumController.getThreads
);

router.post(
  '/threads',
  authenticate,
  validateCreateThread(),
  validateRequest,
  forumController.createThread
);

router.get(
  '/threads/:id',
  authenticate,
  forumController.getThread
);

router.put(
  '/threads/:id',
  authenticate,
  validateUpdateThread(),
  validateRequest,
  forumController.updateThread
);

router.delete(
  '/threads/:id',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  forumController.deleteThread
);

router.post(
  '/threads/:id/pin',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  validateThreadIdParam(),
  validateRequest,
  forumController.pinThread
);

router.post(
  '/threads/:id/lock',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  validateThreadIdParam(),
  validateRequest,
  forumController.lockThread
);

router.post(
  '/threads/:id/like',
  authenticate,
  validateThreadIdParam(),
  validateRequest,
  forumController.likeThread
);

router.post(
  '/threads/:id/flag',
  authenticate,
  validateThreadIdParam(),
  validateRequest,
  forumController.flagThread
);

// ── Reply Routes ──

router.get(
  '/threads/:threadId/replies',
  authenticate,
  validateGetReplies(),
  validateRequest,
  forumController.getReplies
);

router.post(
  '/threads/:threadId/replies',
  authenticate,
  validateCreateReply(),
  validateRequest,
  forumController.createReply
);

router.put(
  '/threads/:threadId/replies/:replyId',
  authenticate,
  validateUpdateReply(),
  validateRequest,
  forumController.updateReply
);

router.delete(
  '/threads/:threadId/replies/:replyId',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR),
  forumController.deleteReply
);

router.post(
  '/threads/:threadId/replies/:replyId/like',
  authenticate,
  validateReplyIdParam(),
  validateRequest,
  forumController.likeReply
);

router.post(
  '/threads/:threadId/replies/:replyId/flag',
  authenticate,
  validateReplyIdParam(),
  validateRequest,
  forumController.flagReply
);

export default router;
