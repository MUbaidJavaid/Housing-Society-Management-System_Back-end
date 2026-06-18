import { Types } from 'mongoose';
import SMSLog, { ISMSLog } from '../models/models-sms-log';
import {
  SMSBulkResult,
  SMSQueryParams,
  SMSResult,
  SMSStats,
} from '../types/types-sms';

/**
 * Send SMS via the configured provider API
 */
async function sendViaProvider(recipient: string, message: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const apiUrl = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;

  if (!apiUrl) {
    // If no SMS API configured, log warning and simulate success in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS-DEV] Would send to ${recipient}: ${message}`);
      return { success: true, messageId: `dev-${Date.now()}` };
    }
    return { success: false, error: 'SMS API URL not configured' };
  }

  try {
    // Dynamic import of https/http module for making the API call
    const https = await import('https');
    const http = await import('http');
    const { URL } = await import('url');

    const parsedUrl = new URL(apiUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const transport = isHttps ? https : http;

    const postData = JSON.stringify({
      to: recipient,
      message,
      api_key: apiKey,
    });

    return new Promise((resolve) => {
      const req = transport.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: string) => { data += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve({
                  success: true,
                  messageId: parsed.messageId || parsed.id || parsed.message_id || `msg-${Date.now()}`,
                });
              } else {
                resolve({
                  success: false,
                  error: parsed.message || parsed.error || `HTTP ${res.statusCode}`,
                });
              }
            } catch {
              resolve({
                success: false,
                error: `Invalid response from SMS provider: ${data.substring(0, 200)}`,
              });
            }
          });
        }
      );

      req.on('error', (err: Error) => {
        resolve({ success: false, error: err.message });
      });

      req.write(postData);
      req.end();
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const smsService = {
  /**
   * Send a single SMS
   */
  async sendSMS(
    recipient: string,
    message: string,
    messageType: ISMSLog['messageType'],
    societyId?: string,
    relatedEntity?: { type: string; id: string }
  ): Promise<SMSResult> {
    const provider = (process.env.SMS_PROVIDER || 'custom_api') as ISMSLog['provider'];

    // Create log entry
    const log = await SMSLog.create({
      recipient,
      message,
      messageType,
      provider,
      status: 'queued',
      societyId: societyId ? new Types.ObjectId(societyId) : undefined,
      relatedEntity: relatedEntity
        ? { type: relatedEntity.type, id: new Types.ObjectId(relatedEntity.id) }
        : undefined,
    });

    // Attempt to send
    const sendResult = await sendViaProvider(recipient, message);

    // Update log with result
    if (sendResult.success) {
      await SMSLog.findByIdAndUpdate(log._id, {
        $set: {
          status: 'sent',
          providerMessageId: sendResult.messageId,
          sentAt: new Date(),
        },
      });
    } else {
      await SMSLog.findByIdAndUpdate(log._id, {
        $set: {
          status: 'failed',
          errorMessage: sendResult.error,
        },
      });
    }

    // Refetch updated log
    const updatedLog = await SMSLog.findById(log._id);

    return {
      success: sendResult.success,
      messageId: sendResult.messageId,
      log: updatedLog,
      error: sendResult.error,
    };
  },

  /**
   * Send SMS to multiple recipients
   */
  async sendBulkSMS(
    recipients: string[],
    message: string,
    messageType: ISMSLog['messageType'],
    societyId?: string
  ): Promise<SMSBulkResult> {
    const results: SMSResult[] = [];
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await smsService.sendSMS(recipient, message, messageType, societyId);
      results.push(result);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return {
      total: recipients.length,
      sent,
      failed,
      results,
    };
  },

  /**
   * Send a formatted payment reminder SMS
   */
  async sendPaymentReminder(
    memberId: string,
    societyId: string,
    dueAmount: number,
    dueDate: string,
    phone: string
  ): Promise<SMSResult> {
    const message = `HSMS Payment Reminder: Your payment of PKR ${dueAmount.toLocaleString()} is due on ${dueDate}. Please make the payment on time to avoid penalties. Ref: ${memberId}`;

    return smsService.sendSMS(phone, message, 'payment_reminder', societyId, {
      type: 'Member',
      id: memberId,
    });
  },

  /**
   * Send visitor alert SMS to a member
   */
  async sendVisitorAlert(
    memberId: string,
    visitorName: string,
    purpose: string,
    phone: string
  ): Promise<SMSResult> {
    const message = `HSMS Visitor Alert: ${visitorName} has arrived at the gate. Purpose: ${purpose}. Please confirm at the guardhouse.`;

    return smsService.sendSMS(phone, message, 'visitor_alert', undefined, {
      type: 'Member',
      id: memberId,
    });
  },

  /**
   * Send emergency alert to all members of a society
   * NOTE: This requires the caller to provide the list of phone numbers
   */
  async sendEmergencyAlert(
    societyId: string,
    message: string,
    phones: string[]
  ): Promise<SMSBulkResult> {
    const emergencyMessage = `HSMS EMERGENCY: ${message}`;
    return smsService.sendBulkSMS(phones, emergencyMessage, 'emergency', societyId);
  },

  /**
   * Send OTP SMS
   */
  async sendOTP(phone: string, otp: string): Promise<SMSResult> {
    const message = `Your HSMS verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;
    return smsService.sendSMS(phone, message, 'otp');
  },

  /**
   * Get SMS logs with pagination and filters
   */
  async getSMSLogs(params: SMSQueryParams): Promise<{
    logs: ISMSLog[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      societyId,
      recipient,
      messageType,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = {};

    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (recipient) query.recipient = { $regex: recipient, $options: 'i' };
    if (messageType) query.messageType = messageType;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      SMSLog.find(query)
        .populate('societyId', 'name')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      SMSLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get SMS statistics for a society
   */
  async getSMSStats(societyId?: string): Promise<SMSStats> {
    const matchStage: any = {};
    if (societyId) {
      matchStage.societyId = new Types.ObjectId(societyId);
    }

    const [statusStats, typeStats] = await Promise.all([
      SMSLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalCost: { $sum: { $ifNull: ['$cost', 0] } },
          },
        },
      ]),
      SMSLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { messageType: '$messageType', status: '$status' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats: SMSStats = {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalQueued: 0,
      totalCost: 0,
      byType: {},
    };

    for (const item of statusStats) {
      stats.totalCost += item.totalCost;
      switch (item._id) {
        case 'sent':
          stats.totalSent = item.count;
          break;
        case 'delivered':
          stats.totalDelivered = item.count;
          break;
        case 'failed':
        case 'rejected':
          stats.totalFailed += item.count;
          break;
        case 'queued':
          stats.totalQueued = item.count;
          break;
      }
    }

    for (const item of typeStats) {
      const msgType = item._id.messageType;
      const msgStatus = item._id.status;

      if (!stats.byType[msgType]) {
        stats.byType[msgType] = { count: 0, delivered: 0, failed: 0 };
      }

      stats.byType[msgType].count += item.count;
      if (msgStatus === 'delivered' || msgStatus === 'sent') {
        stats.byType[msgType].delivered += item.count;
      } else if (msgStatus === 'failed' || msgStatus === 'rejected') {
        stats.byType[msgType].failed += item.count;
      }
    }

    return stats;
  },
};
