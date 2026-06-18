import { AuthRequest } from '../../auth/types';
import { NextFunction, Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { aiService } from '../services/service-ai';
import {
  ChatDto,
  ConversationQueryParams,
  CreateInsightDto,
  InsightQueryParams,
} from '../types/types-ai';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const aiController = {
  /**
   * Send a message to an AI agent
   */
  chat: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { agentType, message, conversationId, societyId } = req.body as ChatDto;

      if (!message?.trim()) {
        throw new AppError(400, 'Message is required');
      }
      if (!agentType) {
        throw new AppError(400, 'Agent type is required');
      }
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const result = await aiService.chat(
        req.user.userId,
        societyId,
        agentType,
        message,
        conversationId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'AI response generated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get conversations for the authenticated user
   */
  getConversations: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const params: ConversationQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        status: req.query.status as any,
        agentType: req.query.agentType as any,
        sortBy: (req.query.sortBy as string) || 'lastMessageAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await aiService.getConversations(req.user.userId, params);

      res.status(200).json({
        success: true,
        data: result.conversations,
        pagination: result.pagination,
        message: 'Conversations retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get a single conversation with messages
   */
  getConversation: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const conversation = await aiService.getConversation(id, req.user.userId);

      res.status(200).json({
        success: true,
        data: conversation,
        message: 'Conversation retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete a conversation (soft delete)
   */
  deleteConversation: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      await aiService.deleteConversation(id, req.user.userId);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Conversation deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Archive a conversation
   */
  archiveConversation: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      await aiService.archiveConversation(id, req.user.userId);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Conversation archived successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get insights for a society
   */
  getInsights: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const params: InsightQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        insightType: req.query.insightType as any,
        category: req.query.category as any,
        severity: req.query.severity as any,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await aiService.getInsights(societyId, params);

      res.status(200).json({
        success: true,
        data: result.insights,
        pagination: result.pagination,
        message: 'Insights retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Create a new insight
   */
  createInsight: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data: CreateInsightDto = req.body;

      if (!data.societyId) {
        throw new AppError(400, 'Society ID is required');
      }
      if (!data.insightType) {
        throw new AppError(400, 'Insight type is required');
      }
      if (!data.category) {
        throw new AppError(400, 'Category is required');
      }
      if (!data.title?.trim()) {
        throw new AppError(400, 'Title is required');
      }
      if (!data.description?.trim()) {
        throw new AppError(400, 'Description is required');
      }

      const insight = await aiService.createInsight(data);

      res.status(201).json({
        success: true,
        data: insight,
        message: 'Insight created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Acknowledge an insight
   */
  acknowledgeInsight: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const insight = await aiService.acknowledgeInsight(id, req.user.userId);

      res.status(200).json({
        success: true,
        data: insight,
        message: 'Insight acknowledged successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete an insight (soft delete)
   */
  deleteInsight: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      await aiService.deleteInsight(id);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Insight deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get dashboard insights for a society
   */
  getDashboardInsights: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.query.societyId as string;
      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const insights = await aiService.getDashboardInsights(societyId);

      res.status(200).json({
        success: true,
        data: insights,
        message: 'Dashboard insights retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
