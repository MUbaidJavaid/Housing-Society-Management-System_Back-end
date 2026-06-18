import { Types } from 'mongoose';
import { AppError } from '../../middleware/error.middleware';
import ForumThread, { ThreadStatus } from '../models/models-forum';
import ForumReply, { ReplyStatus } from '../models/models-forum-reply';
import {
  CreateReplyDto,
  CreateThreadDto,
  ForumReplyType,
  ForumStats,
  ForumThreadType,
  GetRepliesResult,
  GetThreadsResult,
  ReplyQueryParams,
  ThreadQueryParams,
  UpdateReplyDto,
  UpdateThreadDto,
} from '../types/types-forum';

const toPlainObject = (doc: any): any => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) plainObj.createdAt = doc.createdAt;
  if (!plainObj.updatedAt && doc.updatedAt) plainObj.updatedAt = doc.updatedAt;
  return plainObj;
};

const threadPopulateFields = [
  { path: 'societyId', select: 'name' },
  { path: 'authorId', select: 'firstName lastName email avatar' },
  { path: 'lastReplyBy', select: 'firstName lastName' },
  { path: 'createdBy', select: 'firstName lastName email' },
];

const replyPopulateFields = [
  { path: 'authorId', select: 'firstName lastName email avatar' },
  { path: 'parentReplyId', select: 'content authorId' },
];

export const forumService = {
  // ── Thread Operations ──

  async createThread(data: CreateThreadDto, userId: Types.ObjectId): Promise<ForumThreadType> {
    const threadData: any = {
      ...data,
      societyId: new Types.ObjectId(data.societyId),
      authorId: userId,
      createdBy: userId,
    };

    const thread = await ForumThread.create(threadData);
    const populated = await ForumThread.findById(thread._id).populate(threadPopulateFields);

    if (!populated) {
      throw new AppError(500, 'Failed to create thread');
    }

    return toPlainObject(populated);
  },

  async getThreads(params: ThreadQueryParams): Promise<GetThreadsResult> {
    const {
      page = 1,
      limit = 20,
      search,
      societyId,
      category,
      isPinned,
      status,
      authorId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (societyId) query.societyId = new Types.ObjectId(societyId);
    if (category) query.category = category;
    if (isPinned !== undefined) query.isPinned = isPinned;
    if (status) query.status = status;
    if (authorId) query.authorId = new Types.ObjectId(authorId);

    const skip = (page - 1) * limit;

    // Pinned threads always come first
    let sortObj: any;
    if (sortBy === 'lastReplyAt') {
      sortObj = { isPinned: -1, lastReplyAt: sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'viewCount') {
      sortObj = { isPinned: -1, viewCount: sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'replyCount') {
      sortObj = { isPinned: -1, replyCount: sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'likeCount') {
      sortObj = { isPinned: -1, likeCount: sortOrder === 'asc' ? 1 : -1 };
    } else {
      sortObj = { isPinned: -1, [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }

    const [threads, total] = await Promise.all([
      ForumThread.find(query)
        .populate(threadPopulateFields)
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      ForumThread.countDocuments(query),
    ]);

    return {
      items: threads.map(toPlainObject),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getThreadById(id: string): Promise<ForumThreadType | null> {
    const thread = await ForumThread.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    }).populate(threadPopulateFields);

    if (!thread) return null;

    // Increment view count
    await ForumThread.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    return toPlainObject(thread);
  },

  async updateThread(id: string, data: UpdateThreadDto, _userId: Types.ObjectId): Promise<ForumThreadType | null> {
    const updateData: any = { ...data };

    const thread = await ForumThread.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(threadPopulateFields);

    if (!thread) return null;
    return toPlainObject(thread);
  },

  async deleteThread(id: string, _userId: Types.ObjectId): Promise<ForumThreadType | null> {
    const thread = await ForumThread.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!thread) return null;

    // Also soft-delete all replies in the thread
    await ForumReply.updateMany(
      { threadId: new Types.ObjectId(id), isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    return toPlainObject(thread);
  },

  async pinThread(id: string): Promise<ForumThreadType | null> {
    const thread = await ForumThread.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!thread) return null;

    thread.isPinned = !thread.isPinned;
    await thread.save();

    const populated = await ForumThread.findById(thread._id).populate(threadPopulateFields);
    return populated ? toPlainObject(populated) : null;
  },

  async lockThread(id: string): Promise<ForumThreadType | null> {
    const thread = await ForumThread.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (!thread) return null;

    thread.isLocked = !thread.isLocked;
    await thread.save();

    const populated = await ForumThread.findById(thread._id).populate(threadPopulateFields);
    return populated ? toPlainObject(populated) : null;
  },

  async likeThread(threadId: string, userId: Types.ObjectId): Promise<ForumThreadType | null> {
    const thread = await ForumThread.findOne({
      _id: new Types.ObjectId(threadId),
      isDeleted: false,
    });

    if (!thread) return null;

    const userIdStr = userId.toString();
    const index = thread.likes.findIndex(id => id.toString() === userIdStr);

    if (index === -1) {
      thread.likes.push(userId);
    } else {
      thread.likes.splice(index, 1);
    }
    thread.likeCount = thread.likes.length;

    await thread.save();

    const populated = await ForumThread.findById(thread._id).populate(threadPopulateFields);
    return populated ? toPlainObject(populated) : null;
  },

  async flagThread(threadId: string, _userId: Types.ObjectId): Promise<ForumThreadType | null> {
    const thread = await ForumThread.findOneAndUpdate(
      { _id: new Types.ObjectId(threadId), isDeleted: false },
      { $set: { status: ThreadStatus.FLAGGED } },
      { new: true }
    ).populate(threadPopulateFields);

    if (!thread) return null;
    return toPlainObject(thread);
  },

  // ── Reply Operations ──

  async createReply(threadId: string, data: CreateReplyDto, userId: Types.ObjectId): Promise<ForumReplyType> {
    const thread = await ForumThread.findOne({
      _id: new Types.ObjectId(threadId),
      isDeleted: false,
    });

    if (!thread) {
      throw new AppError(404, 'Thread not found');
    }

    if (thread.isLocked) {
      throw new AppError(400, 'Thread is locked. No new replies allowed.');
    }

    const replyData: any = {
      ...data,
      threadId: new Types.ObjectId(threadId),
      authorId: userId,
      parentReplyId: data.parentReplyId ? new Types.ObjectId(data.parentReplyId) : undefined,
    };

    const reply = await ForumReply.create(replyData);

    // Update thread reply count and last reply info
    thread.replyCount += 1;
    thread.lastReplyAt = new Date();
    thread.lastReplyBy = userId;
    await thread.save();

    const populated = await ForumReply.findById(reply._id).populate(replyPopulateFields);

    if (!populated) {
      throw new AppError(500, 'Failed to create reply');
    }

    return toPlainObject(populated);
  },

  async getReplies(threadId: string, params: ReplyQueryParams): Promise<GetRepliesResult> {
    const {
      page = 1,
      limit = 20,
      parentReplyId,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params;

    const query: any = {
      threadId: new Types.ObjectId(threadId),
      isDeleted: false,
    };

    if (parentReplyId) {
      query.parentReplyId = new Types.ObjectId(parentReplyId);
    }

    const skip = (page - 1) * limit;
    const sortObj: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [replies, total] = await Promise.all([
      ForumReply.find(query)
        .populate(replyPopulateFields)
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      ForumReply.countDocuments(query),
    ]);

    return {
      items: replies.map(toPlainObject),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async updateReply(replyId: string, data: UpdateReplyDto, _userId: Types.ObjectId): Promise<ForumReplyType | null> {
    const updateData: any = { ...data };

    const reply = await ForumReply.findOneAndUpdate(
      { _id: new Types.ObjectId(replyId), isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(replyPopulateFields);

    if (!reply) return null;
    return toPlainObject(reply);
  },

  async deleteReply(replyId: string, _userId: Types.ObjectId): Promise<ForumReplyType | null> {
    const reply = await ForumReply.findOne({
      _id: new Types.ObjectId(replyId),
      isDeleted: false,
    });

    if (!reply) return null;

    reply.isDeleted = true;
    reply.deletedAt = new Date();
    await reply.save();

    // Decrement thread reply count
    await ForumThread.findByIdAndUpdate(reply.threadId, {
      $inc: { replyCount: -1 },
    });

    return toPlainObject(reply);
  },

  async likeReply(replyId: string, userId: Types.ObjectId): Promise<ForumReplyType | null> {
    const reply = await ForumReply.findOne({
      _id: new Types.ObjectId(replyId),
      isDeleted: false,
    });

    if (!reply) return null;

    const userIdStr = userId.toString();
    const index = reply.likes.findIndex(id => id.toString() === userIdStr);

    if (index === -1) {
      reply.likes.push(userId);
    } else {
      reply.likes.splice(index, 1);
    }
    reply.likeCount = reply.likes.length;

    await reply.save();

    const populated = await ForumReply.findById(reply._id).populate(replyPopulateFields);
    return populated ? toPlainObject(populated) : null;
  },

  async flagReply(replyId: string, _userId: Types.ObjectId): Promise<ForumReplyType | null> {
    const reply = await ForumReply.findOneAndUpdate(
      { _id: new Types.ObjectId(replyId), isDeleted: false },
      { $set: { status: ReplyStatus.FLAGGED } },
      { new: true }
    ).populate(replyPopulateFields);

    if (!reply) return null;
    return toPlainObject(reply);
  },

  // ── Stats ──

  async getForumStats(societyId: string): Promise<ForumStats> {
    const matchQuery = {
      isDeleted: false,
      societyId: new Types.ObjectId(societyId),
    };

    const [threadCount, replyCount, activeUsersResult, categoryCounts] = await Promise.all([
      ForumThread.countDocuments(matchQuery),
      ForumReply.aggregate([
        {
          $lookup: {
            from: 'forumthreads',
            localField: 'threadId',
            foreignField: '_id',
            as: 'thread',
          },
        },
        { $unwind: '$thread' },
        {
          $match: {
            isDeleted: false,
            'thread.societyId': new Types.ObjectId(societyId),
            'thread.isDeleted': false,
          },
        },
        { $count: 'total' },
      ]),
      ForumThread.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$authorId',
          },
        },
        { $count: 'total' },
      ]),
      ForumThread.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalThreads: threadCount,
      totalReplies: replyCount[0]?.total || 0,
      activeUsers: activeUsersResult[0]?.total || 0,
      popularCategories: categoryCounts.map((item: any) => ({
        category: item._id,
        count: item.count,
      })),
    };
  },
};
