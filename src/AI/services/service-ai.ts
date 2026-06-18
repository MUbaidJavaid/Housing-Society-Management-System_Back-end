import { Types } from 'mongoose';
import { AppError } from '../../middleware/error.middleware';
import AIConversation from '../models/models-ai-conversation';
import AIInsight from '../models/models-ai-insight';
import {
  AgentType,
  ChatResponse,
  ConversationQueryParams,
  CreateInsightDto,
  InsightQueryParams,
  PaginationResult,
} from '../types/types-ai';
import { AI_AGENTS } from './service-ai-agents';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export const aiService = {
  /**
   * Send a message to an AI agent and get a response
   */
  async chat(
    userId: Types.ObjectId,
    societyId: string,
    agentType: AgentType,
    message: string,
    conversationId?: string
  ): Promise<ChatResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new AppError(500, 'AI service is not configured. GROQ_API_KEY is missing.');
    }

    const agent = AI_AGENTS[agentType];
    if (!agent) {
      throw new AppError(400, `Invalid agent type: ${agentType}`);
    }

    let conversation;

    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: new Types.ObjectId(conversationId),
        userId,
        isDeleted: false,
      });

      if (!conversation) {
        throw new AppError(404, 'Conversation not found');
      }
    } else {
      // Create new conversation
      conversation = await AIConversation.create({
        userId,
        societyId: new Types.ObjectId(societyId),
        agentType,
        title: message.substring(0, 100),
        messages: [],
        status: 'active',
        messageCount: 0,
      });
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Build messages array for Groq API
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: agent.systemPrompt },
    ];

    // Include recent messages for context (last 20 messages)
    const recentMessages = conversation.messages.slice(-20);
    for (const msg of recentMessages) {
      apiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Call Groq API
    let assistantContent: string;
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new AppError(
          502,
          `AI service returned an error: ${response.status} ${response.statusText} - ${errorBody}`
        );
      }

      const data = (await response.json()) as any;

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new AppError(502, 'AI service returned an unexpected response format');
      }

      assistantContent = data.choices[0].message.content;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(502, `Failed to communicate with AI service: ${error.message}`);
    }

    // Add assistant response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
    });

    // Update conversation metadata
    conversation.messageCount = conversation.messages.filter(
      (m: any) => m.role !== 'system'
    ).length;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    return {
      conversationId: conversation._id.toString(),
      response: assistantContent,
      agentType,
    };
  },

  /**
   * Get conversations for a user with pagination
   */
  async getConversations(
    userId: Types.ObjectId,
    params: ConversationQueryParams
  ): Promise<{ conversations: any[]; pagination: PaginationResult }> {
    const {
      page = 1,
      limit = 20,
      status,
      agentType,
      sortBy = 'lastMessageAt',
      sortOrder = 'desc',
    } = params;

    const filter: any = { userId, isDeleted: false };

    if (status) {
      filter.status = status;
    }
    if (agentType) {
      filter.agentType = agentType;
    }

    const total = await AIConversation.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const conversations = await AIConversation.find(filter)
      .select('-messages')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      conversations,
      pagination: { page, limit, total, pages },
    };
  },

  /**
   * Get a single conversation with all messages
   */
  async getConversation(conversationId: string, userId: Types.ObjectId): Promise<any> {
    const conversation = await AIConversation.findOne({
      _id: new Types.ObjectId(conversationId),
      userId,
      isDeleted: false,
    }).lean();

    if (!conversation) {
      throw new AppError(404, 'Conversation not found');
    }

    return conversation;
  },

  /**
   * Soft delete a conversation
   */
  async deleteConversation(conversationId: string, userId: Types.ObjectId): Promise<void> {
    const conversation = await AIConversation.findOne({
      _id: new Types.ObjectId(conversationId),
      userId,
      isDeleted: false,
    });

    if (!conversation) {
      throw new AppError(404, 'Conversation not found');
    }

    conversation.isDeleted = true;
    conversation.deletedAt = new Date();
    await conversation.save();
  },

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string, userId: Types.ObjectId): Promise<void> {
    const conversation = await AIConversation.findOne({
      _id: new Types.ObjectId(conversationId),
      userId,
      isDeleted: false,
    });

    if (!conversation) {
      throw new AppError(404, 'Conversation not found');
    }

    conversation.status = 'archived';
    await conversation.save();
  },

  /**
   * Get insights for a society with pagination and filters
   */
  async getInsights(
    societyId: string,
    params: InsightQueryParams
  ): Promise<{ insights: any[]; pagination: PaginationResult }> {
    const {
      page = 1,
      limit = 20,
      insightType,
      category,
      severity,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const filter: any = {
      societyId: new Types.ObjectId(societyId),
      isDeleted: false,
    };

    if (insightType) {
      filter.insightType = insightType;
    }
    if (category) {
      filter.category = category;
    }
    if (severity) {
      filter.severity = severity;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const total = await AIInsight.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const insights = await AIInsight.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('acknowledgedBy', 'firstName lastName email')
      .lean();

    return {
      insights,
      pagination: { page, limit, total, pages },
    };
  },

  /**
   * Create a new insight
   */
  async createInsight(data: CreateInsightDto): Promise<any> {
    const insightData = {
      ...data,
      societyId: new Types.ObjectId(data.societyId),
    };

    const insight = await AIInsight.create(insightData);
    return insight.toJSON();
  },

  /**
   * Acknowledge an insight
   */
  async acknowledgeInsight(insightId: string, userId: Types.ObjectId): Promise<any> {
    const insight = await AIInsight.findOne({
      _id: new Types.ObjectId(insightId),
      isDeleted: false,
    });

    if (!insight) {
      throw new AppError(404, 'Insight not found');
    }

    insight.acknowledgedBy = userId;
    insight.acknowledgedAt = new Date();
    await insight.save();

    return insight.toJSON();
  },

  /**
   * Soft delete an insight
   */
  async deleteInsight(insightId: string): Promise<void> {
    const insight = await AIInsight.findOne({
      _id: new Types.ObjectId(insightId),
      isDeleted: false,
    });

    if (!insight) {
      throw new AppError(404, 'Insight not found');
    }

    insight.isDeleted = true;
    insight.deletedAt = new Date();
    insight.isActive = false;
    await insight.save();
  },

  /**
   * Get top active insights for dashboard widget
   */
  async getDashboardInsights(societyId: string): Promise<any[]> {
    const insights = await AIInsight.find({
      societyId: new Types.ObjectId(societyId),
      isActive: true,
      isDeleted: false,
    })
      .sort({ severity: -1, createdAt: -1 })
      .limit(10)
      .lean();

    return insights;
  },
};
