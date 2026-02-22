import { Request, Response } from 'express';
import User from '../../database/models/User';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../types';

// Utility functions
const handleError = (error: any, next: Function) => {
  next(error);
};

const checkAdminPermission = (user: any) => {
  if (!user || user.role !== 'admin') {
    throw new AppError(403, 'Insufficient permissions');
  }
};

// const checkOwnership = (userId: string, resourceId: string) => {
//   if (userId !== resourceId) {
//     throw new AppError(403, 'You can only access your own resources');
//   }
// };

/**
 * Get VAPID public key for web push subscription (no auth required - public key is safe to expose)
 */
export const getVapidPublicKey = (_req: Request, res: Response) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({
      success: false,
      message: 'Push notifications not configured',
    });
  }
  return res.json({ success: true, data: { publicKey: key } });
};

// User controller functions
export const userController = {
  /**
   * Get all users (admin only)
   */
  getUsers: async (req: AuthRequest, res: Response, next: Function) => {
    try {
      checkAdminPermission(req.user);

      const { page = 1, limit = 10, search = '' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build query
      const query: any = {};
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ];
      }

      // Execute parallel queries for better performance
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 })
          .lean(),
        User.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          users: users.map(user => ({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Create a new user (admin only)
   */
  createUser: async (req: AuthRequest, res: Response, next: Function) => {
    try {
      checkAdminPermission(req.user);

      const { email, password, firstName, lastName, role = 'user' } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        throw new AppError(400, 'Missing required fields');
      }

      // Check for existing user
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new AppError(409, 'User already exists');
      }

      // Create user
      const user = await User.create({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        role,
        status: 'active',
        emailVerified: true,
      });

      // Remove password from response
      const userResponse = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'User created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (req: AuthRequest, res: Response, next: Function) => {
    try {
      const id = req.params.id as string;

      // Check permissions
      if (req.user?.role !== 'admin' && req.user?.userId.toString() !== id) {
        throw new AppError(403, 'You can only view your own profile');
      }

      const user = await User.findById(id).select('-password').lean();

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update user
   */
  updateUser: async (req: AuthRequest, res: Response, next: Function) => {
    try {
      const id = req.params.id as string;
      const updateData = req.body;

      // Check permissions
      if (req.user?.role !== 'admin' && req.user?.userId.toString() !== id) {
        throw new AppError(403, 'You can only update your own profile');
      }

      // Regular users cannot change their role
      if (req.user?.role !== 'admin' && updateData.role) {
        throw new AppError(403, 'You cannot change your role');
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .select('-password')
        .lean();

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        message: 'User updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Delete user (soft delete)
   */
  deleteUser: async (req: AuthRequest, res: Response, next: Function) => {
    try {
      const id = req.params.id as string;

      // Check permissions
      if (req.user?.role !== 'admin' && req.user?.userId.toString() !== id) {
        throw new AppError(403, 'You can only delete your own account');
      }

      // Soft delete
      const user = await User.findByIdAndUpdate(
        id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          status: 'inactive',
        },
        { new: true }
      )
        .select('-password')
        .lean();

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async (req: AuthRequest, res: Response, next: Function) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const user = await User.findById(req.user.userId).select('-password').lean();

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar || '',
          phone: user.phone || '',
          address: (user as any).address || '',
          bio: (user as any).bio || '',
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          preferences: user.preferences || {
            theme: 'auto',
            language: 'en',
            notifications: { email: true, push: true, sms: false, inApp: true },
            privacy: { profileVisibility: 'public', showEmail: false, showPhone: false },
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Update current user profile
   */
  updateProfile: async (req: AuthRequest, res: Response, next: Function) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const updateData = { ...req.body };

      // Users cannot change their role
      delete updateData.role;

      // Allowed profile fields
      const allowed = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'avatar',
        'address',
        'bio',
        'preferences',
      ];
      const filtered: Record<string, any> = {};
      for (const k of allowed) {
        if (updateData[k] !== undefined) filtered[k] = updateData[k];
      }

      // Push subscription: add to subscriptions array (for VAPID web-push)
      let pushSubToAdd: any = null;
      if (updateData.pushSubscription && typeof updateData.pushSubscription === 'object') {
        const sub = updateData.pushSubscription;
        if (sub.endpoint && sub.keys?.p256dh && sub.keys?.auth) {
          pushSubToAdd = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
            userAgent: sub.userAgent || req.get('user-agent'),
            createdAt: new Date(),
          };
        }
      }

      // If changing email, require verification
      if (filtered.email && filtered.email !== req.user.email) {
        filtered.email = filtered.email.toLowerCase();
        filtered.emailVerified = false;
      }

      const updateOp: Record<string, any> = { $set: filtered };
      if (pushSubToAdd) {
        updateOp.$push = { pushSubscriptions: pushSubToAdd };
      }
      const user = await User.findByIdAndUpdate(req.user.userId, updateOp, {
        new: true,
        runValidators: true,
      })
        .select('-password -pushSubscriptions')
        .lean();

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: (user as any).avatar || '',
          phone: (user as any).phone || '',
          address: (user as any).address || '',
          bio: (user as any).bio || '',
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          preferences: (user as any).preferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        message: 'Profile updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Search users with filters
   */
  searchUsers: async (req: AuthRequest, res: Response, next: Function) => {
    try {
      checkAdminPermission(req.user);

      const { query = '', role, status, emailVerified, page = 1, limit = 20 } = req.query;

      const filter: any = {};

      // Text search
      if (query) {
        filter.$or = [
          { email: { $regex: query, $options: 'i' } },
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
        ];
      }

      // Role filter
      if (role) {
        filter.role = role;
      }

      // Status filter
      if (status) {
        filter.status = status;
      }

      // Email verification filter
      if (emailVerified !== undefined) {
        filter.emailVerified = emailVerified === 'true';
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password')
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 })
          .lean(),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          users: users.map(user => ({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Bulk update user status
   */
  bulkUpdateStatus: async (req: AuthRequest, res: Response, next: Function) => {
    try {
      checkAdminPermission(req.user);

      const { userIds, status } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError(400, 'User IDs array is required');
      }

      if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
        throw new AppError(400, 'Invalid status value');
      }

      const result = await User.updateMany(
        {
          _id: { $in: userIds },
        },
        {
          $set: { status, updatedAt: new Date() },
        }
      );

      res.json({
        success: true,
        data: {
          matched: result.matchedCount,
          modified: result.modifiedCount,
        },
        message: 'User status updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  /**
   * Get user statistics
   */
  getUserStats: async (req: AuthRequest, res: Response, next: Function) => {
    try {
      checkAdminPermission(req.user);

      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            inactive: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
            },
            verified: {
              $sum: { $cond: [{ $eq: ['$emailVerified', true] }, 1, 0] },
            },
            byRole: { $push: '$role' },
          },
        },
        {
          $project: {
            total: 1,
            active: 1,
            pending: 1,
            inactive: 1,
            verified: 1,
            unverified: { $subtract: ['$total', '$verified'] },
            roleDistribution: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: '$byRole' },
                  as: 'role',
                  in: {
                    k: '$$role',
                    v: {
                      $size: {
                        $filter: {
                          input: '$byRole',
                          as: 'r',
                          cond: { $eq: ['$$r', '$$role'] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);

      res.json({
        success: true,
        data: stats[0] || {
          total: 0,
          active: 0,
          pending: 0,
          inactive: 0,
          verified: 0,
          unverified: 0,
          roleDistribution: {},
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
