import { Document, Schema, Types, model } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  referenceId?: Types.ObjectId;
  module: string;
  targetUsers?: Types.ObjectId[];
  isRead: boolean;
  readBy?: Types.ObjectId[];
  readAt?: Date;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },

    referenceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    module: {
      type: String,
      required: [true, 'Module is required'],
      enum: ['Complaint', 'Announcement', 'Payment', 'Plot', 'File', 'Member', 'Registry', 'Other'],
      default: 'Other',
      index: true,
    },

    targetUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'UserStaff',
      },
    ],

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'UserStaff',
      },
    ],

    readAt: {
      type: Date,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserStaff',
      required: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
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
    },
  }
);

// Indexes for efficient querying
notificationSchema.index({ isRead: 1, isDeleted: 1, createdAt: -1 });
notificationSchema.index({ module: 1, isDeleted: 1 });
notificationSchema.index({ targetUsers: 1, isRead: 1 });

const Notification = model<INotification>('Notification', notificationSchema);

export default Notification;
