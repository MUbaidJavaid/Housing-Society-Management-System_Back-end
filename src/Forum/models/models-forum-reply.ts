import { Document, Schema, Types, model } from 'mongoose';

export enum ReplyStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  FLAGGED = 'flagged',
}

export interface IReplyAttachment {
  name: string;
  fileUrl: string;
}

export interface IForumReply extends Document {
  threadId: Types.ObjectId;
  content: string;
  authorId: Types.ObjectId;
  isAnonymous: boolean;
  parentReplyId?: Types.ObjectId;
  likes: Types.ObjectId[];
  likeCount: number;
  attachments: IReplyAttachment[];
  status: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const forumReplySchema = new Schema<IForumReply>(
  {
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'ForumThread',
      required: [true, 'Thread ID is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    parentReplyId: {
      type: Schema.Types.ObjectId,
      ref: 'ForumReply',
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
    attachments: [
      {
        name: { type: String },
        fileUrl: { type: String },
      },
    ],
    status: {
      type: String,
      enum: Object.values(ReplyStatus),
      default: ReplyStatus.ACTIVE,
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
forumReplySchema.index({ threadId: 1, createdAt: 1, isDeleted: 1 });
forumReplySchema.index({ authorId: 1 });
forumReplySchema.index({ parentReplyId: 1 });

const ForumReply = model<IForumReply>('ForumReply', forumReplySchema);

export default ForumReply;
