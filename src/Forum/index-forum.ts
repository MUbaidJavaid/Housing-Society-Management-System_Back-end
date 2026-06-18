// Export types
export * from './types/types-forum';

// Export models
export { default as ForumThreadModel } from './models/models-forum';
export { default as ForumReplyModel } from './models/models-forum-reply';

// Export services
export { forumService } from './services/service-forum';

// Export controllers
export { forumController } from './controllers/controller-forum';

// Export routes
export { default as forumRoutes } from './routes/routes-forum';

// Export validators
export {
  validateCreateThread,
  validateUpdateThread,
  validateGetThreads,
  validateCreateReply,
  validateUpdateReply,
  validateGetReplies,
  validateThreadIdParam,
  validateReplyIdParam,
} from './validator/validator-forum';
