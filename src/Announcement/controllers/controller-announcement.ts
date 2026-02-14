import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { uploadService } from '../../imageUpload/services/upload.service';
import { EntityType } from '../../imageUpload/types/upload.types';
import { AppError } from '../../middleware/error.middleware';
import UserStaff from '../../UserPermissions/models/models-userstaff';
import { announcementService } from '../index-announcement';
import {
  AnnouncementFilterParams,
  AnnouncementQueryParams,
  CreateAnnouncementDto,
  PublishAnnouncementDto,
  UpdateAnnouncementDto,
} from '../types/types-announcement';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const announcementController = {
  /**
   * Create new announcement
   */
  createAnnouncement: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateAnnouncementDto = {
        ...req.body,
        // Auto-set authorId from authenticated user if not provided
        authorId: req.body.authorId || req.user.userId.toString(),
      };

      // Validate required fields
      if (!createData.title?.trim()) {
        throw new AppError(400, 'Title is required');
      }

      if (!createData.announcementDesc?.trim()) {
        throw new AppError(400, 'Description is required');
      }

      if (!createData.categoryId?.trim()) {
        throw new AppError(400, 'Category is required');
      }

      if (!createData.targetType?.trim()) {
        throw new AppError(400, 'Target type is required');
      }

      if (!createData.priorityLevel) {
        throw new AppError(400, 'Priority level is required');
      }

      // Validate dates
      if (createData.expiresAt && new Date(createData.expiresAt) <= new Date()) {
        throw new AppError(400, 'Expiry date must be in the future');
      }

      if (createData.attachmentURL && !createData.attachmentURL.includes('cloudinary.com')) {
        delete createData.attachmentURL;
      }

      const announcement = await announcementService.createAnnouncement(
        createData,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: announcement,
        message: 'Announcement created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get announcement by ID
   */
  getAnnouncement: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const announcement = await announcementService.getAnnouncementById(id);

      res.json({
        success: true,
        data: announcement,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get all announcements
   */
  getAnnouncements: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate priorityLevel
      let priorityLevel: 1 | 2 | 3 | undefined = undefined;
      if (req.query.priorityLevel) {
        const parsedPriority = parseInt(req.query.priorityLevel as string);
        if ([1, 2, 3].includes(parsedPriority)) {
          priorityLevel = parsedPriority as 1 | 2 | 3;
        } else {
          throw new AppError(400, 'Priority level must be 1 (Low), 2 (Medium), or 3 (High)');
        }
      }

      const queryParams: AnnouncementQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        authorId: req.query.authorId as string,
        targetType: req.query.targetType as 'All' | 'Block' | 'Project' | 'Individual',

        priorityLevel, // Use the validated value
        status: req.query.status as 'Draft' | 'Published' | 'Archived',
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        isPushNotificationSent: req.query.isPushNotificationSent
          ? req.query.isPushNotificationSent === 'true'
          : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await announcementService.getAnnouncements(queryParams);

      res.json({
        success: true,
        data: {
          announcements: result.announcements,
          summary: result.summary,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get active announcements for display
   */
  /**
   * Get active announcements for display
   */
  getActiveAnnouncements: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate priorityLevel
      let priorityLevel: 1 | 2 | 3 | undefined = undefined;
      if (req.query.priorityLevel) {
        const parsedPriority = parseInt(req.query.priorityLevel as string);
        // Validate that it's 1, 2, or 3
        if ([1, 2, 3].includes(parsedPriority)) {
          priorityLevel = parsedPriority as 1 | 2 | 3;
        } else {
          throw new AppError(400, 'Priority level must be 1 (Low), 2 (Medium), or 3 (High)');
        }
      }

      const filterParams: AnnouncementFilterParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        categoryId: req.query.categoryId as string,
        priorityLevel, // Use the validated value
        targetType: req.query.targetType as 'All' | 'Block' | 'Project' | 'Individual',

        includeExpired: req.query.includeExpired ? req.query.includeExpired === 'true' : false,
      };

      const result = await announcementService.getActiveAnnouncements(filterParams);

      res.json({
        success: true,
        data: {
          announcements: result.announcements,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update announcement
   */
  updateAnnouncement: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData: UpdateAnnouncementDto = req.body;

      // Validate dates if provided
      if (updateData.expiresAt && new Date(updateData.expiresAt) <= new Date()) {
        throw new AppError(400, 'Expiry date must be in the future');
      }

      if (updateData.attachmentURL !== undefined) {
        const existingAnnouncement = await announcementService.getAnnouncementById(id);
        if (!existingAnnouncement) {
          throw new AppError(404, 'Announcement not found');
        }

        if (updateData.attachmentURL === '') {
          if (existingAnnouncement.attachmentURL) {
            const files = await uploadService.getFilesByEntity(EntityType.ANNOUNCEMENT, id);
            if (files.length > 0) {
              await uploadService.deleteFromCloudinary(files[0].publicId);
            }
          }
        } else if (!updateData.attachmentURL.includes('cloudinary.com')) {
          delete updateData.attachmentURL;
        } else if (
          existingAnnouncement.attachmentURL &&
          updateData.attachmentURL !== existingAnnouncement.attachmentURL
        ) {
          const files = await uploadService.getFilesByEntity(EntityType.ANNOUNCEMENT, id);
          if (files.length > 0) {
            await uploadService.deleteFromCloudinary(files[0].publicId);
          }
        }
      }

      const updatedAnnouncement = await announcementService.updateAnnouncement(
        id,
        updateData,
        req.user.userId
      );

      if (!updatedAnnouncement) {
        throw new AppError(404, 'Announcement not found');
      }

      res.json({
        success: true,
        data: updatedAnnouncement,
        message: 'Announcement updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete announcement (soft delete)
   */
  deleteAnnouncement: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const existingAnnouncement = await announcementService.getAnnouncementById(id);
      if (!existingAnnouncement) {
        throw new AppError(404, 'Announcement not found');
      }

      if (existingAnnouncement.attachmentURL) {
        const files = await uploadService.getFilesByEntity(EntityType.ANNOUNCEMENT, id);
        if (files.length > 0) {
          await uploadService.deleteFromCloudinary(files[0].publicId);
        }
      }

      const deleted = await announcementService.deleteAnnouncement(id, req.user.userId);

      if (!deleted) {
        throw new AppError(404, 'Announcement not found');
      }

      res.json({
        success: true,
        message: 'Announcement deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Publish announcement
   */
  publishAnnouncement: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const publishData: PublishAnnouncementDto = req.body;

      const publishedAnnouncement = await announcementService.publishAnnouncement(
        id,
        publishData,
        req.user.userId
      );

      if (!publishedAnnouncement) {
        throw new AppError(404, 'Announcement not found');
      }

      res.json({
        success: true,
        data: publishedAnnouncement,
        message: 'Announcement published successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Archive announcement
   */
  archiveAnnouncement: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const archivedAnnouncement = await announcementService.archiveAnnouncement(
        id,
        req.user.userId
      );

      if (!archivedAnnouncement) {
        throw new AppError(404, 'Announcement not found');
      }

      res.json({
        success: true,
        data: archivedAnnouncement,
        message: 'Announcement archived successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get announcements by category
   */
  getAnnouncementsByCategory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = req.params.categoryId as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await announcementService.getAnnouncementsByCategory(categoryId, page, limit);

      res.json({
        success: true,
        data: result.announcements,
        total: result.total,
        pages: result.pages,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get announcements by author
   */
  getAnnouncementsByAuthor: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authorId = req.params.authorId as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await announcementService.getAnnouncementsByAuthor(authorId, page, limit);

      res.json({
        success: true,
        data: result.announcements,
        total: result.total,
        pages: result.pages,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get urgent announcements (High priority)
   */
  getUrgentAnnouncements: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      const announcements = await announcementService.getUrgentAnnouncements(limit);

      res.json({
        success: true,
        data: announcements,
        total: announcements.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get recent announcements
   */
  getRecentAnnouncements: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const announcements = await announcementService.getRecentAnnouncements(limit);

      res.json({
        success: true,
        data: announcements,
        total: announcements.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get announcement statistics
   */
  getAnnouncementStatistics: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await announcementService.getAnnouncementStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search announcements
   */
  searchAnnouncements: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchTerm = req.query.search as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!searchTerm?.trim()) {
        throw new AppError(400, 'Search term is required');
      }

      const announcements = await announcementService.searchAnnouncements(searchTerm, limit);

      res.json({
        success: true,
        data: announcements,
        total: announcements.length,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update announcement status
   */
  bulkUpdateAnnouncementStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const { announcementIds, status } = req.body;

      if (!announcementIds || !Array.isArray(announcementIds) || announcementIds.length === 0) {
        throw new AppError(400, 'Announcement IDs are required and must be a non-empty array');
      }

      if (!status || !['Draft', 'Published', 'Archived'].includes(status)) {
        throw new AppError(400, 'Valid status is required (Draft, Published, or Archived)');
      }

      const result = await announcementService.bulkUpdateAnnouncementStatus(
        announcementIds,
        status,
        req.user.userId
      );

      res.json({
        success: true,
        data: result,
        message: `Successfully updated ${result.modified} of ${result.matched} announcements`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Send push notification for announcement
   */
  sendPushNotification: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const result = await announcementService.sendPushNotification(id, req.user.userId);

      res.json({
        success: true,
        data: result,
        message: result.success
          ? 'Push notification sent successfully'
          : 'Failed to send push notification',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get expired announcements
   */
  getExpiredAnnouncements: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await announcementService.getExpiredAnnouncements(page, limit);

      res.json({
        success: true,
        data: {
          announcements: result.announcements,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Renew expired announcement
   */
  renewAnnouncement: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const { newExpiryDate } = req.body;

      if (!newExpiryDate || new Date(newExpiryDate) <= new Date()) {
        throw new AppError(400, 'Valid future expiry date is required');
      }

      const renewedAnnouncement = await announcementService.renewAnnouncement(
        id,
        newExpiryDate,
        req.user.userId
      );

      if (!renewedAnnouncement) {
        throw new AppError(404, 'Announcement not found');
      }

      res.json({
        success: true,
        data: renewedAnnouncement,
        message: 'Announcement renewed successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get announcement timeline
   */
  getAnnouncementTimeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      const timeline = await announcementService.getAnnouncementTimeline(days);

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get available authors (UserStaff)
   */
  getAvailableAuthors: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const authors = await UserStaff.find(
        {
          isActive: true,
          isDeleted: false,
        },
        {
          _id: 1,
          userName: 1,
          fullName: 1,
          designation: 1,
          email: 1,
        }
      )
        .sort({ fullName: 1 })
        .limit(100);

      res.json({
        success: true,
        data: authors,
        message: `Found ${authors.length} available authors`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
