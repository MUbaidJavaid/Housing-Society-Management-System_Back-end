// Quick script to check if UserStaff exists
// Run with: npx ts-node --skipProject check-user.ts
// Or: npx tsx check-user.ts

import mongoose from 'mongoose';
import UserStaff from './src/UserPermissions/models/models-userstaff';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-uri-here';

async function checkUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const userId = '69673c543a56de227742bfc4';
    const user = await UserStaff.findById(userId);

    if (!user) {
      console.log(`❌ User ${userId} NOT FOUND`);
    } else {
      console.log(`✅ User found:`, {
        _id: user._id,
        userName: user.userName,
        fullName: user.fullName,
        isActive: user.isActive,
        isDeleted: user.isDeleted,
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
