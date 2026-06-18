import { Document, Schema, Types, model } from 'mongoose';

export enum ThreadCategory {
  GENERAL = 'general',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  EVENTS = 'events',
  SUGGESTIONS = 'suggestions',
  LOST_FOUND = 'lost_found',
  HELP = 'help',
  DISCUSSION = 'discussion',
}

export enum ThreadStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  HIDDEN = 'hidden',
  FLAGGED = 'flagged',
}

export interface IAttachment {
  name: string;
  fileUrl: string;
}

export interface IForumThread extends Document {
  title: string;
  content: string;
  societyId: Types.ObjectId;
  authorId: Types.ObjectId;
  category: string;
  isPinned: boolean;
  isLocked: boolean;
  isAnonymous: boolean;
  viewCount: number;
  replyCount: number;
  lastReplyAt?: Date;
  lastReplyBy?: Types.ObjectId;
  likes: Types.ObjectId[];
  likeCount: number;
  tags: string[];
  attachments: IAttachment[];
  status: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const forumThreadSchema = new Schema<IForumThread>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: 'Society',
      required: [true, 'Society ID is required'],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
    },
    category: {
      type: String,
      enum: Object.values(ThreadCategory),
      required: [true, 'Category is required'],
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    lastReplyAt: {
      type: Date,
    },
    lastReplyBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        name: { type: String },
        fileUrl: { type: String },
      },
    ],
    status: {
      type: String,
      enum: Object.values(ThreadStatus),
      default: ThreadStatus.ACTIVE,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
  }
);

// Indexes
forumThreadSchema.index({
  societyId: 1,
  category: 1,
  isPinned: -1,
  lastReplyAt: -1,
  isDeleted: 1,
});
forumThreadSchema.index(
  { title: 'text', content: 'text' },
  {
    weights: { title: 10, content: 3 },
    name: 'forum_thread_text_search',
  }
);
forumThreadSchema.index({ authorId: 1 });

const ForumThread = model<IForumThread>('ForumThread', forumThreadSchema);

export default ForumThread;
