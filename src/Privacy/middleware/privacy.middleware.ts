import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../auth/types';
import PrivacySettings from '../models/models-privacy-settings';
import { privacyService } from '../services/service-privacy';

/**
 * Middleware that applies privacy filters to response data containing member information.
 *
 * This middleware intercepts the response, checks if it contains member data,
 * looks up the member's privacy settings, filters out hidden fields based on
 * the requester's role, and logs the access to PrivacyAccessLog.
 */
export const applyPrivacyFilters = (
  accessType:
    | 'view-profile'
    | 'view-contact'
    | 'view-documents'
    | 'export-data'
    | 'view-financial'
    | 'view-directory' = 'view-profile'
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override res.json to intercept the response
    res.json = function (body: any) {
      // Only process successful responses with data
      if (!body || !body.success || !body.data) {
        return originalJson(body);
      }

      const processData = async () => {
        try {
          const requestorRole = req.user?.role || 'user';
          const requestorId = req.user?.userId?.toString();

          // Handle single member data
          if (body.data && body.data.memberId) {
            const memberId = body.data.memberId.toString
              ? body.data.memberId.toString()
              : body.data.memberId;

            const settings = await PrivacySettings.findOne({
              memberId,
              isDeleted: false,
            }).lean();

            if (settings) {
              body.data = privacyService.filterMemberData(body.data, requestorRole, settings);

              // Log the access (fire and forget)
              if (requestorId && req.user?.societyId) {
                privacyService
                  .logAccess({
                    memberId,
                    accessorId: requestorId,
                    accessorRole: requestorRole,
                    accessType,
                    fieldsAccessed: Object.keys(body.data),
                    ipAddress:
                      (req.headers['x-forwarded-for'] as string) ||
                      req.socket.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    societyId: req.user.societyId.toString(),
                  })
                  .catch(() => {
                    // Silently fail - don't break the response for logging failures
                  });
              }
            }
          }

          // Handle array of members (e.g., directory listing)
          if (body.data && body.data.members && Array.isArray(body.data.members)) {
            const memberIds = body.data.members
              .map((m: any) => m._id?.toString() || m.id?.toString())
              .filter(Boolean);

            if (memberIds.length > 0) {
              const allSettings = await PrivacySettings.find({
                memberId: { $in: memberIds },
                isDeleted: false,
              }).lean();

              const settingsMap = new Map(
                allSettings.map((s: any) => [s.memberId.toString(), s])
              );

              body.data.members = body.data.members.map((member: any) => {
                const mId = member._id?.toString() || member.id?.toString();
                const memberSettings = settingsMap.get(mId);

                if (memberSettings) {
                  return privacyService.filterMemberData(member, requestorRole, memberSettings);
                }

                return member;
              });

              // Log directory access (fire and forget)
              if (requestorId && req.user?.societyId) {
                memberIds.forEach((memberId: string) => {
                  privacyService
                    .logAccess({
                      memberId,
                      accessorId: requestorId,
                      accessorRole: requestorRole,
                      accessType: 'view-directory',
                      fieldsAccessed: ['directory-listing'],
                      ipAddress:
                        (req.headers['x-forwarded-for'] as string) ||
                        req.socket.remoteAddress,
                      userAgent: req.headers['user-agent'],
                      societyId: req.user!.societyId!.toString(),
                    })
                    .catch(() => {
                      // Silently fail
                    });
                });
              }
            }
          }

          return originalJson(body);
        } catch (error) {
          // If privacy filtering fails, return the original unfiltered data
          return originalJson(body);
        }
      };

      processData();
      return res;
    } as any;

    next();
  };
};
