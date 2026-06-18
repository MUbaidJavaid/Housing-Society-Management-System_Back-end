import { Types } from 'mongoose';
import Poll from '../models/models-poll';
import {
  CreatePollDto,
  UpdatePollDto,
  PollQueryParams,
  PollType,
  GetPollsResult,
  PollResults,
} from '../types/types-poll';

const toPlainObject = (doc: any): PollType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  return plainObj as PollType;
};

export const pollService = {
  /**
   * Create a new poll
   */
  async create(data: CreatePollDto, userId: Types.ObjectId): Promise<PollType> {
    const pollData = {
      ...data,
      options: data.options.map(opt => ({
        text: opt.text,
        description: opt.description,
        voteCount: 0,
      })),
      createdBy: userId,
      modifiedBy: userId,
    };

    const poll = await Poll.create(pollData);

    const created = await Poll.findById(poll._id)
      .populate('createdBy', 'firstName lastName email');

    if (!created) {
      throw new Error('Failed to create poll');
    }

    return toPlainObject(created);
  },

  /**
   * Get all polls with filters and pagination
   */
  async getAll(params: PollQueryParams): Promise<GetPollsResult> {
    const {
      page = 1,
      limit = 20,
      societyId,
      pollType,
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
    if (pollType) {
      query.pollType = pollType;
    }
    if (status) {
      query.status = status;
    }

    const [polls, total] = await Promise.all([
      Poll.find(query)
        .populate('createdBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Poll.countDocuments(query),
    ]);

    return {
      polls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get poll by ID
   */
  async getById(id: string): Promise<PollType> {
    const poll = await Poll.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    if (!poll || poll.isDeleted) {
      throw new Error('Poll not found');
    }

    return toPlainObject(poll);
  },

  /**
   * Update poll
   */
  async update(id: string, data: UpdatePollDto, userId: Types.ObjectId): Promise<PollType> {
    const existing = await Poll.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Poll not found');
    }

    // Don't allow updating options if votes have already been cast
    if (data.options && existing.votes.length > 0) {
      throw new Error('Cannot update options after votes have been cast');
    }

    const updateData: any = { ...data, modifiedBy: userId };
    if (data.options) {
      updateData.options = data.options.map(opt => ({
        text: opt.text,
        description: opt.description,
        voteCount: 0,
      }));
    }

    const updated = await Poll.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email');

    if (!updated) {
      throw new Error('Failed to update poll');
    }

    return toPlainObject(updated);
  },

  /**
   * Soft delete poll
   */
  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existing = await Poll.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Poll not found');
    }

    const result = await Poll.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Cast vote
   */
  async castVote(
    pollId: string,
    memberId: string,
    optionIndexes: number[],
    ipAddress?: string
  ): Promise<PollType> {
    const poll = await Poll.findById(pollId);
    if (!poll || poll.isDeleted) {
      throw new Error('Poll not found');
    }

    // Check poll is active
    if (poll.status !== 'active') {
      throw new Error('Poll is not active');
    }

    // Check within dates
    const now = new Date();
    if (now < poll.startDate) {
      throw new Error('Poll has not started yet');
    }
    if (now > poll.endDate) {
      throw new Error('Poll has ended');
    }

    // Check if member has already voted (unless anonymous)
    if (!poll.isAnonymous) {
      const hasVoted = poll.votes.some(
        v => v.memberId.toString() === memberId
      );
      if (hasVoted) {
        throw new Error('You have already voted in this poll');
      }
    }

    // Validate option indexes
    for (const idx of optionIndexes) {
      if (idx < 0 || idx >= poll.options.length) {
        throw new Error(`Invalid option index: ${idx}`);
      }
    }

    // Check multiple choices
    if (!poll.allowMultipleChoices && optionIndexes.length > 1) {
      throw new Error('Multiple choices are not allowed for this poll');
    }

    if (poll.allowMultipleChoices && optionIndexes.length > poll.maxChoices) {
      throw new Error(`You can select a maximum of ${poll.maxChoices} options`);
    }

    // Check for duplicate option indexes
    const uniqueIndexes = [...new Set(optionIndexes)];
    if (uniqueIndexes.length !== optionIndexes.length) {
      throw new Error('Duplicate option indexes are not allowed');
    }

    // Record votes
    const memberObjectId = new Types.ObjectId(memberId);
    for (const idx of optionIndexes) {
      poll.votes.push({
        memberId: memberObjectId,
        optionIndex: idx,
        votedAt: new Date(),
        ipAddress,
      } as any);
      poll.options[idx].voteCount += 1;
    }

    poll.totalVoters += 1;
    await poll.save();

    const updated = await Poll.findById(pollId)
      .populate('createdBy', 'firstName lastName email');

    return toPlainObject(updated!);
  },

  /**
   * Calculate and store results
   */
  async calculateResults(pollId: string): Promise<PollResults> {
    const poll = await Poll.findById(pollId);
    if (!poll || poll.isDeleted) {
      throw new Error('Poll not found');
    }

    const totalVotes = poll.votes.length;

    const options = poll.options.map(opt => ({
      text: opt.text,
      description: opt.description,
      voteCount: opt.voteCount,
      percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 10000) / 100 : 0,
    }));

    const results: PollResults = {
      pollId: poll._id.toString(),
      title: poll.title,
      totalVotes,
      totalVoters: poll.totalVoters,
      options,
      isAnonymous: poll.isAnonymous,
      status: poll.status,
    };

    // Store results on the poll
    await Poll.findByIdAndUpdate(pollId, { $set: { results } });

    return results;
  },

  /**
   * Close poll
   */
  async closePoll(pollId: string, userId: Types.ObjectId): Promise<PollType> {
    const poll = await Poll.findById(pollId);
    if (!poll || poll.isDeleted) {
      throw new Error('Poll not found');
    }

    if (poll.status === 'closed') {
      throw new Error('Poll is already closed');
    }

    // Calculate final results before closing
    await this.calculateResults(pollId);

    const updated = await Poll.findByIdAndUpdate(
      pollId,
      {
        $set: {
          status: 'closed',
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('createdBy', 'firstName lastName email');

    if (!updated) {
      throw new Error('Failed to close poll');
    }

    return toPlainObject(updated);
  },

  /**
   * Get poll results
   */
  async getResults(pollId: string): Promise<PollResults> {
    const poll = await Poll.findById(pollId);
    if (!poll || poll.isDeleted) {
      throw new Error('Poll not found');
    }

    // Calculate fresh results
    return this.calculateResults(pollId);
  },
};
