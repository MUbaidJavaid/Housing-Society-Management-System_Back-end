import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../../auth/types';
import { AuditAction, EntityType } from '../models/models-auditLog';
import { auditLogService } from '../services/service';

const getParamId = (req: Request) =>
  Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

export const auditMiddleware = {
  logCreate: (entityType: EntityType, getDescription?: (req: Request, res: Response) => string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      const originalSend = res.json;

      res.json = function (body) {
        if (req.user && body?.success && body?.data) {
          const description = getDescription ? getDescription(req, res) : `${entityType} created`;

          auditLogService.logActivity(
            req.user.userId,
            AuditAction.CREATE,
            entityType,
            description,
            {
              entityId: body.data._id || body.data.id,
              ipAddress: req.ip,
              userAgent: req.get('user-agent') as string,
              newValues: body.data,
              metadata: {
                endpoint: req.originalUrl,
                method: req.method,
              },
            }
          );
        }

        return originalSend.call(this, body);
      };

      next();
    };
  },

  logUpdate: (entityType: EntityType, getDescription?: (req: Request, res: Response) => string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      const originalSend = res.json;
      const oldData = req.oldData;

      res.json = function (body) {
        if (req.user && body?.success && body?.data) {
          const description = getDescription ? getDescription(req, res) : `${entityType} updated`;

          const changes: Record<string, { old: any; new: any }> = {};
          if (oldData && body.data) {
            Object.keys(body.data).forEach(key => {
              if (JSON.stringify(oldData[key]) !== JSON.stringify(body.data[key])) {
                changes[key] = { old: oldData[key], new: body.data[key] };
              }
            });
          }

          auditLogService.logActivity(
            req.user.userId,
            AuditAction.UPDATE,
            entityType,
            description,
            {
              entityId: getParamId(req),
              ipAddress: req.ip,
              userAgent: req.get('user-agent') as string,
              oldValues: oldData,
              newValues: body.data,
              changes: Object.keys(changes).length > 0 ? changes : undefined,
              metadata: {
                endpoint: req.originalUrl,
                method: req.method,
              },
            }
          );
        }

        return originalSend.call(this, body);
      };

      next();
    };
  },

  logDelete: (entityType: EntityType, getDescription?: (req: Request, res: Response) => string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      const originalSend = res.json;
      const oldData = req.oldData;

      res.json = function (body) {
        if (req.user && body?.success) {
          const description = getDescription ? getDescription(req, res) : `${entityType} deleted`;

          auditLogService.logActivity(
            req.user.userId,
            AuditAction.DELETE,
            entityType,
            description,
            {
              entityId: getParamId(req),
              ipAddress: req.ip,
              userAgent: req.get('user-agent') as string,
              oldValues: oldData,
              metadata: {
                endpoint: req.originalUrl,
                method: req.method,
              },
            }
          );
        }

        return originalSend.call(this, body);
      };

      next();
    };
  },

  logView: (entityType: EntityType, getDescription?: (req: Request, res: Response) => string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      if (req.user) {
        const description = getDescription ? getDescription(req, res) : `${entityType} viewed`;

        auditLogService.logActivity(req.user.userId, AuditAction.VIEW, entityType, description, {
          entityId: getParamId(req),
          ipAddress: req.ip,
          userAgent: req.get('user-agent') as string,
          metadata: {
            endpoint: req.originalUrl,
            method: req.method,
          },
        });
      }

      next();
    };
  },

  logLogin: async (userId: Types.ObjectId, ipAddress: string, userAgent?: string) => {
    await auditLogService.logActivity(
      userId,
      AuditAction.LOGIN,
      EntityType.USER,
      'User logged in',
      {
        ipAddress,
        userAgent,
        metadata: { timestamp: new Date().toISOString() },
      }
    );
  },

  logLogout: async (userId: Types.ObjectId, ipAddress: string, userAgent?: string) => {
    await auditLogService.logActivity(
      userId,
      AuditAction.LOGOUT,
      EntityType.USER,
      'User logged out',
      {
        ipAddress,
        userAgent,
        metadata: { timestamp: new Date().toISOString() },
      }
    );
  },
};
