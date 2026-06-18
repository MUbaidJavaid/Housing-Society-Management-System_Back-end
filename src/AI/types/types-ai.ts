import { Types } from 'mongoose';

export type AgentType =
  | 'resident-assistant'
  | 'committee-advisor'
  | 'financial-analyst'
  | 'compliance-monitor';

export type MessageRole = 'user' | 'assistant' | 'system';

export type ConversationStatus = 'active' | 'archived';

export type InsightType = 'prediction' | 'anomaly' | 'recommendation' | 'trend' | 'alert';

export type InsightCategory =
  | 'financial'
  | 'complaints'
  | 'members'
  | 'maintenance'
  | 'compliance'
  | 'general';

export type InsightSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface AIMessageType {
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AIConversationType {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  societyId: Types.ObjectId;
  agentType: AgentType;
  title?: string;
  messages: AIMessageType[];
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIInsightType {
  _id: Types.ObjectId;
  societyId: Types.ObjectId;
  insightType: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  severity: InsightSeverity;
  data?: Record<string, any>;
  actionable: boolean;
  actionUrl?: string;
  acknowledgedBy?: Types.ObjectId;
  acknowledgedAt?: Date;
  expiresAt?: Date;
  generatedBy: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatDto {
  agentType: AgentType;
  message: string;
  conversationId?: string;
  societyId: string;
}

export interface CreateInsightDto {
  societyId: string;
  insightType: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  severity?: InsightSeverity;
  data?: Record<string, any>;
  actionable?: boolean;
  actionUrl?: string;
  expiresAt?: Date;
  generatedBy?: string;
}

export interface ConversationQueryParams {
  page?: number;
  limit?: number;
  status?: ConversationStatus;
  agentType?: AgentType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InsightQueryParams {
  page?: number;
  limit?: number;
  insightType?: InsightType;
  category?: InsightCategory;
  severity?: InsightSeverity;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ChatResponse {
  conversationId: string;
  response: string;
  agentType: AgentType;
}
