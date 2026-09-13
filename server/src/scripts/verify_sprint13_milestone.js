/**
 * Sprint 13 Milestone Automated Verification Script
 * Validates:
 * 1. Waitlist submission & role categorization
 * 2. Duplicate waitlist entry handling
 * 3. Referral code generation & unique format
 * 4. Invite code validation
 * 5. Referral conversion on user registration
 * 6. Developer first app activation & referral reward trigger
 * 7. App Badges & Student Project tagging
 * 8. Featured apps endpoint & discovery filtering
 * 9. Growth analytics & acquisition funnel telemetry
 * 10. Admin waitlist & referral management queries
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import User from '../models/User.js';
import App from '../models/App.js';
import Category from '../models/Category.js';
import Waitlist from '../models/Waitlist.js';
import Referral from '../models/Referral.js';
import WaitlistService from '../services/waitlistService.js';
import ReferralService from '../services/referralService.js';
import GrowthAnalyticsService from '../services/growthAnalyticsService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/apporbit';

async function runSprint13Verification() {
  console.log('\n======================================================');
  console.log('🚀 APPORBIT — SPRINT 13 MILESTONE AUTOMATED VERIFICATION');
  console.log('======================================================\n');

  let passedTests = 0;
  const totalTests = 10;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB:', MONGODB_URI);

    // Setup dummy test users
    const timestamp = Date.now();
    const testDevEmail = `sprint13_dev_${timestamp}@example.com`;
    const testUserEmail = `sprint13_user_${timestamp}@example.com`;
    const testWaitlistEmail = `sprint13_waitlist_${timestamp}@example.com`;

    const devUser = await User.create({
      name: 'Sprint 13 Developer',
      email: testDevEmail,
      password: 'Password123!@#',
      role: 'DEVELOPER',
      accountStatus: 'ACTIVE',
    });

    const consumerUser = await User.create({
      name: 'Sprint 13 Consumer',
      email: testUserEmail,
      password: 'Password123!@#',
      role: 'USER',
      accountStatus: 'ACTIVE',
    });

    // 1. Waitlist Registration
    console.log('\n--- TEST 1: Waitlist Registration & Role Tagging ---');
    const waitlistResult = await WaitlistService.joinWaitlist({
      name: 'Future Student Creator',
      email: testWaitlistEmail,
      role: 'STUDENT',
      interests: ['AI Tools', 'Flutter Projects'],
      feedback: 'Excited to publish our final year IoT app!',
    });
    if (waitlistResult.entry && waitlistResult.entry.role === 'STUDENT' && !waitlistResult.isExisting) {
      console.log('✅ TEST 1 PASSED: Waitlist entry recorded with STUDENT role');
      passedTests++;
    } else {
      console.error('❌ TEST 1 FAILED:', waitlistResult);
    }

    // 2. Waitlist Duplicate Handling
    console.log('\n--- TEST 2: Waitlist Duplicate Handling ---');
    const duplicateWaitlist = await WaitlistService.joinWaitlist({
      name: 'Future Student Creator Duplicate',
      email: testWaitlistEmail,
      role: 'STUDENT',
    });
    if (duplicateWaitlist.isExisting === true) {
      console.log('✅ TEST 2 PASSED: Duplicate waitlist handled idempotently');
      passedTests++;
    } else {
      console.error('❌ TEST 2 FAILED:', duplicateWaitlist);
    }

    // 3. Referral Code Generation
    console.log('\n--- TEST 3: Referral Code Generation & Unique Format ---');
    const refData = await ReferralService.getOrCreateReferralCode(devUser._id);
    if (refData.referralCode && refData.referralCode.startsWith('AO-')) {
      console.log(`✅ TEST 3 PASSED: Referral code generated: ${refData.referralCode}`);
      passedTests++;
    } else {
      console.error('❌ TEST 3 FAILED: Invalid referral code:', refData);
    }

    // 4. Invite Code Validation
    console.log('\n--- TEST 4: Invite Code Validation ---');
    const validationResult = await ReferralService.validateInviteCode(refData.referralCode);
    if (validationResult.valid && validationResult.referrerName === devUser.name) {
      console.log(`✅ TEST 4 PASSED: Invite code validated for referrer: ${validationResult.referrerName}`);
      passedTests++;
    } else {
      console.error('❌ TEST 4 FAILED: Code validation failed:', validationResult);
    }

    // 5. Referral Registration Tracking
    console.log('\n--- TEST 5: Referral Conversion Tracking ---');
    const newReferee = await User.create({
      name: 'Referee Student Developer',
      email: `referee_${timestamp}@example.com`,
      password: 'Password123!@#',
      role: 'DEVELOPER',
      accountStatus: 'ACTIVE',
    });

    const referralDoc = await ReferralService.processReferralRegistration(newReferee, refData.referralCode);
    if (referralDoc && referralDoc.status === 'REGISTERED' && referralDoc.referrer.toString() === devUser._id.toString()) {
      console.log('✅ TEST 5 PASSED: Referral conversion logged with REGISTERED status');
      passedTests++;
    } else {
      console.error('❌ TEST 5 FAILED: Failed to record referral conversion');
    }

    // 6. Developer First App Activation & Referral Reward
    console.log('\n--- TEST 6: First App Activation & Referral Reward ---');
    const activationDoc = await ReferralService.processFirstAppActivation(newReferee._id);
    const updatedReferrer = await User.findById(devUser._id);
    if (
      activationDoc &&
      activationDoc.status === 'ACTIVATED_FIRST_APP' &&
      updatedReferrer.referralStats.activatedDevelopers >= 1 &&
      updatedReferrer.referralStats.rewardedSlots >= 1
    ) {
      console.log('✅ TEST 6 PASSED: First app activation rewarded referrer with extra slot');
      passedTests++;
    } else {
      console.error('❌ TEST 6 FAILED: Referral activation reward not triggered');
    }

    // 7. App Badging & Student Project Tagging
    console.log('\n--- TEST 7: App Badging & Student Project Tagging ---');
    let defaultCategory = await Category.findOne({ status: 'ACTIVE' });
    if (!defaultCategory) {
      defaultCategory = await Category.create({ name: 'Productivity', slug: 'productivity' });
    }

    const testApp = await App.create({
      name: `Campus Compass ${timestamp}`,
      slug: `campus-compass-${timestamp}`,
      shortDescription: 'Smart navigation app for university campus',
      description: 'Comprehensive college project built for campus discovery and indoor routing.',
      developer: newReferee._id,
      category: defaultCategory._id,
      platform: 'ANDROID',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      badge: 'STUDENT_PROJECT',
      isStudentProject: true,
      featured: true,
      featuredOrder: 1,
      downloadCount: 42,
      ratingAverage: 4.8,
      ratingCount: 15,
    });

    if (testApp.badge === 'STUDENT_PROJECT' && testApp.isStudentProject === true) {
      console.log(`✅ TEST 7 PASSED: App badged as STUDENT_PROJECT: ${testApp.name}`);
      passedTests++;
    } else {
      console.error('❌ TEST 7 FAILED: App badge assignment failed');
    }

    // 8. Featured Apps & Discovery Filtering
    console.log('\n--- TEST 8: Featured Apps & Discovery Filtering ---');
    const featuredApps = await App.find({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      $or: [
        { featured: true },
        { badge: { $in: ['FEATURED', 'EDITORS_CHOICE', 'TRENDING', 'STUDENT_PROJECT'] } },
      ],
    }).lean();

    const studentApps = await App.find({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      $or: [{ isStudentProject: true }, { badge: 'STUDENT_PROJECT' }],
    }).lean();

    if (featuredApps.length > 0 && studentApps.length > 0) {
      console.log(`✅ TEST 8 PASSED: Found ${featuredApps.length} featured apps and ${studentApps.length} student projects`);
      passedTests++;
    } else {
      console.error('❌ TEST 8 FAILED: Discovery filtering query failed');
    }

    // 9. Growth Analytics Telemetry
    console.log('\n--- TEST 9: Growth Analytics & Funnel Telemetry ---');
    const growthData = await GrowthAnalyticsService.getGrowthAnalytics();
    if (
      growthData.kpis &&
      growthData.channels &&
      growthData.funnel &&
      growthData.readiness &&
      growthData.readiness.score >= 60
    ) {
      console.log(`✅ TEST 9 PASSED: Growth analytics calculated with readiness score ${growthData.readiness.score}%`);
      passedTests++;
    } else {
      console.error('❌ TEST 9 FAILED: Growth analytics returned incomplete payload:', growthData);
    }

    // 10. Admin Queries for Waitlist & Referrals
    console.log('\n--- TEST 10: Admin Waitlist & Referral Moderation Queries ---');
    const [waitlistAdmin, referralAdmin] = await Promise.all([
      WaitlistService.getWaitlist({ limit: 10 }),
      ReferralService.getAdminReferrals({ limit: 10 }),
    ]);

    if (
      waitlistAdmin.items &&
      waitlistAdmin.pagination &&
      referralAdmin.items &&
      referralAdmin.pagination
    ) {
      console.log(`✅ TEST 10 PASSED: Admin queries verified (Waitlist: ${waitlistAdmin.items.length}, Referrals: ${referralAdmin.items.length})`);
      passedTests++;
    } else {
      console.error('❌ TEST 10 FAILED: Admin queries failed');
    }

    // Cleanup test fixtures
    await Promise.all([
      User.deleteMany({ _id: { $in: [devUser._id, consumerUser._id, newReferee._id] } }),
      Waitlist.deleteMany({ email: testWaitlistEmail }),
      Referral.deleteMany({ _id: { $in: [referralDoc?._id, activationDoc?._id].filter(Boolean) } }),
      App.deleteOne({ _id: testApp._id }),
    ]);

    console.log('\n======================================================');
    console.log(`🏁 SPRINT 13 AUTOMATED VERIFICATION RESULTS: ${passedTests} / ${totalTests} PASSED`);
    console.log(`🎯 PASS RATE: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('======================================================\n');

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('💥 Fatal error running Sprint 13 verification:', err);
    process.exit(1);
  }
}

runSprint13Verification();
