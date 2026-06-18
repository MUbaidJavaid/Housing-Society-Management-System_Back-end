export interface SendSMSDto {
  recipient: string;
  message: string;
  messageType: 'otp' | 'payment_reminder' | 'visitor_alert' | 'announcement' | 'emergency' | 'custom';
  societyId?: string;
  relatedEntity?: {
    type: string;
    id: string;
  };
  metadata?: Record<string, any>;
}

export interface SendBulkSMSDto {
  recipients: string[];
  message: string;
  messageType: 'otp' | 'payment_reminder' | 'visitor_alert' | 'announcement' | 'emergency' | 'custom';
  societyId?: string;
  metadata?: Record<string, any>;
}

export interface SMSQueryParams {
  page?: number;
  limit?: number;
  societyId?: string;
  recipient?: string;
  messageType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  log: any;
  error?: string;
}

export interface SMSBulkResult {
  total: number;
  sent: number;
  failed: number;
  results: SMSResult[];
}

export interface SMSStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalQueued: number;
  totalCost: number;
  byType: Record<string, { count: number; delivered: number; failed: number }>;
}
