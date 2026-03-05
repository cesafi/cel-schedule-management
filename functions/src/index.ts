/**
 * CEL Schedule Management — Firebase Cloud Functions
 *
 * Functions:
 *  1. Audit log triggers (onWrite) for volunteers, departments, events
 *  2. Admin callable functions for Firebase Auth user management
 *     (createAuthUser, updateAuthUser, listAuthUsers)
 */

import * as admin from 'firebase-admin';
import {
  onDocumentWritten,
  FirestoreEvent,
  Change,
  DocumentSnapshot,
} from 'firebase-functions/v2/firestore';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';

admin.initializeApp();

const db = admin.firestore();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLLECTIONS = {
  volunteers: 'volunteers',
  events: 'events',
  departments: 'departments',
  users: 'users',
  logs: 'logs',
} as const;

const ACCESS_LEVEL = {
  ADMIN: 1,
  DEPTHEAD: 2,
} as const;

type AccessLevel = (typeof ACCESS_LEVEL)[keyof typeof ACCESS_LEVEL];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type LogEntry = {
  type: string;
  category: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  timeDetected: admin.firestore.Timestamp;
  metadata: Record<string, unknown>;
  isArchived: boolean;
  lastUpdated: admin.firestore.Timestamp;
};

const writeLog = async (entry: Omit<LogEntry, 'timeDetected' | 'isArchived' | 'lastUpdated'>) => {
  const now = admin.firestore.Timestamp.now();
  await db.collection(COLLECTIONS.logs).add({
    ...entry,
    timeDetected: now,
    isArchived: false,
    lastUpdated: now,
  });
};

/**
 * Determines whether a document was created, updated, or deleted.
 */
const resolveChangeType = (
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined, Record<string, string>>,
): 'created' | 'updated' | 'deleted' => {
  const before = event.data?.before?.exists;
  const after = event.data?.after?.exists;
  if (!before && after) return 'created';
  if (before && !after) return 'deleted';
  return 'updated';
};

/**
 * Checks whether the caller has the admin custom claim.
 * Throws HttpsError if not authorised.
 */
const requireAdmin = (request: CallableRequest<unknown>) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
  const level = (request.auth.token as Record<string, unknown>)['accessLevel'] as number | undefined;
  if (level !== ACCESS_LEVEL.ADMIN) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
};

// ---------------------------------------------------------------------------
// Audit Log Triggers
// ---------------------------------------------------------------------------

export const onVolunteerWrite = onDocumentWritten(
  `${COLLECTIONS.volunteers}/{volunteerId}`,
  async (event) => {
    const changeType = resolveChangeType(event);
    const logTypeMap = {
      created: 'VOLUNTEER_CREATED',
      updated: 'VOLUNTEER_UPDATED',
      deleted: 'VOLUNTEER_DELETED',
    };

    const afterData = event.data?.after?.data() as Record<string, unknown> | undefined;
    const isDisabled = afterData?.['IsDisabled'] as boolean | undefined;

    let logType = logTypeMap[changeType];
    if (changeType === 'updated' && isDisabled !== undefined) {
      if (isDisabled) logType = 'VOLUNTEER_DISABLED';
    }

    await writeLog({
      type: logType,
      category: 'volunteer_management',
      severity: 'INFO',
      metadata: {
        volunteerId: event.params.volunteerId,
        volunteerName: (afterData?.['Name'] as string | undefined) ?? '',
        changeType,
      },
    });
  },
);

export const onDepartmentWrite = onDocumentWritten(
  `${COLLECTIONS.departments}/{departmentId}`,
  async (event) => {
    const changeType = resolveChangeType(event);
    const logTypeMap = {
      created: 'DEPARTMENT_CREATED',
      updated: 'DEPARTMENT_UPDATED',
      deleted: 'DEPARTMENT_DELETED',
    };

    const afterData = event.data?.after?.data() as Record<string, unknown> | undefined;

    await writeLog({
      type: logTypeMap[changeType],
      category: 'department_management',
      severity: 'INFO',
      metadata: {
        departmentId: event.params.departmentId,
        departmentName: (afterData?.['DepartmentName'] as string | undefined) ?? '',
        changeType,
      },
    });
  },
);

export const onEventWrite = onDocumentWritten(
  `${COLLECTIONS.events}/{eventId}`,
  async (event) => {
    const changeType = resolveChangeType(event);
    const logTypeMap = {
      created: 'EVENT_CREATED',
      updated: 'EVENT_UPDATED',
      deleted: 'EVENT_DELETED',
    };

    const afterData = event.data?.after?.data() as Record<string, unknown> | undefined;

    await writeLog({
      type: logTypeMap[changeType],
      category: 'event_management',
      severity: 'INFO',
      metadata: {
        eventId: event.params.eventId,
        eventName: (afterData?.['Name'] as string | undefined) ?? '',
        changeType,
      },
    });
  },
);

export const onUserWrite = onDocumentWritten(
  `${COLLECTIONS.users}/{uid}`,
  async (event) => {
    const changeType = resolveChangeType(event);
    const afterData = event.data?.after?.data() as Record<string, unknown> | undefined;
    const beforeData = event.data?.before?.data() as Record<string, unknown> | undefined;

    const logTypeMap = {
      created: 'USER_CREATED',
      updated: 'USER_UPDATED',
      deleted: 'USER_DISABLED',
    };

    // Detect specific user management changes
    let logType = logTypeMap[changeType];
    if (changeType === 'updated') {
      const beforeLevel = beforeData?.['accessLevel'];
      const afterLevel = afterData?.['accessLevel'];
      if (beforeLevel !== afterLevel) logType = 'ACCESS_LEVEL_CHANGED';

      const beforeDisabled = beforeData?.['isDisabled'];
      const afterDisabled = afterData?.['isDisabled'];
      if (!beforeDisabled && afterDisabled) logType = 'USER_DISABLED';
      if (beforeDisabled && !afterDisabled) logType = 'USER_ENABLED';
    }

    await writeLog({
      type: logType,
      category: 'user_management',
      severity: 'INFO',
      metadata: {
        uid: event.params.uid,
        username: (afterData?.['username'] as string | undefined) ?? '',
        changeType,
      },
    });
  },
);

// ---------------------------------------------------------------------------
// Admin Callable Functions — User Management
// ---------------------------------------------------------------------------

/**
 * createAuthUser
 * Creates a Firebase Auth account + Firestore users/{uid} doc + sets custom claims.
 * Admin-only.
 */
export const createAuthUser = onCall(async (request) => {
  requireAdmin(request);

  const { email, password, username, volunteerId, accessLevel } = request.data as {
    email: string;
    password: string;
    username: string;
    volunteerId: string;
    accessLevel: AccessLevel;
  };

  if (!email || !password || !username || !volunteerId || !accessLevel) {
    throw new HttpsError('invalid-argument', 'All fields are required.');
  }

  // Create Firebase Auth user
  const userRecord = await admin.auth().createUser({ email, password, displayName: username });

  // Set custom claims for role-based access
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    accessLevel,
    volunteerId,
  });

  // Create Firestore profile
  const now = admin.firestore.Timestamp.now();
  await db.collection(COLLECTIONS.users).doc(userRecord.uid).set({
    uid: userRecord.uid,
    email,
    username,
    volunteerId,
    accessLevel,
    isDisabled: false,
    createdAt: now,
    lastUpdated: now,
  });

  return { uid: userRecord.uid };
});

/**
 * updateAuthUser
 * Updates a Firebase Auth account + Firestore profile + custom claims.
 * Admin-only.
 */
export const updateAuthUser = onCall(async (request) => {
  requireAdmin(request);

  const { uid, password, accessLevel, isDisabled, username } = request.data as {
    uid: string;
    password?: string;
    accessLevel?: AccessLevel;
    isDisabled?: boolean;
    username?: string;
  };

  if (!uid) {
    throw new HttpsError('invalid-argument', 'uid is required.');
  }

  // Update Firebase Auth
  const authUpdate: admin.auth.UpdateRequest = {};
  if (password) authUpdate.password = password;
  if (isDisabled !== undefined) authUpdate.disabled = isDisabled;
  if (username) authUpdate.displayName = username;
  if (Object.keys(authUpdate).length > 0) {
    await admin.auth().updateUser(uid, authUpdate);
  }

  // Update custom claims if accessLevel changed
  if (accessLevel !== undefined) {
    const current = await admin.auth().getUser(uid);
    const currentClaims = current.customClaims ?? {};
    await admin.auth().setCustomUserClaims(uid, {
      ...currentClaims,
      accessLevel,
    });
  }

  // Update Firestore profile
  const profileUpdate: Record<string, unknown> = {
    lastUpdated: admin.firestore.Timestamp.now(),
  };
  if (accessLevel !== undefined) profileUpdate['accessLevel'] = accessLevel;
  if (isDisabled !== undefined) profileUpdate['isDisabled'] = isDisabled;
  if (username !== undefined) profileUpdate['username'] = username;

  await db.collection(COLLECTIONS.users).doc(uid).update(profileUpdate);
});

/**
 * listAuthUsers
 * Returns a list of all auth users with their profiles.
 * Admin-only.
 */
export const listAuthUsers = onCall(async (request) => {
  requireAdmin(request);

  const listResult = await admin.auth().listUsers(1000);

  const uids = listResult.users.map((u) => u.uid);

  // Batch-fetch Firestore profiles
  const profileDocs = await Promise.all(
    uids.map((uid) => db.collection(COLLECTIONS.users).doc(uid).get()),
  );

  const profileMap = new Map(
    profileDocs.filter((d) => d.exists).map((d) => [d.id, d.data()]),
  );

  return listResult.users.map((fbUser) => {
    const profile = profileMap.get(fbUser.uid) ?? {};
    const claims = fbUser.customClaims ?? {};
    return {
      id: fbUser.uid,
      email: fbUser.email ?? '',
      username: (profile as Record<string, unknown>)['username'] ?? fbUser.displayName ?? '',
      volunteerId: (claims as Record<string, unknown>)['volunteerId'] ?? (profile as Record<string, unknown>)['volunteerId'] ?? '',
      accessLevel: (claims as Record<string, unknown>)['accessLevel'] ?? ACCESS_LEVEL.DEPTHEAD,
      providers: fbUser.providerData.map((p) => p.providerId),
      createdAt: fbUser.metadata.creationTime ?? '',
      lastUpdated: fbUser.metadata.lastRefreshTime ?? '',
      isDisabled: fbUser.disabled,
    };
  });
});
