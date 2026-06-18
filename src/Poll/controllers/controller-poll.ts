import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { pollService } from '../services/service-poll';
import { PollQueryParams } from '../types/types-poll';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const pollController = {
  /**
   * Create a new poll
   */
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const poll = await pollService.create(req.body, req.user.userId);

      res.status(201).json({
        success: true,
        data: poll,
        message: 'Poll created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all polls
   */
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: PollQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        societyId: req.query.societyId as string,
        pollType: req.query.pollType as string,
        status: req.query.status as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await pollService.getAll(queryParams);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get poll by ID
   */
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const poll = await pollService.getById(req.params.id as string);

      res.json({
        success: true,
        data: poll,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update poll
   */
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const poll = await pollService.update(req.params.id as string, req.body, req.user.userId);

      res.json({
        success: true,
        data: poll,
        message: 'Poll updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete poll (soft delete)
   */
  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      await pollService.delete(req.params.id as string, req.user.userId);

      res.json({
        success: true,
        message: 'Poll deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Cast vote
   */
  castVote: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { optionIndexes } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const poll = await pollService.castVote(
        req.params.id as string,
        req.user.userId.toString(),
        optionIndexes,
        ipAddress
      );

      res.json({
        success: true,
        data: poll,
        message: 'Vote cast successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get poll results
   */
  getResults: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await pollService.getResults(req.params.id as string);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Close poll
   */
  closePoll: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const poll = await pollService.closePoll(req.params.id as string, req.user.userId);

      res.json({
        success: true,
        data: poll,
        message: 'Poll closed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
