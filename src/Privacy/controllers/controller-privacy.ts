import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import { AppError } from '../../middleware/error.middleware';
import { privacyService } from '../services/service-privacy';
import { PrivacyAccessLogQueryParams, UpdatePrivacySettingsDto } from '../types/types-privacy';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const privacyController = {
  getSettings: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const settings = await privacyService.getSettingsByUserId(req.user.userId.toString());

      if (!settings) {
        res.json({
          success: true,
          data: null,
          message: 'No privacy settings found. Default settings are applied.',
        });
        return;
      }

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateSettings: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const updateData: UpdatePrivacySettingsDto = req.body;

      // Try to find existing settings by userId
      const existing = await privacyService.getSettingsByUserId(req.user.userId.toString());

      let settings;
      if (existing) {
        settings = await privacyService.updateSettings(
          existing.memberId.toString(),
          updateData,
          req.user.userId.toString()
        );
      } else {
        // If no settings exist, we need memberId and societyId from the request or user context
        if (!req.body.memberId || !req.body.societyId) {
          throw new AppError(
            400,
            'memberId and societyId are required when creating privacy settings for the first time'
          );
        }

        settings = await privacyService.upsertSettings(
          req.body.memberId,
          req.user.userId.toString(),
          req.body.societyId,
          updateData
        );
      }

      res.json({
        success: true,
        data: settings,
        message: 'Privacy settings updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getAccessLog: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      // Get the user's privacy settings to find their memberId
      const settings = await privacyService.getSettingsByUserId(req.user.userId.toString());

      if (!settings) {
        throw new AppError(404, 'Privacy settings not found. Please set up your privacy settings first.');
      }

      const queryParams: PrivacyAccessLogQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        accessType: req.query.accessType as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await privacyService.getAccessLog(
        settings.memberId.toString(),
        queryParams
      );

      res.json({
        success: true,
        data: {
          logs: result.logs,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  requestDataExport: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const settings = await privacyService.getSettingsByUserId(req.user.userId.toString());

      if (!settings) {
        throw new AppError(404, 'Privacy settings not found. Please set up your privacy settings first.');
      }

      const result = await privacyService.requestDataExport(
        settings.memberId.toString(),
        req.user.userId.toString()
      );

      res.status(202).json({
        success: true,
        data: result,
        message: 'Data export request has been submitted. You will be notified when it is ready.',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  requestDataDeletion: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const settings = await privacyService.getSettingsByUserId(req.user.userId.toString());

      if (!settings) {
        throw new AppError(404, 'Privacy settings not found. Please set up your privacy settings first.');
      }

      const result = await privacyService.requestDataDeletion(
        settings.memberId.toString(),
        req.user.userId.toString()
      );

      res.status(202).json({
        success: true,
        data: result,
        message: 'Data deletion request has been submitted. This process may take up to 30 days.',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getConsents: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const settings = await privacyService.getSettingsByUserId(req.user.userId.toString());

      if (!settings) {
        throw new AppError(404, 'Privacy settings not found. Please set up your privacy settings first.');
      }

      const consents = await privacyService.getConsents(settings.memberId.toString());

      res.json({
        success: true,
        data: consents,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateConsent: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const consentType = req.params.consentType as string;
      const { granted } = req.body;

      const settings = await privacyService.getSettingsByUserId(req.user.userId.toString());

      if (!settings) {
        throw new AppError(404, 'Privacy settings not found. Please set up your privacy settings first.');
      }

      const ipAddress =
        (req.headers['x-forwarded-for'] as string) ||
        req.socket.remoteAddress ||
        'unknown';

      const result = await privacyService.updateConsent(
        settings.memberId.toString(),
        consentType,
        granted,
        ipAddress
      );

      if (!result) {
        throw new AppError(500, 'Failed to update consent');
      }

      res.json({
        success: true,
        data: result,
        message: `Consent for ${consentType} updated successfully`,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getSocietyPrivacyScore: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const societyId = req.user.societyId;

      if (!societyId) {
        throw new AppError(400, 'Society ID is required');
      }

      const score = await privacyService.getSocietyPrivacyScore(societyId.toString());

      res.json({
        success: true,
        data: score,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMemberSettings: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const memberId = req.params.memberId as string;

      const settings = await privacyService.getSettings(memberId);

      if (!settings) {
        res.json({
          success: true,
          data: null,
          message: 'No privacy settings found for this member.',
        });
        return;
      }

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
