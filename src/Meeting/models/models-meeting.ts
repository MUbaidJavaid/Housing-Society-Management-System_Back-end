import { Document, Schema, Types, model } from 'mongoose';

export interface IAgendaItem {
  title: string;
  description?: string;
  presenter?: string;
  duration?: number;
}

export interface IDecision {
  description: string;
  decidedBy?: string;
  votesFor?: number;
  votesAgainst?: number;
  abstained?: number;
}

export interface IAttendee {
  memberId: Types.ObjectId;
  status: 'invited' | 'confirmed' | 'attended' | 'absent' | 'proxy';
  proxyTo?: Types.ObjectId;
}

export interface IAttachment {
  name: string;
  fileUrl: string;
}

export interface IMeeting extends Document {
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
  agenda: IAgendaItem[];
  minutes?: string;
  decisions: IDecision[];
  attendees: IAttendee[];
  quorumRequired?: number;
  quorumMet: boolean;
  status: 'draft' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'adjourned';
  attachments: IAttachment[];
  createdBy: Types.ObjectId;
  modifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    description: {
      type: String,
    },

    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society is required'],
    },

    meetingType: {
      type: String,
      required: [true, 'Meeting type is required'],
      enum: ['agm', 'special', 'committee', 'emergency', 'general'],
    },

    date: {
      type: Date,
      required: [true, 'Date is required'],
    },

    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },

    endTime: {
      type: String,
    },

    location: {
      type: String,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    onlineLink: {
      type: String,
    },

    agenda: [
      {
        title: { type: String },
        description: { type: String },
        presenter: { type: String },
        duration: { type: Number },
      },
    ],

    minutes: {
      type: String,
    },

    decisions: [
      {
        description: { type: String },
        decidedBy: { type: String },
        votesFor: { type: Number },
        votesAgainst: { type: Number },
        abstained: { type: Number },
      },
    ],

    attendees: [
      {
        memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
        status: {
          type: String,
          enum: ['invited', 'confirmed', 'attended', 'absent', 'proxy'],
          default: 'invited',
        },
        proxyTo: { type: Schema.Types.ObjectId, ref: 'Member' },
      },
    ],

    quorumRequired: {
      type: Number,
    },

    quorumMet: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ['draft', 'scheduled', 'in-progress', 'completed', 'cancelled', 'adjourned'],
      default: 'draft',
    },

    attachments: [
      {
        name: { type: String },
        fileUrl: { type: String },
      },
    ],

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },

    modifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { __v, ...cleanRet } = ret;
        return cleanRet;
      },
    },
  }
);

// Compound indexes
meetingSchema.index({ societyId: 1, date: -1, isDeleted: 1 });
meetingSchema.index({ meetingType: 1, status: 1 });

const Meeting = model<IMeeting>('Meeting', meetingSchema);

export default Meeting;
