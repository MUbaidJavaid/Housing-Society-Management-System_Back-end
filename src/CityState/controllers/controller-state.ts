import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { CreateStateDto, StateQueryParams, stateService } from '../index-state';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const stateController = {
  createState: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateStateDto = req.body;

      if (!createData.stateName?.trim()) {
        throw new AppError(400, 'State Name is required');
      }

      const exists = await stateService.checkStateExists(createData.stateName);
      if (exists) {
        throw new AppError(409, 'State with this name already exists');
      }

      const state = await stateService.createState(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: state,
        message: 'State created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getState: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const state = await stateService.getStateById(id);

      if (!state || (state as any).isDeleted) {
        throw new AppError(404, 'State not found');
      }

      res.json({
        success: true,
        data: state,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getStateWithCities: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const state = await stateService.getStateWithCities(id);

      if (!state) {
        throw new AppError(404, 'State not found');
      }

      res.json({
        success: true,
        data: state,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getStates: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: StateQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        statusId: req.query.statusId as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await stateService.getStates(queryParams);

      res.json({
        success: true,
        data: {
          states: result.states,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getStateSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await stateService.getStateSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAllStates: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const states = await stateService.getAllStates();

      res.json({
        success: true,
        data: states,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateState: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;
      const updateData = req.body;

      const existingState = await stateService.getStateById(id);
      if (!existingState || (existingState as any).isDeleted) {
        throw new AppError(404, 'State not found');
      }

      if (updateData.stateName && updateData.stateName !== existingState.stateName) {
        const exists = await stateService.checkStateExists(updateData.stateName, id);
        if (exists) {
          throw new AppError(409, 'State with this name already exists');
        }
      }

      const updatedState = await stateService.updateState(id, updateData, req.user.userId);

      res.json({
        success: true,
        data: updatedState,
        message: 'State updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteState: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { id } = req.params;

      const existingState = await stateService.getStateById(id);
      if (!existingState || (existingState as any).isDeleted) {
        throw new AppError(404, 'State not found');
      }

      try {
        const deleted = await stateService.deleteState(id, req.user.userId);

        if (!deleted) {
          throw new AppError(500, 'Failed to delete State');
        }

        res.json({
          success: true,
          message: 'State deleted successfully',
        });
      } catch (error: any) {
        if (error.message === 'Cannot delete state with associated cities') {
          throw new AppError(400, error.message);
        }
        throw error;
      }
    } catch (error) {
      handleError(error, next);
    }
  },
};
