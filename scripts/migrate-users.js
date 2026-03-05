/**
 * migrate-users.js
 *
 * One-time migration script: copies existing auth_users Firestore documents
 * into Firebase Authentication + the new users/{uid} Firestore collection.
 *
 * Usage:
 *   node scripts/migrate-users.js
 *
 * Prerequisites:
 *   - Set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON path, OR
 *     place the key at the path below in KEY_PATH.
 *   - npm install firebase-admin   (run once in the scripts/ dir, or from root)
 */

'use strict';

const admin = require('firebase-admin');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const KEY_PATH = path.resolve(
  __dirname,
  '../backend/cel-scheduling-saystem-firebase-adminsdk-fbsvc-2ff5f21f15.json',
);

const ACCESS_LEVEL = {
  ADMIN: 1,
  DEPTHEAD: 2,
};

const SOURCE_COLLECTION = 'auth_users';
const TARGET_COLLECTION = 'users';

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

admin.initializeApp({
  credential: admin.credential.cert(KEY_PATH),
});

const db = admin.firestore();
const auth = admin.auth();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTempPassword(length = 16) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

/**
 * Maps the old accessLevel string/int values to the new numeric constants.
 * Adjust this mapping to match whatever values exist in your auth_users docs.
 */
function normalizeAccessLevel(raw) {
  if (raw === 1 || raw === 'admin' || raw === 'ADMIN') return ACCESS_LEVEL.ADMIN;
  if (raw === 2 || raw === 'depthead' || raw === 'DEPTHEAD') return ACCESS_LEVEL.DEPTHEAD;
  return ACCESS_LEVEL.DEPTHEAD; // safe default
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function migrate() {
  console.log('[migrate-users] Reading from:', SOURCE_COLLECTION);

  const snapshot = await db.collection(SOURCE_COLLECTION).get();
  if (snapshot.empty) {
    console.log('[migrate-users] No documents found in', SOURCE_COLLECTION);
    return;
  }

  console.log(`[migrate-users] Found ${snapshot.size} user(s) to migrate.`);

  const results = { success: 0, skipped: 0, failed: 0 };

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // --- Extract fields (adjust field names to match your actual Firestore schema) ---
    const rawUsername = data.Username || data.username || doc.id;
    const usernameIsEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawUsername);
    const email =
      data.Email ||
      data.email ||
      // If the username is already a valid email, use it directly
      (usernameIsEmail
        ? rawUsername
        : `${rawUsername.replace(/\s+/g, '_').toLowerCase()}@cel-placeholder.local`);

    const username = data.Username || data.username || data.DisplayName || rawUsername;
    const volunteerId = data.VolunteerId || data.volunteerId || doc.id;
    const accessLevel = normalizeAccessLevel(data.AccessLevel || data.accessLevel);
    const isDisabled = data.IsDisabled || data.isDisabled || false;

    // --- Check if user already exists in Firebase Auth ---
    let existingUid = null;
    try {
      const existing = await auth.getUserByEmail(email);
      existingUid = existing.uid;
      console.log(`  [skip] ${email} already exists (uid: ${existingUid})`);
      results.skipped++;
    } catch (_notFound) {
      // User does not exist — proceed with creation
    }

    if (existingUid) continue;

    // --- Create Firebase Auth user ---
    try {
      const tempPassword = generateTempPassword();
      const userRecord = await auth.createUser({
        email,
        password: tempPassword,
        displayName: username,
        disabled: isDisabled,
      });

      console.log(`  [created] ${email} → uid: ${userRecord.uid}`);
      console.log(`           temp password: ${tempPassword}  (send to user securely)`);

      // --- Set custom claims ---
      await auth.setCustomUserClaims(userRecord.uid, { accessLevel, volunteerId });

      // --- Create users/{uid} Firestore profile ---
      const now = admin.firestore.Timestamp.now();
      await db.collection(TARGET_COLLECTION).doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        username,
        volunteerId,
        accessLevel,
        isDisabled,
        createdAt: now,
        lastUpdated: now,
      });

      results.success++;
    } catch (err) {
      console.error(`  [error] Failed to migrate ${email}:`, err.message);
      results.failed++;
    }
  }

  console.log('\n[migrate-users] Done.');
  console.log(`  Success : ${results.success}`);
  console.log(`  Skipped : ${results.skipped}`);
  console.log(`  Failed  : ${results.failed}`);
}

migrate().catch((err) => {
  console.error('[migrate-users] Fatal error:', err);
  process.exit(1);
});
