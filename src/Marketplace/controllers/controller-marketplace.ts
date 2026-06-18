import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { marketplaceService } from '../services/service-marketplace';
import {
  CreateListingDto,
  ListingQueryParams,
  UpdateListingDto,
} from '../types/types-marketplace';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const marketplaceController = {
  createListing: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const data: CreateListingDto = req.body;
      const listing = await marketplaceService.createListing(data, req.user.userId);

      res.status(201).json({
        success: true,
        data: listing,
        message: 'Listing created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getListings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: ListingQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        societyId: req.query.societyId as string,
        category: req.query.category as string,
        listingType: req.query.listingType as string,
        condition: req.query.condition as string,
        status: req.query.status as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await marketplaceService.getListings(queryParams);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        message: 'Listings retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getListing: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const listing = await marketplaceService.getListingById(id);

      if (!listing) {
        throw new AppError(404, 'Listing not found');
      }

      // Increment view count asynchronously
      marketplaceService.incrementViewCount(id).catch(() => {});

      res.status(200).json({
        success: true,
        data: listing,
        message: 'Listing retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateListing: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const data: UpdateListingDto = req.body;
      const listing = await marketplaceService.updateListing(id, data, req.user.userId);

      if (!listing) {
        throw new AppError(404, 'Listing not found');
      }

      res.status(200).json({
        success: true,
        data: listing,
        message: 'Listing updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteListing: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const listing = await marketplaceService.deleteListing(id, req.user.userId);

      if (!listing) {
        throw new AppError(404, 'Listing not found');
      }

      res.status(200).json({
        success: true,
        data: listing,
        message: 'Listing deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  markAsSold: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const listing = await marketplaceService.markAsSold(id, req.user.userId);

      if (!listing) {
        throw new AppError(404, 'Listing not found');
      }

      res.status(200).json({
        success: true,
        data: listing,
        message: 'Listing marked as sold successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  toggleFavorite: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const listingId = req.params.id as string;
      const listing = await marketplaceService.toggleFavorite(listingId, req.user.userId);

      if (!listing) {
        throw new AppError(404, 'Listing not found');
      }

      res.status(200).json({
        success: true,
        data: listing,
        message: 'Favorite toggled successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMyListings: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await marketplaceService.getMyListings(req.user.userId.toString(), page, limit);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        message: 'My listings retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMyFavorites: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await marketplaceService.getMyFavorites(req.user.userId.toString(), page, limit);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        message: 'My favorites retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getPopularListings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const societyId = req.query.societyId as string;

      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const listings = await marketplaceService.getPopularListings(societyId, limit);

      res.status(200).json({
        success: true,
        data: listings,
        message: 'Popular listings retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getCategoryStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const societyId = req.query.societyId as string;

      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const stats = await marketplaceService.getCategoryStats(societyId);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Category statistics retrieved successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
