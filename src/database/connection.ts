import mongoose from 'mongoose';
import logger from '../core/logger';

/**
 * Drop obsolete publicId_1 index from files collection if it exists.
 * This index was causing E11000 duplicate key errors when creating files
 * (File model has no publicId field, so all inserts had publicId: null).
 */
async function dropObsoleteFileIndex(): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const coll = db.collection('files');
    const indexes = await coll.indexes();
    const hasPublicIdIndex = indexes.some(idx => idx.name === 'publicId_1');
    if (hasPublicIdIndex) {
      await coll.dropIndex('publicId_1');
      logger.info('Dropped obsolete publicId_1 index from files collection');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('index not found') && !msg.includes('ns not found')) {
      logger.warn('Could not drop publicId_1 index:', msg);
    }
  }
}

/**
 * Simple MongoDB connection function
 * Connects to MongoDB Atlas and logs the result
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        'MongoDB URI is not set (set MONGO_URI or MONGODB_URI in environment)'
      );
    }

    const lite = process.env.NODE_ENV !== 'production';
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: process.env.NODE_ENV === 'production' ? 20 : 2,
      minPoolSize: 0,
      autoIndex: !lite,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    if (!lite) {
      await dropObsoleteFileIndex();
    }

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.VERCEL === '1') {
      throw error;
    }
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
    console.log('MongoDB disconnected');
  } catch (error: any) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
    console.error(`Error disconnecting from MongoDB: ${error.message}`);
    if (process.env.VERCEL === '1') {
      throw error;
    }
    process.exit(1);
  }
};
