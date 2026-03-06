'use strict';

/**
 * create-admin.js
 * Creates a Firebase Auth user with accessLevel = 1 (ADMIN) + Firestore profile.
 *
 * Usage:
 *   node scripts/create-admin.js <email> <password> <username>
 *
 * Example:
 *   node scripts/create-admin.js admin@example.com MyPassword123! "John Doe"
 */

const admin = require('firebase-admin');
const path = require('path');

const KEY_PATH = path.resolve(
  __dirname,
  '../backend/cel-scheduling-saystem-firebase-adminsdk-fbsvc-2ff5f21f15.json',
);

const ACCESS_LEVEL_ADMIN = 1;

const [email, password, username] = process.argv.slice(2);

if (!email || !password || !username) {
  console.error('Usage: node scripts/create-admin.js <email> <password> <username>');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(KEY_PATH) });

async function run() {
  const userRecord = await admin.auth().createUser({ email, password, displayName: username });
  console.log('Auth user created:', userRecord.uid);

  await admin.auth().setCustomUserClaims(userRecord.uid, {
    accessLevel: ACCESS_LEVEL_ADMIN,
    volunteerId: '',
  });
  console.log('Custom claims set: accessLevel = 1 (ADMIN)');

  const now = admin.firestore.Timestamp.now();
  await admin.firestore().collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email,
    username,
    volunteerId: '',
    accessLevel: ACCESS_LEVEL_ADMIN,
    isDisabled: false,
    createdAt: now,
    lastUpdated: now,
  });
  console.log('Firestore profile created at users/' + userRecord.uid);
  console.log('\nAdmin created successfully!');
  console.log('  UID     :', userRecord.uid);
  console.log('  Email   :', email);
  console.log('  Username:', username);
}

run().then(() => process.exit(0)).catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
