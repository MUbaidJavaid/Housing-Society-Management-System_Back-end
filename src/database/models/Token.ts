import { Document, model, Model, Schema, Types } from 'mongoose';

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

  // Metadata
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITokenMethods {
  isExpired(): boolean;
  revoke(): Promise<this>;
}

export type TokenDocument = IToken & Document<Types.ObjectId> & ITokenMethods;

export interface TokenModel extends Model<TokenDocument, {}, ITokenMethods> {
  findActiveTokens(userId: Types.ObjectId): Promise<TokenDocument[]>;
  revokeUserTokens(userId: Types.ObjectId): Promise<any>;
  revokeSessionTokens(sessionId: string): Promise<any>;
  cleanupExpiredTokens(): Promise<number>;
}

// Token schema
const tokenSchema = new Schema<TokenDocument, TokenModel, ITokenMethods>(
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
tokenSchema.index({ token: 1, type: 1 });

/* ---------------------- Instance Methods ---------------------- */
tokenSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

tokenSchema.methods.revoke = function () {
  this.isRevoked = true;
  this.revokedAt = new Date();
  return this.save();
};

/* ---------------------- Static Methods ---------------------- */
tokenSchema.statics.findActiveTokens = function (userId: Types.ObjectId) {
  return this.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

tokenSchema.statics.revokeUserTokens = function (userId: Types.ObjectId) {
  return this.updateMany(
    { userId, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
      updatedAt: new Date(),
    }
  );
};

tokenSchema.statics.revokeSessionTokens = function (sessionId: string) {
  return this.updateMany(
    { sessionId, isRevoked: false },
    {
      isRevoked: true,
      revokedAt: new Date(),
      updatedAt: new Date(),
    }
  );
};

tokenSchema.statics.cleanupExpiredTokens = async function () {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
};

// Create and export the model
const Token = model<TokenDocument, TokenModel>('Token', tokenSchema);
export default Token;
