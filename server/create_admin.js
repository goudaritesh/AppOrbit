import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/apporbit';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);

    // Check if user already exists
    const existing = await User.findOne({ email: 'goudariteshkumar1@gmail.com' });
    if (existing) {
      existing.role = 'ADMIN';
      await existing.save();
      console.log('User already existed. Promoted to ADMIN.');
    } else {
      const adminUser = new User({
        name: 'Ritesh Kumar Gouda',
        email: 'goudariteshkumar1@gmail.com',
        password: 'Ritesh@123',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        emailVerified: true,
      });
      await adminUser.save();
      console.log('Admin user created successfully with password: Ritesh@123');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
