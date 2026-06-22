import { z } from 'zod';

export const createSocietySchema = z.object({
  societyName: z.string().min(3).max(200),
  societyCode: z.string().min(3).max(20).optional(),
  address: z.string().min(1),
  cityId: z.string().optional(),
  stateId: z.string().optional(),
  country: z.string().default('Pakistan'),
  zipCode: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(8),
  website: z.string().url().optional(),
  subscriptionPlanId: z.string().min(1, 'Subscription plan is required'),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  // Admin for the society
  adminEmail: z.string().email(),
  adminFirstName: z.string().min(2).max(50),
  adminLastName: z.string().min(1).max(50),
  adminPhone: z.string().optional(),
  adminPassword: z.string().min(8).optional(),
});

export const updateSocietySchema = z.object({
  societyName: z.string().min(3).max(200).optional(),
  address: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(8).optional(),
  website: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  subscriptionPlanId: z.string().optional(),
  subscriptionStatus: z.enum(['trial', 'active', 'expired', 'suspended']).optional(),
  subscriptionEndDate: z.string().datetime().optional(),
  maxMembers: z.number().int().positive().optional(),
  maxProjects: z.number().int().positive().optional(),
  maxStaff: z.number().int().positive().optional(),
  enabledModules: z.array(z.string().max(50)).max(50).optional(),
});

export const impersonateSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const createSubscriptionPlanSchema = z.object({
  packageName: z.string().min(2).max(100),
  packageCode: z.string().min(2).max(50),
  description: z.string().max(1000).default(''),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  currency: z.string().default('PKR'),
  features: z.object({
    maxMembers: z.number().int().min(0).default(50),
    maxProjects: z.number().int().min(0).default(1),
    maxStaff: z.number().int().min(0).default(5),
    maxPlots: z.number().int().min(0).default(100),
    modules: z.array(z.string()).default([
      'members', 'plots', 'projects', 'installments', 'complaints', 'announcements',
    ]),
    storageGB: z.number().min(0).default(1),
    supportLevel: z.enum(['email', 'priority', 'dedicated']).default('email'),
    customBranding: z.boolean().default(false),
    apiAccess: z.boolean().default(false),
    visitorManagement: z.boolean().default(false),
    facilityBooking: z.boolean().default(false),
    advancedReporting: z.boolean().default(false),
  }),
  isPopular: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const societyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['trial', 'active', 'expired', 'suspended']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'societyName', 'societyCode', 'subscriptionStatus']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['user', 'admin', 'moderator', 'super_admin', 'accountant', 'member']).optional(),
  societyId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending', 'banned']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'role', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().max(50).optional(),
  societyId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
});
