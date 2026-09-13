import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import { generateAccessToken } from './src/utils/tokenUtils.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/apporbit';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const user = await User.findOne({ email: 'goudariteshkumar1@gmail.com' });
    const token = generateAccessToken(user);
    
    const endpoints = [
      '/api/admin/dashboard',
      '/api/admin/dashboard/analytics?range=30d'
    ];
    
    for (const ep of endpoints) {
      const response = await fetch(`http://localhost:5000${ep}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const text = await response.text();
      console.log(`Endpoint: ${ep} -> Status: ${response.status}`);
      console.log(`Body keys: ${Object.keys(JSON.parse(text))}`);
      console.log(`Body: ${text.slice(0, 150)}`);
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
