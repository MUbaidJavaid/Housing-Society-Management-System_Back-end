import mongoose from 'mongoose';
import logger from '../core/logger';

/**
 * Simple MongoDB connection function
 * Connects to MongoDB Atlas and logs the result
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    const conn = await mongoose.connect(mongoUri);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
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
    process.exit(1);
  }
};
