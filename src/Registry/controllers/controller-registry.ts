import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { registryService } from '../index-registry';
import {
  CreateRegistryDto,
  RegistryQueryParams,
  RegistrySearchParams,
  UpdateRegistryDto,
} from '../types/types-registry';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const registryController = {
  /**
   * Create new registry
   */
  createRegistry: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateRegistryDto = req.body;

      // Validate required fields
      if (!createData.plotId?.trim()) {
        throw new AppError(400, 'Plot ID is required');
      }

      if (!createData.memId?.trim()) {
        throw new AppError(400, 'Member ID is required');
      }

      if (!createData.registryNo?.trim()) {
        throw new AppError(400, 'Registry number is required');
      }

      if (!createData.mutationNo?.trim()) {
        throw new AppError(400, 'Mutation number is required');
      }

      // Validate area fields
      if (!createData.areaKanal && !createData.areaMarla && !createData.areaSqft) {
        throw new AppError(400, 'At least one area measurement is required');
      }

      // Check if registry number already exists
      const existingRegistry = await registryService.findRegistryByNumber(createData.registryNo);
      if (existingRegistry) {
        throw new AppError(409, 'Registry number already exists');
      }

      // Check if mutation number already exists
      const existingMutation = await registryService.findRegistryByMutationNo(
        createData.mutationNo
      );
      if (existingMutation) {
        throw new AppError(409, 'Mutation number already exists');
      }

      const registry = await registryService.createRegistry(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: registry,
        message: 'Registry created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get registry by ID
   */
  getRegistry: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const registry = await registryService.getRegistryById(id);

      res.json({
        success: true,
        data: registry,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all registries
   */
  getRegistries: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: RegistryQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        plotId: req.query.plotId as string,
        memId: req.query.memId as string,
        registryNo: req.query.registryNo as string,
        mutationNo: req.query.mutationNo as string,
        mozaVillage: req.query.mozaVillage as string,
        khasraNo: req.query.khasraNo as string,
        khewatNo: req.query.khewatNo as string,
        khatoniNo: req.query.khatoniNo as string,
        subRegistrarName: req.query.subRegistrarName as string,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        verificationStatus: req.query.verificationStatus as 'Pending' | 'Verified' | 'Rejected',
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await registryService.getRegistries(queryParams);

      res.json({
        success: true,
        data: {
          registries: result.registries,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update registry
   */
  updateRegistry: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateRegistryDto = req.body;

      // Check if registry number is being changed and if it already exists
      if (updateData.registryNo) {
        const existingRegistry = await registryService.findRegistryByNumber(updateData.registryNo);
        if (existingRegistry && existingRegistry._id.toString() !== id) {
          throw new AppError(409, 'Registry number already exists');
        }
      }

      // Check if mutation number is being changed and if it already exists
      if (updateData.mutationNo) {
        const existingMutation = await registryService.findRegistryByMutationNo(
          updateData.mutationNo
        );
        if (existingMutation && existingMutation._id.toString() !== id) {
          throw new AppError(409, 'Mutation number already exists');
        }
      }

      const updatedRegistry = await registryService.updateRegistry(id, updateData, req.user.userId);

      if (!updatedRegistry) {
        throw new AppError(404, 'Registry not found');
      }

      res.json({
        success: true,
        data: updatedRegistry,
        message: 'Registry updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete registry (soft delete)
   */
  deleteRegistry: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const deleted = await registryService.deleteRegistry(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Registry not found');
      }

      res.json({
        success: true,
        message: 'Registry deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get registry by registry number
   */
  getRegistryByNumber: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const registryNo = req.params.registryNo as string;

      const registry = await registryService.getRegistryByNumber(registryNo);

      if (!registry) {
        throw new AppError(404, 'Registry not found');
      }

      res.json({
        success: true,
        data: registry,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get registry by mutation number
   */
  getRegistryByMutationNo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mutationNo = req.params.mutationNo as string;

      const registry = await registryService.getRegistryByMutationNo(mutationNo);

      if (!registry) {
        throw new AppError(404, 'Registry not found');
      }

      res.json({
        success: true,
        data: registry,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get registries by plot
   */
  getRegistriesByPlot: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plotId = req.params.plotId as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await registryService.getRegistriesByPlot(plotId, page, limit);

      res.json({
        success: true,
        data: result.registries,
        total: result.total,
        pages: result.pages,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get registries by member
   */
  getRegistriesByMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const memId = req.params.memId as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await registryService.getRegistriesByMember(memId, page, limit);

      res.json({
        success: true,
        data: result.registries,
        total: result.total,
        pages: result.pages,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get registry statistics
   */
  getRegistryStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await registryService.getRegistryStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search registries
   */
  searchRegistries: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchParams: RegistrySearchParams = {
        searchTerm: req.query.search as string,
        registryNo: req.query.registryNo as string,
        mutationNo: req.query.mutationNo as string,
        memId: req.query.memId as string,
        plotId: req.query.plotId as string,
        mozaVillage: req.query.mozaVillage as string,
        khasraNo: req.query.khasraNo as string,
        khewatNo: req.query.khewatNo as string,
        khatoniNo: req.query.khatoniNo as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      if (
        !searchParams.searchTerm &&
        !searchParams.registryNo &&
        !searchParams.mutationNo &&
        !searchParams.memId &&
        !searchParams.plotId &&
        !searchParams.mozaVillage &&
        !searchParams.khasraNo &&
        !searchParams.khewatNo &&
        !searchParams.khatoniNo
      ) {
        throw new AppError(400, 'At least one search parameter is required');
      }

      const registries = await registryService.searchRegistries(searchParams);

      res.json({
        success: true,
        data: registries,
        total: registries.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get registries by year
   */
  getRegistriesByYear: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = req.params.year ? parseInt(req.params.year as string) : new Date().getFullYear();

      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        throw new AppError(400, 'Invalid year');
      }

      const registries = await registryService.getRegistriesByYear(year);

      res.json({
        success: true,
        data: registries,
        total: registries.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get registries by sub-registrar
   */
  getRegistriesBySubRegistrar: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subRegistrarName = req.params.subRegistrarName as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await registryService.getRegistriesBySubRegistrar(
        subRegistrarName,
        page,
        limit
      );

      res.json({
        success: true,
        data: result.registries,
        total: result.total,
        pages: result.pages,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update registries
   */
  bulkUpdateRegistries: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { registryIds, ...updateData } = req.body;

      if (!registryIds || !Array.isArray(registryIds) || registryIds.length === 0) {
        throw new AppError(400, 'Registry IDs are required and must be a non-empty array');
      }

      // Validate that at least one field is being updated
      const updateFields = Object.keys(updateData);
      if (updateFields.length === 0) {
        throw new AppError(400, 'At least one field must be provided for update');
      }

      const result = await registryService.bulkUpdateRegistries(
        registryIds,
        updateData,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} registries`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get registry timeline
   */
  getRegistryTimeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      const timeline = await registryService.getRegistryTimeline(days);

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Verify registry document
   */
  verifyRegistryDocument: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { verificationStatus, verificationRemarks } = req.body;

      if (!verificationStatus) {
        throw new AppError(400, 'Verification status is required');
      }

      const verifiedRegistry = await registryService.verifyRegistryDocument(
        id,
        verificationStatus,
        verificationRemarks,
        req.user.userId
      );

      if (!verifiedRegistry) {
        throw new AppError(404, 'Registry not found');
      }

      res.json({
        success: true,
        data: verifiedRegistry,
        message: 'Registry document verification updated',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get pending verifications
   */
  getPendingVerifications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await registryService.getPendingVerifications(page, limit);

      res.json({
        success: true,
        data: {
          registries: result.registries,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
