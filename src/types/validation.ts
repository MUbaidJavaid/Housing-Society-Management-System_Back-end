import { z } from 'zod';

// User validation schemas
export const userCreateSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address')
      .min(5, 'Email must be at least 5 characters')
      .max(255, 'Email must be less than 255 characters')
      .toLowerCase()
      .trim(),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .regex(
        /^[a-zA-Z\s-']+$/,
        'First name can only contain letters, spaces, hyphens, and apostrophes'
      ),

    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters')
      .regex(
        /^[a-zA-Z\s-']+$/,
        'Last name can only contain letters, spaces, hyphens, and apostrophes'
      ),

    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional()
      .or(z.literal('')),

    role: z.enum(['user', 'admin', 'moderator']).default('user'),
  })
  .strict();

export const userUpdateSchema = userCreateSchema
  .partial()
  .omit({ password: true })
  .extend({
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
    emailVerified: z.boolean().optional(),
  });

export const userLoginSchema = z
  .object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),

    password: z.string().min(1, 'Password is required'),

    rememberMe: z.boolean().optional().default(false),
  })
  .strict();

// Auth validation schemas
export const authRegisterSchema = userCreateSchema;
export const authLoginSchema = userLoginSchema;

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'New password must be less than 100 characters')
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'New password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'New password must contain at least one special character'),
  })
  .strict()
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const forgotPasswordSchema = z
  .object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'New password must be less than 100 characters')
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'New password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'New password must contain at least one special character'),
  })
  .strict();

// File validation schemas
export const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z
    .number()
    .positive()
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  buffer: z.instanceof(Buffer),
});

export const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Query parameter validation schemas
export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    filter: z.string().optional(),
  })
  .strict();

export const idParamSchema = z
  .object({
    id: z.string().refine(
      val => {
        const mongoose = require('mongoose');
        return mongoose.Types.ObjectId.isValid(val);
      },
      {
        message: 'Invalid ID format',
      }
    ),
  })
  .strict();

// Search validation schema
export const searchQuerySchema = z
  .object({
    q: z.string().min(1, 'Search query is required').max(255, 'Search query is too long'),
    fields: z.string().optional(),
    exact: z.coerce.boolean().default(false),
  })
  .strict();

// Export inferred types
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
export type AuthLoginInput = z.infer<typeof authLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
