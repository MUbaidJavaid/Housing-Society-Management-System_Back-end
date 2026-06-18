import { Types } from 'mongoose';
import Meeting from '../models/models-meeting';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  MeetingQueryParams,
  MeetingType,
  GetMeetingsResult,
  AgendaItemType,
  DecisionType,
} from '../types/types-meeting';

const toPlainObject = (doc: any): MeetingType => {
  const plainObj = doc.toObject ? doc.toObject() : doc;
  if (!plainObj.createdAt && doc.createdAt) {
    plainObj.createdAt = doc.createdAt;
  }
  if (!plainObj.updatedAt && doc.updatedAt) {
    plainObj.updatedAt = doc.updatedAt;
  }
  return plainObj as MeetingType;
};

export const meetingService = {
  /**
   * Create a new meeting
   */
  async create(data: CreateMeetingDto, userId: Types.ObjectId): Promise<MeetingType> {
    const meetingData = {
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    };

    const meeting = await Meeting.create(meetingData);

    const created = await Meeting.findById(meeting._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees.memberId', 'name email');

    if (!created) {
      throw new Error('Failed to create meeting');
    }

    return toPlainObject(created);
  },

  /**
   * Get all meetings with filters and pagination
   */
  async getAll(params: MeetingQueryParams): Promise<GetMeetingsResult> {
    const {
      page = 1,
      limit = 20,
      societyId,
      meetingType,
      status,
      fromDate,
      toDate,
      sortBy = 'date',
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
    if (meetingType) {
      query.meetingType = meetingType;
    }
    if (status) {
      query.status = status;
    }
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) {
        query.date.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.date.$lte = new Date(toDate);
      }
    }

    const [meetings, total] = await Promise.all([
      Meeting.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('attendees.memberId', 'name email')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .then(docs => docs.map(doc => toPlainObject(doc))),
      Meeting.countDocuments(query),
    ]);

    return {
      meetings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get meeting by ID
   */
  async getById(id: string): Promise<MeetingType> {
    const meeting = await Meeting.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email')
      .populate('attendees.memberId', 'name email phone')
      .populate('attendees.proxyTo', 'name email');

    if (!meeting || meeting.isDeleted) {
      throw new Error('Meeting not found');
    }

    return toPlainObject(meeting);
  },

  /**
   * Update meeting
   */
  async update(id: string, data: UpdateMeetingDto, userId: Types.ObjectId): Promise<MeetingType> {
    const existing = await Meeting.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Meeting not found');
    }

    const updated = await Meeting.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          modifiedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees.memberId', 'name email');

    if (!updated) {
      throw new Error('Failed to update meeting');
    }

    return toPlainObject(updated);
  },

  /**
   * Soft delete meeting
   */
  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const existing = await Meeting.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Meeting not found');
    }

    const result = await Meeting.findByIdAndUpdate(
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
   * Add agenda item to meeting
   */
  async addAgendaItem(id: string, agendaItem: AgendaItemType, userId: Types.ObjectId): Promise<MeetingType> {
    const meeting = await Meeting.findById(id);
    if (!meeting || meeting.isDeleted) {
      throw new Error('Meeting not found');
    }

    const updated = await Meeting.findByIdAndUpdate(
      id,
      {
        $push: { agenda: agendaItem },
        $set: { modifiedBy: userId },
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees.memberId', 'name email');

    if (!updated) {
      throw new Error('Failed to add agenda item');
    }

    return toPlainObject(updated);
  },

  /**
   * Update meeting minutes
   */
  async updateMinutes(id: string, minutes: string, userId: Types.ObjectId): Promise<MeetingType> {
    const meeting = await Meeting.findById(id);
    if (!meeting || meeting.isDeleted) {
      throw new Error('Meeting not found');
    }

    const updated = await Meeting.findByIdAndUpdate(
      id,
      {
        $set: {
          minutes,
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('createdBy', 'firstName lastName email');

    if (!updated) {
      throw new Error('Failed to update minutes');
    }

    return toPlainObject(updated);
  },

  /**
   * Record attendance for a member
   */
  async recordAttendance(
    meetingId: string,
    memberId: string,
    status: 'invited' | 'confirmed' | 'attended' | 'absent' | 'proxy',
    proxyTo?: string
  ): Promise<MeetingType> {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting || meeting.isDeleted) {
      throw new Error('Meeting not found');
    }

    const memberObjectId = new Types.ObjectId(memberId);

    // Check if attendee already exists
    const existingIndex = meeting.attendees.findIndex(
      a => a.memberId.toString() === memberId
    );

    if (existingIndex >= 0) {
      // Update existing attendee
      meeting.attendees[existingIndex].status = status;
      if (proxyTo) {
        meeting.attendees[existingIndex].proxyTo = new Types.ObjectId(proxyTo);
      }
    } else {
      // Add new attendee
      const attendee: any = { memberId: memberObjectId, status };
      if (proxyTo) {
        attendee.proxyTo = new Types.ObjectId(proxyTo);
      }
      meeting.attendees.push(attendee);
    }

    await meeting.save();

    const updated = await Meeting.findById(meetingId)
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees.memberId', 'name email');

    return toPlainObject(updated!);
  },

  /**
   * Check if quorum is met
   */
  async checkQuorum(meetingId: string): Promise<{ quorumMet: boolean; attendedCount: number; totalInvited: number; percentage: number }> {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting || meeting.isDeleted) {
      throw new Error('Meeting not found');
    }

    const totalInvited = meeting.attendees.length;
    const attendedCount = meeting.attendees.filter(
      a => a.status === 'attended' || a.status === 'proxy'
    ).length;

    const percentage = totalInvited > 0 ? (attendedCount / totalInvited) * 100 : 0;
    const quorumMet = meeting.quorumRequired ? percentage >= meeting.quorumRequired : true;

    // Update quorum status
    await Meeting.findByIdAndUpdate(meetingId, { $set: { quorumMet } });

    return {
      quorumMet,
      attendedCount,
      totalInvited,
      percentage: Math.round(percentage * 100) / 100,
    };
  },

  /**
   * Add a decision to the meeting
   */
  async addDecision(meetingId: string, decision: DecisionType, userId: Types.ObjectId): Promise<MeetingType> {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting || meeting.isDeleted) {
      throw new Error('Meeting not found');
    }

    const updated = await Meeting.findByIdAndUpdate(
      meetingId,
      {
        $push: { decisions: decision },
        $set: { modifiedBy: userId },
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees.memberId', 'name email');

    if (!updated) {
      throw new Error('Failed to add decision');
    }

    return toPlainObject(updated);
  },

  /**
   * Mark meeting as completed
   */
  async completeMeeting(meetingId: string, userId: Types.ObjectId): Promise<MeetingType> {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting || meeting.isDeleted) {
      throw new Error('Meeting not found');
    }

    if (meeting.status === 'completed') {
      throw new Error('Meeting is already completed');
    }

    if (meeting.status === 'cancelled') {
      throw new Error('Cannot complete a cancelled meeting');
    }

    const updated = await Meeting.findByIdAndUpdate(
      meetingId,
      {
        $set: {
          status: 'completed',
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees.memberId', 'name email');

    if (!updated) {
      throw new Error('Failed to complete meeting');
    }

    return toPlainObject(updated);
  },
};
