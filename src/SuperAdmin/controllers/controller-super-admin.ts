import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { TenantRequest } from '../../middleware/tenant.middleware';
import { AppError } from '../../middleware/error.middleware';
import * as superAdminService from '../services/service-super-admin';
import {
  createSocietySchema,
  updateSocietySchema,
  impersonateSchema,
  createSubscriptionPlanSchema,
  societyListQuerySchema,
  userListQuerySchema,
  auditLogQuerySchema,
} from '../validators/validator-super-admin';

function validateObjectId(id: string, label = 'ID'): void {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `Invalid ${label} format`);
  }
}

// ── Society CRUD ──

export async function createSociety(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const dto = createSocietySchema.parse(req.body);
    const result = await superAdminService.createSociety(dto, req.user!.userId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listSocieties(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const query = societyListQuerySchema.parse(req.query);
    const result = await superAdminService.listSocieties(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getSocietyDetail(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    validateObjectId(req.params.id as string, 'Society ID');
    const result = await superAdminService.getSocietyDetail(req.params.id as string);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateSociety(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    validateObjectId(req.params.id as string, 'Society ID');
    const dto = updateSocietySchema.parse(req.body) as any;
    const result = await superAdminService.updateSociety(req.params.id as string, dto, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteSociety(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    validateObjectId(req.params.id as string, 'Society ID');
    const result = await superAdminService.deleteSociety(req.params.id as string, req.user!.userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ── Global Users ──

export async function listAllUsers(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const query = userListQuerySchema.parse(req.query);
    const result = await superAdminService.listAllUsers(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// ── Analytics ──

export async function getPlatformStats(_req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const stats = await superAdminService.getPlatformStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getSocietiesHealth(_req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const health = await superAdminService.getSocietiesHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
}

// ── Impersonation ──

export async function impersonateUser(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const dto = impersonateSchema.parse(req.body);
    const result = await superAdminService.impersonateUser(dto, {
      userId: req.user!.userId,
      email: req.user!.email,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// ── Subscription Plans ──

export async function createSubscriptionPlan(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const dto = createSubscriptionPlanSchema.parse(req.body);
    const result = await superAdminService.createSubscriptionPlan(dto, req.user!.userId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listSubscriptionPlans(_req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const plans = await superAdminService.listSubscriptionPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
}

export async function updateSubscriptionPlan(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    validateObjectId(req.params.id as string, 'Plan ID');
    const dto = createSubscriptionPlanSchema.partial().parse(req.body);
    const result = await superAdminService.updateSubscriptionPlan(req.params.id as string, dto, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// ── Audit Logs ──

export async function getGlobalAuditLogs(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const query = auditLogQuerySchema.parse(req.query);
    const result = await superAdminService.getGlobalAuditLogs(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
