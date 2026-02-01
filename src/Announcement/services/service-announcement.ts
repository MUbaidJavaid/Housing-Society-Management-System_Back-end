import { Types } from 'mongoose';
import UserStaff from '../../UserPermissions/models/models-userstaff';
import {
  ActiveAnnouncementsResult,
  AnnouncementFilterParams,
  AnnouncementQueryParams,
  AnnouncementStatistics,
  AnnouncementType,
  CreateAnnouncementDto,
  GetAnnouncementsResult,
  PublishAnnouncementDto,
  UpdateAnnouncementDto,
} from '../index-announcement';
import Announcement from '../models/models-announcement';
import AnnouncementCategory from '../models/models-announcementcategory';

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): AnnouncementType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;

  // Ensure timestamps are included
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }

  return plainObj as AnnouncementType;
};

export const announcementService = {
  /**
   * Create new announcement
   */
  async createAnnouncement(
    data: CreateAnnouncementDto,
    userId: Types.ObjectId
  ): Promise<AnnouncementType> {
    // Check if category exists
    const category = await AnnouncementCategory.findById(data.categoryId);
    if (!category || category.isDeleted || !category.isActive) {
      throw new Error('Category not found or inactive');
    }

    // Check if author exists
    const author = await UserStaff.findById(data.authorId);
    if (!author || author.isDeleted || !author.isActive) {
      throw new Error('Author not found or inactive');
    }

    // Validate target group if specified
    if (data.targetGroupId && data.targetType !== 'All') {
      // You would need to check if the target group exists based on targetType
      // This is a placeholder - implement based on your Block/Project models
      if (data.targetType === 'Block') {
        // Check if Block exists
        // const Block = require('../models/models-block').default;
        // const block = await Block.findById(data.targetGroupId);
        // if (!block || block.isDeleted) {
        //   throw new Error('Target block not found');
        // }
      } else if (data.targetType === 'Project') {
        // Check if Project exists
        // const Project = require('../models/models-project').default;
        // const project = await Project.findById(data.targetGroupId);
        // if (!project || project.isDeleted) {
        //   throw new Error('Target project not found');
        // }
      } else if (data.targetType === 'Individual') {
        // Check if User exists
        const individual = await UserStaff.findById(data.targetGroupId);
        if (!individual || individual.isDeleted || !individual.isActive) {
          throw new Error('Target individual not found or inactive');
        }
      }
    }

    const announcementData = {
      ...data,
      createdBy: userId,
      updatedBy: userId,
    };

    const announcement = await Announcement.create(announcementData);

    // Populate and return the created announcement
    const createdAnnouncement = await Announcement.findById(announcement._id)
      .populate('author', 'userName fullName designation')
      .populate('category', 'categoryName icon color')
      .populate('createdBy', 'userName fullName')
      .populate('updatedBy', 'userName fullName');

    if (!createdAnnouncement) {
      throw new Error('Failed to create announcement');
    }

    return toPlainObject(createdAnnouncement);
  },

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(id: string): Promise<AnnouncementType> {
    try {
      const announcement = await Announcement.findById(id)
        .populate('author', 'userName fullName designation email')
        .populate('category', 'categoryName description icon color')
        .populate('createdBy', 'userName fullName')
        .populate('updatedBy', 'userName fullName');

      if (!announcement || announcement.isDeleted) {
        throw new Error('Announcement not found');
      }

      return toPlainObject(announcement);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid announcement ID');
    }
  },

  /**
   * Find announcement by ID (returns null if not found)
   */
  async findAnnouncementById(id: string): Promise<AnnouncementType | null> {
    try {
      const announcement = await Announcement.findById(id);

      if (!announcement || announcement.isDeleted) return null;
      return toPlainObject(announcement);
    } catch (error) {
      return null;
    }
  },

  /**
   * Get all announcements with pagination
   */
  async getAnnouncements(params: AnnouncementQueryParams): Promise<GetAnnouncementsResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      categoryId,
      authorId,
      targetType,
      targetGroupId,
      priorityLevel,
      status,
      isActive,
      isPushNotificationSent,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Build query
    const query: any = { isDeleted: false };

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by category
    if (categoryId) {
      query.categoryId = new Types.ObjectId(categoryId);
    }

    // Filter by author
    if (authorId) {
      query.authorId = new Types.ObjectId(authorId);
    }

    // Filter by target type
    if (targetType) {
      query.targetType = targetType;
    }

    // Filter by target group
    if (targetGroupId) {
      query.targetGroupId = new Types.ObjectId(targetGroupId);
    }

    // Filter by priority level
    if (priorityLevel) {
      query.priorityLevel = priorityLevel;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Filter by push notification sent
    if (isPushNotificationSent !== undefined) {
      query.isPushNotificationSent = isPushNotificationSent;
    }

    // Execute queries
    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate('author', 'userName fullName designation')
        .populate('category', 'categoryName icon color')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Announcement.countDocuments(query),
    ]);

    // Calculate summary statistics
    const summary = {
      totalAnnouncements: announcements.length,
      draftAnnouncements: announcements.filter(ann => ann.status === 'Draft').length,
      publishedAnnouncements: announcements.filter(ann => ann.status === 'Published').length,
      archivedAnnouncements: announcements.filter(ann => ann.status === 'Archived').length,
      activeAnnouncements: announcements.filter(ann => ann.isActive).length,
      expiredAnnouncements: announcements.filter(ann => {
        if (!ann.expiresAt) return false;
        return new Date() > ann.expiresAt;
      }).length,
      byPriority: {
        low: announcements.filter(ann => ann.priorityLevel === 1).length,
        medium: announcements.filter(ann => ann.priorityLevel === 2).length,
        high: announcements.filter(ann => ann.priorityLevel === 3).length,
      },
      byTargetType: {} as Record<string, number>,
    };

    // Count by target type
    announcements.forEach(announcement => {
      summary.byTargetType[announcement.targetType] =
        (summary.byTargetType[announcement.targetType] || 0) + 1;
    });

    return {
      announcements,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get active announcements for display
   */
  async getActiveAnnouncements(
    params: AnnouncementFilterParams
  ): Promise<ActiveAnnouncementsResult> {
    const {
      page = 1,
      limit = 10,
      categoryId,
      priorityLevel,
      targetType,
      targetGroupId,
      includeExpired = false,
    } = params;

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      status: 'Published',
      isActive: true,
      isDeleted: false,
    };

    // Filter by category
    if (categoryId) {
      query.categoryId = new Types.ObjectId(categoryId);
    }

    // Filter by priority level
    if (priorityLevel) {
      query.priorityLevel = priorityLevel;
    }

    // Filter by target type
    if (targetType) {
      query.targetType = targetType;
    }

    // Filter by target group
    if (targetGroupId) {
      query.targetGroupId = new Types.ObjectId(targetGroupId);
    } else if (targetType === 'All') {
      // For 'All' target type, we want announcements that are for everyone
      query.targetType = 'All';
    }

    // Filter by expiry
    if (!includeExpired) {
      query.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
    }

    // Execute queries
    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate('author', 'userName fullName designation')
        .populate('category', 'categoryName icon color')
        .sort({ priorityLevel: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Announcement.countDocuments(query),
    ]);

    return {
      announcements,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Update announcement
   */
  async updateAnnouncement(
    id: string,
    data: UpdateAnnouncementDto,
    userId: Types.ObjectId
  ): Promise<AnnouncementType | null> {
    // Check if announcement exists
    const existingAnnouncement = await Announcement.findById(id);
    if (!existingAnnouncement || existingAnnouncement.isDeleted) {
      throw new Error('Announcement not found');
    }

    // Check if category exists (if being updated)
    if (data.categoryId) {
      const category = await AnnouncementCategory.findById(data.categoryId);
      if (!category || category.isDeleted || !category.isActive) {
        throw new Error('Category not found or inactive');
      }
    }

    // Check if author exists (if being updated)
    if (data.authorId) {
      const author = await UserStaff.findById(data.authorId);
      if (!author || author.isDeleted || !author.isActive) {
        throw new Error('Author not found or inactive');
      }
    }

    const updateObj: any = {
      ...data,
      updatedBy: userId,
    };

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      {
        $set: updateObj,
      },
      { new: true, runValidators: true }
    )
      .populate('author', 'userName fullName designation')
      .populate('category', 'categoryName icon color')
      .populate('createdBy', 'userName fullName')
      .populate('updatedBy', 'userName fullName');

    return announcement ? toPlainObject(announcement) : null;
  },

  /**
   * Delete announcement (soft delete)
   */
  async deleteAnnouncement(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existingAnnouncement = await Announcement.findById(id);
    if (!existingAnnouncement || existingAnnouncement.isDeleted) {
      throw new Error('Announcement not found');
    }

    const result = await Announcement.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          updatedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Publish announcement
   */
  async publishAnnouncement(
    id: string,
    data: PublishAnnouncementDto,
    userId: Types.ObjectId
  ): Promise<AnnouncementType | null> {
    const announcement = await Announcement.findById(id);

    if (!announcement || announcement.isDeleted) {
      throw new Error('Announcement not found');
    }

    if (announcement.status === 'Published') {
      throw new Error('Announcement is already published');
    }

    const updateData: any = {
      status: 'Published',
      updatedBy: userId,
    };

    // Set expiry date if provided
    if (data.expiresAt) {
      if (new Date(data.expiresAt) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      updateData.expiresAt = data.expiresAt;
    }

    // Set published at if not already set
    if (!announcement.publishedAt) {
      updateData.publishedAt = new Date();
    }

    // Set push notification flag
    if (data.sendPushNotification) {
      updateData.isPushNotificationSent = true;
      // Here you would trigger the actual push notification
      // await this.sendPushNotificationToUsers(announcement);
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      { new: true }
    )
      .populate('author', 'userName fullName designation')
      .populate('category', 'categoryName icon color');

    return updatedAnnouncement ? toPlainObject(updatedAnnouncement) : null;
  },

  /**
   * Archive announcement
   */
  async archiveAnnouncement(id: string, userId: Types.ObjectId): Promise<AnnouncementType | null> {
    const announcement = await Announcement.findById(id);

    if (!announcement || announcement.isDeleted) {
      throw new Error('Announcement not found');
    }

    if (announcement.status === 'Archived') {
      throw new Error('Announcement is already archived');
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'Archived',
          isActive: false,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('author', 'userName fullName designation')
      .populate('category', 'categoryName icon color');

    return updatedAnnouncement ? toPlainObject(updatedAnnouncement) : null;
  },

  /**
   * Get announcements by category
   */
  async getAnnouncementsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ announcements: AnnouncementType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const query = {
      categoryId: new Types.ObjectId(categoryId),
      status: 'Published',
      isActive: true,
      isDeleted: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    };

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate('author', 'userName fullName designation')
        .populate('category', 'categoryName icon color')
        .sort({ priorityLevel: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Announcement.countDocuments(query),
    ]);

    return {
      announcements,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get announcements by author
   */
  async getAnnouncementsByAuthor(
    authorId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ announcements: AnnouncementType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const query = {
      authorId: new Types.ObjectId(authorId),
      isDeleted: false,
    };

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate('author', 'userName fullName designation')
        .populate('category', 'categoryName icon color')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Announcement.countDocuments(query),
    ]);

    return {
      announcements,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get urgent announcements (High priority)
   */
  async getUrgentAnnouncements(limit: number = 5): Promise<AnnouncementType[]> {
    const query = {
      status: 'Published',
      isActive: true,
      isDeleted: false,
      priorityLevel: 3, // High priority
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    };

    const announcements = await Announcement.find(query)
      .populate('author', 'userName fullName')
      .populate('category', 'categoryName color')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return announcements;
  },

  /**
   * Get recent announcements
   */
  async getRecentAnnouncements(limit: number = 10): Promise<AnnouncementType[]> {
    const query = {
      status: 'Published',
      isActive: true,
      isDeleted: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    };

    const announcements = await Announcement.find(query)
      .populate('author', 'userName fullName designation')
      .populate('category', 'categoryName icon color')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return announcements;
  },

  /**
   * Search announcements
   */
  async searchAnnouncements(searchTerm: string, limit: number = 10): Promise<AnnouncementType[]> {
    const announcements = await Announcement.find(
      {
        $text: { $search: searchTerm },
        status: 'Published',
        isActive: true,
        isDeleted: false,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      },
      { score: { $meta: 'textScore' } }
    )
      .populate('author', 'userName fullName designation')
      .populate('category', 'categoryName icon color')
      .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
      .limit(limit)
      .then(docs => docs.map(doc => toPlainObject(doc)));

    return announcements;
  },

  /**
   * Bulk update announcement status
   */
  async bulkUpdateAnnouncementStatus(
    announcementIds: string[],
    status: 'Draft' | 'Published' | 'Archived',
    userId: Types.ObjectId
  ): Promise<{ matched: number; modified: number }> {
    if (!announcementIds || !Array.isArray(announcementIds) || announcementIds.length === 0) {
      throw new Error('Announcement IDs must be a non-empty array');
    }

    const objectIds = announcementIds.map(id => {
      try {
        return new Types.ObjectId(id);
      } catch (error) {
        throw new Error(`Invalid announcement ID: ${id}`);
      }
    });

    const updateData: any = {
      status,
      updatedBy: userId,
    };

    // Set publishedAt if status is changing to Published
    if (status === 'Published') {
      updateData.publishedAt = new Date();
      updateData.isActive = true;
    } else if (status === 'Archived') {
      updateData.isActive = false;
    }

    const result = await Announcement.updateMany(
      {
        _id: { $in: objectIds },
        isDeleted: false,
      },
      {
        $set: updateData,
      }
    );

    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
  },

  /**
   * Send push notification for announcement
   */
  async sendPushNotification(
    id: string,
    userId: Types.ObjectId
  ): Promise<{ success: boolean; message: string }> {
    const announcement = await Announcement.findById(id);

    if (!announcement || announcement.isDeleted) {
      throw new Error('Announcement not found');
    }

    if (announcement.status !== 'Published') {
      throw new Error('Only published announcements can send push notifications');
    }

    if (announcement.isPushNotificationSent) {
      throw new Error('Push notification already sent for this announcement');
    }

    try {
      // Here you would integrate with your push notification service
      // This is a placeholder implementation

      // Example: Send to Firebase Cloud Messaging or similar
      // const pushResult = await pushNotificationService.send({
      //   title: announcement.title,
      //   body: announcement.shortDescription || announcement.announcementDesc.substring(0, 100),
      //   data: { announcementId: announcement._id.toString() },
      //   topic: 'announcements',
      // });

      // Update announcement with push notification status
      await Announcement.findByIdAndUpdate(id, {
        $set: {
          isPushNotificationSent: true,
          updatedBy: userId,
        },
      });

      return {
        success: true,
        message: 'Push notification sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send push notification: ${error.message}`,
      };
    }
  },

  /**
   * Get announcement statistics
   */
  async getAnnouncementStatistics(): Promise<AnnouncementStatistics> {
    const stats = await Announcement.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: null,
          totalAnnouncements: { $sum: 1 },
          draftAnnouncements: {
            $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] },
          },
          publishedAnnouncements: {
            $sum: { $cond: [{ $eq: ['$status', 'Published'] }, 1, 0] },
          },
          archivedAnnouncements: {
            $sum: { $cond: [{ $eq: ['$status', 'Archived'] }, 1, 0] },
          },
          activeAnnouncements: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          totalViews: { $sum: '$views' },
          announcementsWithAttachments: {
            $sum: { $cond: [{ $ifNull: ['$attachmentURL', false] }, 1, 0] },
          },
          announcementsWithPushNotifications: {
            $sum: { $cond: [{ $eq: ['$isPushNotificationSent', true] }, 1, 0] },
          },
        },
      },
    ]);

    const categoryStats = await Announcement.aggregate([
      {
        $match: { isDeleted: false, status: 'Published' },
      },
      {
        $lookup: {
          from: 'announcementcategories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.categoryName',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const priorityStats = await Announcement.aggregate([
      {
        $match: { isDeleted: false, status: 'Published' },
      },
      {
        $group: {
          _id: '$priorityLevel',
          count: { $sum: 1 },
        },
      },
    ]);

    const targetTypeStats = await Announcement.aggregate([
      {
        $match: { isDeleted: false, status: 'Published' },
      },
      {
        $group: {
          _id: '$targetType',
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyStats = await Announcement.aggregate([
      {
        $match: { isDeleted: false, status: 'Published' },
      },
      {
        $group: {
          _id: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' },
          },
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $limit: 12,
      },
    ]);

    const authorStats = await Announcement.aggregate([
      {
        $match: { isDeleted: false, status: 'Published' },
      },
      {
        $lookup: {
          from: 'userstaffs',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: '$author' },
      {
        $group: {
          _id: '$author.fullName',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const baseStats = stats[0] || {
      totalAnnouncements: 0,
      draftAnnouncements: 0,
      publishedAnnouncements: 0,
      archivedAnnouncements: 0,
      activeAnnouncements: 0,
      totalViews: 0,
      announcementsWithAttachments: 0,
      announcementsWithPushNotifications: 0,
    };

    const byCategory: Record<string, number> = {};
    categoryStats.forEach(stat => {
      byCategory[stat._id] = stat.count;
    });

    const byPriority: Record<string, number> = {};
    priorityStats.forEach(stat => {
      const priorityLabel = stat._id === 1 ? 'Low' : stat._id === 2 ? 'Medium' : 'High';
      byPriority[priorityLabel] = stat.count;
    });

    const byTargetType: Record<string, number> = {};
    targetTypeStats.forEach(stat => {
      byTargetType[stat._id] = stat.count;
    });

    const byAuthor: Record<string, number> = {};
    authorStats.forEach(stat => {
      byAuthor[stat._id] = stat.count;
    });

    const monthlyGrowth = monthlyStats.map(stat => ({
      month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
      count: stat.count,
      views: stat.totalViews,
    }));

    return {
      ...baseStats,
      expiredAnnouncements: baseStats.publishedAnnouncements - baseStats.activeAnnouncements,
      averageViewsPerAnnouncement:
        baseStats.publishedAnnouncements > 0
          ? Math.round(baseStats.totalViews / baseStats.publishedAnnouncements)
          : 0,
      byCategory,
      byPriority,
      byTargetType,
      byAuthor,
      monthlyGrowth,
    };
  },

  /**
   * Get expired announcements
   */
  async getExpiredAnnouncements(
    page: number = 1,
    limit: number = 20
  ): Promise<{ announcements: AnnouncementType[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const query = {
      status: 'Published',
      isDeleted: false,
      expiresAt: { $lt: new Date() },
    };

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate('author', 'userName fullName designation')
        .populate('category', 'categoryName icon color')
        .sort({ expiresAt: -1 })
        .skip(skip)
        .limit(limit)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Announcement.countDocuments(query),
    ]);

    return {
      announcements,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Renew expired announcement
   */
  async renewAnnouncement(
    id: string,
    newExpiryDate: Date,
    userId: Types.ObjectId
  ): Promise<AnnouncementType | null> {
    const announcement = await Announcement.findById(id);

    if (!announcement || announcement.isDeleted) {
      throw new Error('Announcement not found');
    }

    if (announcement.status !== 'Published') {
      throw new Error('Only published announcements can be renewed');
    }

    if (new Date(newExpiryDate) <= new Date()) {
      throw new Error('New expiry date must be in the future');
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      {
        $set: {
          expiresAt: newExpiryDate,
          isActive: true,
          updatedBy: userId,
        },
      },
      { new: true }
    )
      .populate('author', 'userName fullName designation')
      .populate('category', 'categoryName icon color');

    return updatedAnnouncement ? toPlainObject(updatedAnnouncement) : null;
  },

  /**
   * Get announcement timeline
   */
  async getAnnouncementTimeline(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeline = await Announcement.aggregate([
      {
        $match: {
          status: 'Published',
          isDeleted: false,
          publishedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' },
            day: { $dayOfMonth: '$publishedAt' },
          },
          count: { $sum: 1 },
          announcements: {
            $push: {
              id: '$_id',
              title: '$title',
              priorityLevel: '$priorityLevel',
              categoryId: '$categoryId',
              publishedAt: '$publishedAt',
            },
          },
        },
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
            },
          },
          count: 1,
          announcements: { $slice: ['$announcements', 5] }, // Limit to 5 per day
        },
      },
    ]);

    // Populate category for each announcement
    for (const day of timeline) {
      for (const announcement of day.announcements) {
        const category = await AnnouncementCategory.findById(announcement.categoryId);
        if (category) {
          announcement.category = {
            name: category.categoryName,
            color: category.color,
          };
        }
      }
    }

    return timeline;
  },

  /**
   * Increment announcement views
   */
  async incrementAnnouncementViews(id: string): Promise<AnnouncementType | null> {
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      {
        $inc: { views: 1 },
      },
      { new: true }
    );

    return announcement ? toPlainObject(announcement) : null;
  },
};
