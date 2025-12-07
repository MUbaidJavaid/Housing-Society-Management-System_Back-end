import { model, Schema, Types } from 'mongoose';

// Token interface
export interface IToken {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  sessionId: string;
  type: 'access' | 'refresh' | 'password_reset' | 'email_verification';
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Metadata
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: Record<string, any>;
}

// Token schema
const tokenSchema = new Schema<IToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['access', 'refresh', 'password_reset', 'email_verification'],
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    revokedAt: {
      type: Date,
    },

    userAgent: {
      type: String,
    },

    ipAddress: {
      type: String,
    },

    deviceInfo: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
tokenSchema.index({ userId: 1, type: 1, isRevoked: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tokenSchema.index({ sessionId: 1, isRevoked: 1 });

// Static methods
tokenSchema.statics.findActiveTokens = function (userId: Types.ObjectId) {
  return this.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

tokenSchema.statics.revokeUserTokens = function (userId: Types.ObjectId) {
  return this.updateMany({ userId, isRevoked: false }, { isRevoked: true, revokedAt: new Date() });
};

tokenSchema.statics.revokeSessionTokens = function (sessionId: string) {
  return this.updateMany(
    { sessionId, isRevoked: false },
    { isRevoked: true, revokedAt: new Date() }
  );
};

// Create and export the model
const Token = model<IToken>('Token', tokenSchema);
export default Token;
