import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

/**
 * CLI Script to provision initial administrative accounts without public API exposure.
 * Usage: node src/scripts/seedAdmin.js [email] [password] [role: ADMIN|SUPER_ADMIN] [name]
 */
const seedAdmin = async () => {
  const args = process.argv.slice(2);
  const email = (args[0] || 'admin@apporbit.io').toLowerCase();
  const password = args[1] || 'AppOrbitAdmin2026!';
  const role = (args[2] || 'ADMIN').toUpperCase();
  const name = args[3] || 'System Administrator';

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    console.error(`Invalid admin role '${role}'. Must be ADMIN or SUPER_ADMIN.`);
    process.exit(1);
  }

  try {
    await connectDB();

    let user = await User.findOne({ email });
    if (user) {
      console.log(`[Admin Seed] Account with email ${email} already exists. Updating role to ${role}...`);
      user.role = role;
      user.accountStatus = 'ACTIVE';
      user.emailVerified = true;
      user.password = password;
      await user.save();
      console.log(`[Admin Seed] Account ${email} successfully updated to ${role}.`);
    } else {
      user = new User({
        name,
        email,
        password,
        role,
        accountStatus: 'ACTIVE',
        emailVerified: true,
      });
      await user.save();
      console.log(`[Admin Seed] Successfully created new ${role} account: ${email}`);
    }

    console.log(`\n==============================================`);
    console.log(` Admin Credentials:`);
    console.log(` Email: ${email}`);
    console.log(` Role:  ${role}`);
    console.log(` Status: ACTIVE (Verified)`);
    console.log(`==============================================\n`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(`[Admin Seed Error] ${err.message}`);
    process.exit(1);
  }
};

seedAdmin();
