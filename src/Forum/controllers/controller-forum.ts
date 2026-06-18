import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { forumService } from '../services/service-forum';
import {
  CreateReplyDto,
  CreateThreadDto,
  ReplyQueryParams,
  ThreadQueryParams,
  UpdateReplyDto,
  UpdateThreadDto,
} from '../types/types-forum';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const forumController = {
  // ── Thread Controllers ──

  createThread: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data: CreateThreadDto = req.body;
      const thread = await forumService.createThread(data, req.user.userId);

      res.status(201).json({
        success: true,
        data: thread,
        message: 'Thread created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getThreads: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: ThreadQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        societyId: req.query.societyId as string,
        category: req.query.category as string,
        isPinned: req.query.isPinned ? req.query.isPinned === 'true' : undefined,
        status: req.query.status as string,
        authorId: req.query.authorId as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await forumService.getThreads(queryParams);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        message: 'Threads retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getThread: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const thread = await forumService.getThreadById(id);

      if (!thread) {
        throw new AppError(404, 'Thread not found');
      }

      res.status(200).json({
        success: true,
        data: thread,
        message: 'Thread retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateThread: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const data: UpdateThreadDto = req.body;
      const thread = await forumService.updateThread(id, data, req.user.userId);

      if (!thread) {
        throw new AppError(404, 'Thread not found');
      }

      res.status(200).json({
        success: true,
        data: thread,
        message: 'Thread updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteThread: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const thread = await forumService.deleteThread(id, req.user.userId);

      if (!thread) {
        throw new AppError(404, 'Thread not found');
      }

      res.status(200).json({
        success: true,
        data: thread,
        message: 'Thread deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  pinThread: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const thread = await forumService.pinThread(id);

      if (!thread) {
        throw new AppError(404, 'Thread not found');
      }

      res.status(200).json({
        success: true,
        data: thread,
        message: `Thread ${thread.isPinned ? 'pinned' : 'unpinned'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  lockThread: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const thread = await forumService.lockThread(id);

      if (!thread) {
        throw new AppError(404, 'Thread not found');
      }

      res.status(200).json({
        success: true,
        data: thread,
        message: `Thread ${thread.isLocked ? 'locked' : 'unlocked'} successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  likeThread: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const thread = await forumService.likeThread(id, req.user.userId);

      if (!thread) {
        throw new AppError(404, 'Thread not found');
      }

      res.status(200).json({
        success: true,
        data: thread,
        message: 'Thread like toggled successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  flagThread: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const thread = await forumService.flagThread(id, req.user.userId);

      if (!thread) {
        throw new AppError(404, 'Thread not found');
      }

      res.status(200).json({
        success: true,
        data: thread,
        message: 'Thread flagged successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // ── Reply Controllers ──

  createReply: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const threadId = req.params.threadId as string;
      const data: CreateReplyDto = req.body;
      const reply = await forumService.createReply(threadId, data, req.user.userId);

      res.status(201).json({
        success: true,
        data: reply,
        message: 'Reply created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getReplies: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threadId = req.params.threadId as string;
      const queryParams: ReplyQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        parentReplyId: req.query.parentReplyId as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await forumService.getReplies(threadId, queryParams);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        message: 'Replies retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateReply: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const replyId = req.params.replyId as string;
      const data: UpdateReplyDto = req.body;
      const reply = await forumService.updateReply(replyId, data, req.user.userId);

      if (!reply) {
        throw new AppError(404, 'Reply not found');
      }

      res.status(200).json({
        success: true,
        data: reply,
        message: 'Reply updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteReply: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const replyId = req.params.replyId as string;
      const reply = await forumService.deleteReply(replyId, req.user.userId);

      if (!reply) {
        throw new AppError(404, 'Reply not found');
      }

      res.status(200).json({
        success: true,
        data: reply,
        message: 'Reply deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  likeReply: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const replyId = req.params.replyId as string;
      const reply = await forumService.likeReply(replyId, req.user.userId);

      if (!reply) {
        throw new AppError(404, 'Reply not found');
      }

      res.status(200).json({
        success: true,
        data: reply,
        message: 'Reply like toggled successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  flagReply: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const replyId = req.params.replyId as string;
      const reply = await forumService.flagReply(replyId, req.user.userId);

      if (!reply) {
        throw new AppError(404, 'Reply not found');
      }

      res.status(200).json({
        success: true,
        data: reply,
        message: 'Reply flagged successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  // ── Stats ──

  getStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const societyId = req.query.societyId as string;

      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const stats = await forumService.getForumStats(societyId);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Forum statistics retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
