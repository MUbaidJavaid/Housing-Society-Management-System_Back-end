import { Document, Schema, Types, model } from 'mongoose';

export interface IUserNotification extends Document {
  userId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const userNotificationSchema = new Schema<IUserNotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['announcement', 'complaint', 'bill', 'payment', 'transfer', 'possession', 'other'],
      default: 'other',
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

userNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const UserNotification = model<IUserNotification>('UserNotification', userNotificationSchema);
export default UserNotification;
