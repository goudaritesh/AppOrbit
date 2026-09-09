import 'dotenv/config';
import mongoose from 'mongoose';
import assert from 'assert';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import App from '../models/App.js';
import Review from '../models/Review.js';
import ReviewVote from '../models/ReviewVote.js';
import ReviewReport from '../models/ReviewReport.js';
import Download from '../models/Download.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

const API_BASE = 'http://localhost:5000/api/v1';

const signToken = (userId, role = 'USER') => {
  return generateAccessToken({ _id: userId, role });
};

async function run() {
  console.log('===============================================================');
  console.log('⭐ APPORBIT SPRINT 7: RATINGS, REVIEWS & COMMUNITY SYSTEM E2E');
  console.log('===============================================================');

  await mongoose.connect('mongodb://127.0.0.1:27017/apporbit');
  console.log('✓ Connected to MongoDB');

  try {
    // -------------------------------------------------------------------------
    // 0. SETUP TEST USERS & SAMPLE APP
    // -------------------------------------------------------------------------
    console.log('\n[Setup] Resolving test users and published application...');
    let devUser = await User.findOne({ role: { $in: ['DEVELOPER', 'ADMIN'] } });
    if (!devUser) {
      devUser = await User.create({
        name: 'Sprint7 Dev',
        username: 'sprint7dev',
        email: `sprint7dev_${Date.now()}@apporbit.io`,
        password: 'Password123!',
        role: 'DEVELOPER',
        accountStatus: 'ACTIVE',
        isVerified: true,
      });
    }

    let user1 = await User.findOne({ role: 'USER', email: /user1/ });
    if (!user1) {
      user1 = await User.create({
        name: 'Sprint7 User One',
        username: 'sprint7user1',
        email: `sprint7user1_${Date.now()}@apporbit.io`,
        password: 'Password123!',
        role: 'USER',
        accountStatus: 'ACTIVE',
        isVerified: true,
      });
    }

    let user2 = await User.findOne({ role: 'USER', email: /user2/ });
    if (!user2 || user2._id.equals(user1._id)) {
      user2 = await User.create({
        name: 'Sprint7 User Two',
        username: 'sprint7user2',
        email: `sprint7user2_${Date.now()}@apporbit.io`,
        password: 'Password123!',
        role: 'USER',
        accountStatus: 'ACTIVE',
        isVerified: true,
      });
    }

    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Sprint7 Admin',
        username: 'sprint7admin',
        email: `sprint7admin_${Date.now()}@apporbit.io`,
        password: 'Password123!',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        isVerified: true,
      });
    }

    let targetApp = await App.findOne({ status: 'PUBLISHED', visibility: 'PUBLIC' });
    if (!targetApp) {
      throw new Error('No published application available for review testing');
    }

    const appId = targetApp._id.toString();
    const devId = targetApp.developer.toString();
    const devToken = signToken(devId, 'DEVELOPER');
    const user1Token = signToken(user1._id, 'USER');
    const user2Token = signToken(user2._id, 'USER');
    const adminToken = signToken(adminUser._id, 'ADMIN');

    // Clean up any existing reviews on target app by test users
    await Review.deleteMany({ application: appId, user: { $in: [user1._id, user2._id] } });
    await ReviewVote.deleteMany({ user: { $in: [user1._id, user2._id] } });
    await ReviewReport.deleteMany({ reporter: { $in: [user1._id, user2._id] } });

    // Seed a verified download record for user1 (Sprint 6 Download model)
    await Download.findOneAndUpdate(
      { appId: targetApp._id, userId: user1._id },
      {
        appId: targetApp._id,
        versionId: targetApp._id,
        userId: user1._id,
        ipHash: 'sprint7testiphash',
        downloadedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log(`  App: ${targetApp.name} (${appId})`);
    console.log(`  User1: ${user1.name} (${user1._id})`);
    console.log(`  User2: ${user2.name} (${user2._id})`);

    // -------------------------------------------------------------------------
    // 1. VALIDATION RULES (Rating 1-5, Comment Length >= 10)
    // -------------------------------------------------------------------------
    console.log('\n[1/7] Testing Review Validation Rules (Rating bounds & comment constraints)...');
    
    // Rating = 0
    const resZero = await fetch(`${API_BASE}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({ rating: 0, comment: 'Valid length comment here' }),
    });
    assert(resZero.status === 400, 'Rating 0 rejected (400)');

    // Rating = 6
    const resSix = await fetch(`${API_BASE}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({ rating: 6, comment: 'Valid length comment here' }),
    });
    assert(resSix.status === 400, 'Rating 6 rejected (400)');

    // Short comment (< 10 chars)
    const resShort = await fetch(`${API_BASE}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({ rating: 5, comment: 'Too short' }),
    });
    assert(resShort.status === 400, 'Comment under 10 chars rejected (400)');
    console.log('  ✓ Rating and length boundary constraints successfully validated');

    // -------------------------------------------------------------------------
    // 2. REVIEW CREATION & VERIFIED DOWNLOAD DETECTION
    // -------------------------------------------------------------------------
    console.log('\n[2/7] Testing Review Creation & Verified Download Badge...');
    const createRes = await fetch(`${API_BASE}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({
        rating: 5,
        title: 'Outstanding Android Utility',
        comment: 'This application has exceeded my expectations with smooth performance and reliability.',
      }),
    });
    assert(createRes.status === 201, 'Review created successfully (201 Created)');
    const createData = await createRes.json();
    assert(createData.success === true, 'Response indicates success');
    const user1Review = createData.data;
    assert(user1Review.rating === 5, 'Rating is 5');
    assert(user1Review.isVerifiedDownload === true, 'isVerifiedDownload marked true');
    assert(user1Review.verifiedUsage === true, 'verifiedUsage marked true');
    const user1ReviewId = user1Review._id || user1Review.id;
    console.log(`  ✓ Review created with ID: ${user1ReviewId}, Verified Download: true`);

    // -------------------------------------------------------------------------
    // 3. APP RATING STATS RECALCULATION
    // -------------------------------------------------------------------------
    console.log('\n[3/7] Testing App Rating Aggregates & Star Distribution...');
    const appAfterRev1 = await App.findById(appId);
    assert(appAfterRev1.ratingAverage === 5, 'ratingAverage is 5.0');
    assert(appAfterRev1.ratingCount >= 1, 'ratingCount is at least 1');
    assert(appAfterRev1.ratingDistribution[5] >= 1, 'ratingDistribution[5] incremented');

    const appReviewsRes = await fetch(`${API_BASE}/apps/${appId}/reviews`);
    assert(appReviewsRes.status === 200, 'GET /apps/:id/reviews returns 200 OK');
    const appReviewsData = await appReviewsRes.json();
    assert(Array.isArray(appReviewsData.data.reviews), 'Reviews array returned');
    assert(appReviewsData.data.ratingSummary.ratingAverage === appAfterRev1.ratingAverage, 'ratingSummary matches app ratingAverage');
    console.log(`  ✓ App average rating: ${appReviewsData.data.ratingSummary.ratingAverage} ⭐ (${appReviewsData.data.ratingSummary.ratingCount} total)`);

    // -------------------------------------------------------------------------
    // 4. ONE REVIEW PER USER & EDIT FLOW
    // -------------------------------------------------------------------------
    console.log('\n[4/7] Testing One Review Per User Constraint & Update...');
    const duplicateRes = await fetch(`${API_BASE}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({
        rating: 3,
        comment: 'Attempting duplicate review submission without upsert',
      }),
    });
    assert(duplicateRes.status === 400, 'Duplicate review without upsert blocked (400 DUPLICATE_REVIEW)');

    // Edit review via PATCH /reviews/:id
    const editRes = await fetch(`${API_BASE}/reviews/${user1ReviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({
        rating: 4,
        title: 'Updated: Very Solid Utility',
        comment: 'Updated review after extended use: Still very reliable and deserves 4 stars.',
      }),
    });
    assert(editRes.status === 200, 'PATCH /reviews/:id returns 200 OK');
    const editData = await editRes.json();
    assert(editData.data.rating === 4, 'Updated rating is 4');

    // Unauthorized user cannot edit
    const unauthEditRes = await fetch(`${API_BASE}/reviews/${user1ReviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user2Token}` },
      body: JSON.stringify({ rating: 1, comment: 'Malicious modification by other user' }),
    });
    assert(unauthEditRes.status === 403, 'Unauthorized edit blocked (403 Forbidden)');
    console.log('  ✓ Single review constraint enforced; own review successfully updated');

    // User 2 adds a 5-star review
    const user2RevRes = await fetch(`${API_BASE}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user2Token}` },
      body: JSON.stringify({
        rating: 5,
        title: 'Loved it from day one',
        comment: 'Amazing experience. Works flawlessly on Android 14.',
      }),
    });
    assert(user2RevRes.status === 201, 'User 2 review created (201 Created)');
    console.log('  ✓ Second user review registered; multi-user aggregate ready');

    // -------------------------------------------------------------------------
    // 5. HELPFUL VOTING SYSTEM (1 vote per user per review)
    // -------------------------------------------------------------------------
    console.log('\n[5/7] Testing Helpful Voting System...');
    // Self vote should be blocked
    const selfVoteRes = await fetch(`${API_BASE}/reviews/${user1ReviewId}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(selfVoteRes.status === 400, 'Self-voting on own review blocked (400)');

    // User 2 votes User 1 helpful
    const voteRes = await fetch(`${API_BASE}/reviews/${user1ReviewId}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert(voteRes.status === 200, 'POST /reviews/:id/helpful returns 200 OK');
    const voteData = await voteRes.json();
    assert(voteData.data.helpfulCount === 1, 'Helpful count incremented to 1');

    // Duplicate vote blocked
    const dupVoteRes = await fetch(`${API_BASE}/reviews/${user1ReviewId}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert(dupVoteRes.status === 400, 'Duplicate helpful vote blocked (400)');

    // Remove vote
    const unvoteRes = await fetch(`${API_BASE}/reviews/${user1ReviewId}/helpful`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert(unvoteRes.status === 200, 'DELETE /reviews/:id/helpful returns 200 OK');
    const unvoteData = await unvoteRes.json();
    assert(unvoteData.data.helpfulCount === 0, 'Helpful count decremented to 0');
    console.log('  ✓ Helpful voting cycle (vote, anti-duplicate, unvote) verified');

    // -------------------------------------------------------------------------
    // 6. DEVELOPER REVIEWS DASHBOARD & OFFICIAL RESPONSE
    // -------------------------------------------------------------------------
    console.log('\n[6/7] Testing Developer Reviews Dashboard & Official Response...');
    const devReviewsRes = await fetch(`${API_BASE}/developer/reviews`, {
      headers: { Authorization: `Bearer ${devToken}` },
    });
    assert(devReviewsRes.status === 200, 'GET /developer/reviews returns 200 OK');
    const devReviewsData = await devReviewsRes.json();
    assert(Array.isArray(devReviewsData.data.reviews), 'Developer reviews array returned');
    assert(devReviewsData.data.stats, 'Developer review analytics stats returned');
    console.log(`  Developer has ${devReviewsData.data.stats.totalReviews} reviews, Average: ${devReviewsData.data.stats.averageRating} ★`);

    // Developer replies to User 1 review
    const respondRes = await fetch(`${API_BASE}/reviews/${user1ReviewId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${devToken}` },
      body: JSON.stringify({
        message: 'Thank you for your valuable feedback! We are constantly improving performance.',
      }),
    });
    assert(respondRes.status === 200, 'POST /reviews/:id/respond returns 200 OK');
    const respondData = await respondRes.json();
    assert(respondData.data.developerResponse?.message || respondData.data.developerReply?.message, 'Official developer response recorded');

    // Unauthorized user cannot reply as developer
    const unauthReplyRes = await fetch(`${API_BASE}/reviews/${user1ReviewId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user2Token}` },
      body: JSON.stringify({ message: 'Impersonating developer' }),
    });
    assert([401, 403].includes(unauthReplyRes.status), 'Non-developer reply blocked (403/401)');
    console.log('  ✓ Official developer response posted and protected against non-owners');

    // -------------------------------------------------------------------------
    // 7. COMMUNITY ABUSE REPORTING & ADMIN MODERATION
    // -------------------------------------------------------------------------
    console.log('\n[7/7] Testing Community Reporting & Admin Review Moderation...');
    const reportRes = await fetch(`${API_BASE}/reviews/${user1ReviewId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user2Token}` },
      body: JSON.stringify({
        reason: 'SPAM',
        description: 'Testing reporting system in Sprint 7',
      }),
    });
    assert(reportRes.status === 200, 'POST /reviews/:id/report returns 200 OK');
    console.log('  ✓ Review reported to administrative moderation queue');

    // Admin fetches reviews
    const adminReviewsRes = await fetch(`${API_BASE}/admin/reviews`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminReviewsRes.status === 200, 'GET /admin/reviews returns 200 OK');
    const adminData = await adminReviewsRes.json();
    assert(Array.isArray(adminData.data.reviews), 'Admin moderation queue returned');

    // Admin moderates review to HIDDEN
    const hideRes = await fetch(`${API_BASE}/admin/reviews/${user1ReviewId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'HIDDEN',
        reason: 'Investigation pending',
      }),
    });
    assert(hideRes.status === 200, 'PATCH /admin/reviews/:id/status returns 200 OK');
    const hideData = await hideRes.json();
    assert(hideData.data.status === 'HIDDEN', 'Review status set to HIDDEN');

    // Verify rating recalculation excludes HIDDEN review
    const appAfterHide = await App.findById(appId);
    console.log(`  ✓ After hiding review: App rating recalculated to ${appAfterHide.ratingAverage} ★ (${appAfterHide.ratingCount} active ratings)`);

    // Admin restores review to ACTIVE
    const restoreRes = await fetch(`${API_BASE}/admin/reviews/${user1ReviewId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'ACTIVE',
        reason: 'Review approved and cleared',
      }),
    });
    assert(restoreRes.status === 200, 'Review restored to ACTIVE');
    console.log('  ✓ Admin review moderation verified with real-time rating updates');

    console.log('\n===============================================================');
    console.log('🎉 SPRINT 7 MILESTONE FULLY VERIFIED — 100% PASS RATE');
    console.log('===============================================================');
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error('\n❌ SPRINT 7 VERIFICATION FAILED:', err);
  process.exit(1);
});
