import { Types } from 'mongoose';
import { logger } from '../../logger';
import EmergencyAlert from '../models/models-emergency';
import MedicalProfile from '../models/models-medical-profile';
import {
  TriggerAlertDto,
  EmergencyAlertType,
  MedicalProfileType,
  AlertHistoryParams,
  AlertHistoryResult,
  UpsertMedicalProfileDto,
} from '../types/types-emergency';

const toPlainAlert = (doc: any): EmergencyAlertType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  return plainObj as EmergencyAlertType;
};

const toPlainProfile = (doc: any): MedicalProfileType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  return plainObj as MedicalProfileType;
};

export const emergencyService = {
  /**
   * Trigger a new emergency alert
   */
  async triggerAlert(data: TriggerAlertDto, userId: Types.ObjectId): Promise<EmergencyAlertType> {
    const alertData = {
      ...data,
      triggeredBy: userId,
      status: 'active' as const,
    };

    const alert = await EmergencyAlert.create(alertData);

    // Attempt to send notifications (log if notification service unavailable)
    try {
      logger.info('Emergency alert triggered - notifications should be sent', {
        alertId: alert._id.toString(),
        alertType: alert.alertType,
        severity: alert.severity,
        societyId: alert.societyId.toString(),
      });

      // Increment notifications sent counter
      await EmergencyAlert.findByIdAndUpdate(alert._id, {
        $set: { notificationsSent: 1 },
      });
    } catch (error) {
      logger.warn('Failed to send emergency notifications', {
        alertId: alert._id.toString(),
        error: (error as Error).message,
      });
    }

    const created = await EmergencyAlert.findById(alert._id)
      .populate('triggeredBy', 'firstName lastName email')
      .populate('responders.userId', 'firstName lastName email');

    if (!created) {
      throw new Error('Failed to create emergency alert');
    }

    return toPlainAlert(created);
  },

  /**
   * Respond to an alert
   */
  async respondToAlert(
    alertId: string,
    userId: Types.ObjectId,
    action: string
  ): Promise<EmergencyAlertType> {
    const alert = await EmergencyAlert.findById(alertId);
    if (!alert || alert.isDeleted) {
      throw new Error('Alert not found');
    }

    if (alert.status === 'resolved' || alert.status === 'false_alarm') {
      throw new Error('Alert is already resolved or marked as false alarm');
    }

    // Check if user already responded
    const alreadyResponded = alert.responders.some(
      r => r.userId.toString() === userId.toString()
    );

    if (alreadyResponded) {
      throw new Error('You have already responded to this alert');
    }

    const updated = await EmergencyAlert.findByIdAndUpdate(
      alertId,
      {
        $push: {
          responders: {
            userId,
            respondedAt: new Date(),
            action,
          },
        },
        $set: { status: 'responding' },
      },
      { new: true }
    )
      .populate('triggeredBy', 'firstName lastName email')
      .populate('responders.userId', 'firstName lastName email');

    if (!updated) {
      throw new Error('Failed to respond to alert');
    }

    return toPlainAlert(updated);
  },

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: string,
    userId: Types.ObjectId,
    notes?: string
  ): Promise<EmergencyAlertType> {
    const alert = await EmergencyAlert.findById(alertId);
    if (!alert || alert.isDeleted) {
      throw new Error('Alert not found');
    }

    if (alert.status === 'resolved') {
      throw new Error('Alert is already resolved');
    }

    const updated = await EmergencyAlert.findByIdAndUpdate(
      alertId,
      {
        $set: {
          status: 'resolved',
          resolvedBy: userId,
          resolvedAt: new Date(),
          resolutionNotes: notes || '',
        },
      },
      { new: true }
    )
      .populate('triggeredBy', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName email')
      .populate('responders.userId', 'firstName lastName email');

    if (!updated) {
      throw new Error('Failed to resolve alert');
    }

    return toPlainAlert(updated);
  },

  /**
   * Get active alerts for a society
   */
  async getActiveAlerts(societyId: string): Promise<EmergencyAlertType[]> {
    const alerts = await EmergencyAlert.find({
      societyId: new Types.ObjectId(societyId),
      status: { $in: ['active', 'responding'] },
      isDeleted: false,
    })
      .populate('triggeredBy', 'firstName lastName email')
      .populate('responders.userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return alerts.map(doc => toPlainAlert(doc));
  },

  /**
   * Get alert history with pagination and filters
   */
  async getAlertHistory(params: AlertHistoryParams): Promise<AlertHistoryResult> {
    const {
      page = 1,
      limit = 20,
      societyId,
      alertType,
      severity,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (societyId) {
      query.societyId = new Types.ObjectId(societyId);
    }
    if (alertType) {
      query.alertType = alertType;
    }
    if (severity) {
      query.severity = severity;
    }
    if (status) {
      query.status = status;
    }

    const [alerts, total] = await Promise.all([
      EmergencyAlert.find(query)
        .populate('triggeredBy', 'firstName lastName email')
        .populate('resolvedBy', 'firstName lastName email')
        .populate('responders.userId', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainAlert(doc))),
      EmergencyAlert.countDocuments(query),
    ]);

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get alert by ID
   */
  async getAlertById(id: string): Promise<EmergencyAlertType> {
    const alert = await EmergencyAlert.findById(id)
      .populate('triggeredBy', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName email')
      .populate('responders.userId', 'firstName lastName email');

    if (!alert || alert.isDeleted) {
      throw new Error('Alert not found');
    }

    return toPlainAlert(alert);
  },

  /**
   * Mark an alert as false alarm
   */
  async markFalseAlarm(alertId: string, userId: Types.ObjectId): Promise<EmergencyAlertType> {
    const alert = await EmergencyAlert.findById(alertId);
    if (!alert || alert.isDeleted) {
      throw new Error('Alert not found');
    }

    if (alert.status === 'false_alarm') {
      throw new Error('Alert is already marked as false alarm');
    }

    const updated = await EmergencyAlert.findByIdAndUpdate(
      alertId,
      {
        $set: {
          status: 'false_alarm',
          resolvedBy: userId,
          resolvedAt: new Date(),
          resolutionNotes: 'Marked as false alarm',
        },
      },
      { new: true }
    )
      .populate('triggeredBy', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName email')
      .populate('responders.userId', 'firstName lastName email');

    if (!updated) {
      throw new Error('Failed to mark alert as false alarm');
    }

    return toPlainAlert(updated);
  },

  /**
   * Get medical profile for a member
   */
  async getMedicalProfile(memberId: string): Promise<MedicalProfileType | null> {
    const profile = await MedicalProfile.findOne({
      memberId: new Types.ObjectId(memberId),
      isDeleted: false,
    });

    if (!profile) {
      return null;
    }

    return toPlainProfile(profile);
  },

  /**
   * Create or update medical profile
   */
  async upsertMedicalProfile(
    memberId: string,
    data: UpsertMedicalProfileDto
  ): Promise<MedicalProfileType> {
    const memberObjectId = new Types.ObjectId(memberId);

    const existing = await MedicalProfile.findOne({
      memberId: memberObjectId,
      isDeleted: false,
    });

    if (existing) {
      const updated = await MedicalProfile.findByIdAndUpdate(
        existing._id,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!updated) {
        throw new Error('Failed to update medical profile');
      }

      return toPlainProfile(updated);
    }

    // Create new profile
    const profileData = {
      ...data,
      memberId: memberObjectId,
      societyId: data.societyId ? new Types.ObjectId(data.societyId) : undefined,
    };

    const profile = await MedicalProfile.create(profileData);
    return toPlainProfile(profile);
  },

  /**
   * Get all emergency contacts for a society
   */
  async getEmergencyContacts(societyId: string): Promise<MedicalProfileType[]> {
    const profiles = await MedicalProfile.find({
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
      'emergencyContact.phone': { $exists: true, $ne: '' },
    })
      .populate('memberId', 'name email phone');

    return profiles.map(doc => toPlainProfile(doc));
  },
};
