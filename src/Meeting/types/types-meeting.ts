import { Types } from 'mongoose';

export interface AgendaItemType {
  title: string;
  description?: string;
  presenter?: string;
  duration?: number;
}

export interface DecisionType {
  description: string;
  decidedBy?: string;
  votesFor?: number;
  votesAgainst?: number;
  abstained?: number;
}

export interface AttendeeType {
  memberId: Types.ObjectId;
  status: 'invited' | 'confirmed' | 'attended' | 'absent' | 'proxy';
  proxyTo?: Types.ObjectId;
}

export interface AttachmentType {
  name: string;
  fileUrl: string;
}

export interface MeetingType {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  societyId: Types.ObjectId;
  meetingType: 'agm' | 'special' | 'committee' | 'emergency' | 'general';
  date: Date;
  startTime: string;
  endTime?: string;
  location?: string;
  isOnline: boolean;
  onlineLink?: string;
  agenda: AgendaItemType[];
  minutes?: string;
  decisions: DecisionType[];
  attendees: AttendeeType[];
  quorumRequired?: number;
  quorumMet: boolean;
  status: 'draft' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'adjourned';
  attachments: AttachmentType[];
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  societyId: string;
  meetingType: 'agm' | 'special' | 'committee' | 'emergency' | 'general';
  date: Date;
  startTime: string;
  endTime?: string;
  location?: string;
  isOnline?: boolean;
  onlineLink?: string;
  agenda?: AgendaItemType[];
  quorumRequired?: number;
  attendees?: { memberId: string; status?: string }[];
  attachments?: AttachmentType[];
}

export interface UpdateMeetingDto {
  title?: string;
  description?: string;
  meetingType?: 'agm' | 'special' | 'committee' | 'emergency' | 'general';
  date?: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  isOnline?: boolean;
  onlineLink?: string;
  agenda?: AgendaItemType[];
  quorumRequired?: number;
  status?: 'draft' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'adjourned';
  attachments?: AttachmentType[];
}

export interface MeetingQueryParams {
  page?: number;
  limit?: number;
  societyId?: string;
  meetingType?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MeetingPaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetMeetingsResult {
  meetings: MeetingType[];
  pagination: MeetingPaginationResult;
}
