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

// PascalCase to match the Go backend's SystemLog struct field names.
type LogEntry = {
  Type: string;
  Category: string;
  Severity: 'INFO' | 'WARNING' | 'ERROR';
  TimeDetected: admin.firestore.Timestamp;
  Metadata: Record<string, unknown>;
  IsArchived: boolean;
  LastUpdated: admin.firestore.Timestamp;
};

const writeLog = async (entry: { type: string; category: string; severity: 'INFO' | 'WARNING' | 'ERROR'; metadata: Record<string, unknown> }) => {
  const now = admin.firestore.Timestamp.now();
  await db.collection(COLLECTIONS.logs).add({
    Type: entry.type,
    Category: entry.category,
    Severity: entry.severity,
    Metadata: entry.metadata,
    TimeDetected: now,
    IsArchived: false,
    LastUpdated: now,
  } satisfies LogEntry);
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
    const beforeData = event.data?.before?.data() as Record<string, unknown> | undefined;
    const resolvedData = afterData ?? beforeData;
    const isDisabled = afterData?.['IsDisabled'] as boolean | undefined;

    let logType = logTypeMap[changeType];
    if (changeType === 'updated' && isDisabled !== undefined) {
      if (isDisabled) logType = 'VOLUNTEER_DISABLED';
      else logType = 'VOLUNTEER_ENABLED';
    }

    await writeLog({
      type: logType,
      category: 'volunteer_management',
      severity: 'INFO',
      metadata: {
        volunteerId: event.params.volunteerId,
        volunteerName: (resolvedData?.['Name'] as string | undefined) ?? '',
        changeType,
      },
    });
  },
);

export const onDepartmentWrite = onDocumentWritten(
  `${COLLECTIONS.departments}/{departmentId}`,
  async (event) => {
    const changeType = resolveChangeType(event);
    const afterData = event.data?.after?.data() as Record<string, unknown> | undefined;
    const beforeData = event.data?.before?.data() as Record<string, unknown> | undefined;
    const resolvedData = afterData ?? beforeData;
    const deptId = event.params.departmentId;
    const deptName = (resolvedData?.['DepartmentName'] as string | undefined) ?? '';

    if (changeType === 'created') {
      await writeLog({ type: 'DEPARTMENT_CREATED', category: 'department_management', severity: 'INFO', metadata: { departmentId: deptId, departmentName: deptName, changeType } });
      return;
    }
    if (changeType === 'deleted') {
      await writeLog({ type: 'DEPARTMENT_DELETED', category: 'department_management', severity: 'INFO', metadata: { departmentId: deptId, departmentName: deptName, changeType } });
      return;
    }

    // changeType === 'updated' — detect sub-operations by comparing VolunteerMembers
    type RawMember = { VolunteerID: string; MembershipType: string };
    const beforeMembers = (beforeData?.['VolunteerMembers'] ?? []) as RawMember[];
    const afterMembers = (afterData?.['VolunteerMembers'] ?? []) as RawMember[];
    const beforeIds = new Set(beforeMembers.map((m) => m.VolunteerID));
    const afterIds = new Set(afterMembers.map((m) => m.VolunteerID));
    const addedIds = [...afterIds].filter((id) => !beforeIds.has(id));
    const removedIds = [...beforeIds].filter((id) => !afterIds.has(id));
    const roleChanges = afterMembers.filter((am) => {
      const bm = beforeMembers.find((m) => m.VolunteerID === am.VolunteerID);
      return bm && bm.MembershipType !== am.MembershipType;
    });

    let loggedSubOperation = false;

    for (const volunteerId of addedIds) {
      await writeLog({ type: 'DEPARTMENT_MEMBER_ADDED', category: 'department_management', severity: 'INFO', metadata: { departmentId: deptId, departmentName: deptName, volunteerId, changeType: 'member_added' } });
      loggedSubOperation = true;
    }
    for (const volunteerId of removedIds) {
      await writeLog({ type: 'DEPARTMENT_MEMBER_REMOVED', category: 'department_management', severity: 'INFO', metadata: { departmentId: deptId, departmentName: deptName, volunteerId, changeType: 'member_removed' } });
      loggedSubOperation = true;
    }
    for (const member of roleChanges) {
      const oldRole = beforeMembers.find((m) => m.VolunteerID === member.VolunteerID)?.MembershipType;
      await writeLog({ type: 'DEPARTMENT_ROLE_CHANGED', category: 'department_management', severity: 'INFO', metadata: { departmentId: deptId, departmentName: deptName, volunteerId: member.VolunteerID, oldRole, newRole: member.MembershipType, changeType: 'role_changed' } });
      loggedSubOperation = true;
    }
    if (!loggedSubOperation) {
      await writeLog({ type: 'DEPARTMENT_UPDATED', category: 'department_management', severity: 'INFO', metadata: { departmentId: deptId, departmentName: deptName, changeType } });
    }
  },
);

export const onEventWrite = onDocumentWritten(
  `${COLLECTIONS.events}/{eventId}`,
  async (event) => {
    const changeType = resolveChangeType(event);
    const afterData = event.data?.after?.data() as Record<string, unknown> | undefined;
    const beforeData = event.data?.before?.data() as Record<string, unknown> | undefined;
    const resolvedData = afterData ?? beforeData;
    const eventId = event.params.eventId;
    const eventName = (resolvedData?.['Name'] as string | undefined) ?? '';

    if (changeType === 'created') {
      await writeLog({ type: 'EVENT_CREATED', category: 'event_management', severity: 'INFO', metadata: { eventId, eventName, changeType } });
      return;
    }
    if (changeType === 'deleted') {
      await writeLog({ type: 'EVENT_DELETED', category: 'event_management', severity: 'INFO', metadata: { eventId, eventName, changeType } });
      return;
    }

    // changeType === 'updated' — detect sub-operations by comparing array fields
    const beforeGroups = (beforeData?.['AssignedGroups'] ?? []) as string[];
    const afterGroups = (afterData?.['AssignedGroups'] ?? []) as string[];
    const addedDepts = afterGroups.filter((id) => !beforeGroups.includes(id));
    const removedDepts = beforeGroups.filter((id) => !afterGroups.includes(id));

    const beforeScheduled = (beforeData?.['ScheduledVolunteers'] ?? []) as string[];
    const afterScheduled = (afterData?.['ScheduledVolunteers'] ?? []) as string[];
    const scheduledVolunteers = afterScheduled.filter((id) => !beforeScheduled.includes(id));
    const unscheduledVolunteers = beforeScheduled.filter((id) => !afterScheduled.includes(id));

    type RawStatus = { VolunteerID: string; TimeIn?: string; TimeOut?: string; AttendanceType?: string };
    const beforeStatuses = (beforeData?.['Statuses'] ?? []) as RawStatus[];
    const afterStatuses = (afterData?.['Statuses'] ?? []) as RawStatus[];

    const timedInStatuses = afterStatuses.filter((ast) => {
      const bst = beforeStatuses.find((s) => s.VolunteerID === ast.VolunteerID);
      return ast.TimeIn && (!bst || !bst.TimeIn);
    });
    const timedOutStatuses = afterStatuses.filter((ast) => {
      const bst = beforeStatuses.find((s) => s.VolunteerID === ast.VolunteerID);
      return ast.TimeOut && (!bst || !bst.TimeOut);
    });
    const attendanceUpdated = afterStatuses.filter((ast) => {
      const bst = beforeStatuses.find((s) => s.VolunteerID === ast.VolunteerID);
      return bst && ast.AttendanceType !== undefined && bst.AttendanceType !== ast.AttendanceType;
    });

    let loggedSubOperation = false;

    for (const deptId of addedDepts) {
      await writeLog({ type: 'EVENT_DEPARTMENT_ADDED', category: 'event_management', severity: 'INFO', metadata: { eventId, eventName, departmentId: deptId, changeType: 'department_added' } });
      loggedSubOperation = true;
    }
    for (const deptId of removedDepts) {
      await writeLog({ type: 'EVENT_DEPARTMENT_REMOVED', category: 'event_management', severity: 'INFO', metadata: { eventId, eventName, departmentId: deptId, changeType: 'department_removed' } });
      loggedSubOperation = true;
    }
    for (const volunteerId of scheduledVolunteers) {
      await writeLog({ type: 'VOLUNTEER_SCHEDULED', category: 'attendance', severity: 'INFO', metadata: { eventId, eventName, volunteerId, changeType: 'volunteer_scheduled' } });
      loggedSubOperation = true;
    }
    for (const volunteerId of unscheduledVolunteers) {
      await writeLog({ type: 'VOLUNTEER_UNSCHEDULED', category: 'attendance', severity: 'INFO', metadata: { eventId, eventName, volunteerId, changeType: 'volunteer_unscheduled' } });
      loggedSubOperation = true;
    }
    for (const status of timedInStatuses) {
      await writeLog({ type: 'VOLUNTEER_TIMED_IN', category: 'attendance', severity: 'INFO', metadata: { eventId, eventName, volunteerId: status.VolunteerID, timeIn: status.TimeIn ?? '' } });
      loggedSubOperation = true;
    }
    for (const status of timedOutStatuses) {
      await writeLog({ type: 'VOLUNTEER_TIMED_OUT', category: 'attendance', severity: 'INFO', metadata: { eventId, eventName, volunteerId: status.VolunteerID, timeOut: status.TimeOut ?? '' } });
      loggedSubOperation = true;
    }
    for (const status of attendanceUpdated) {
      await writeLog({ type: 'ATTENDANCE_STATUS_UPDATED', category: 'attendance', severity: 'INFO', metadata: { eventId, eventName, volunteerId: status.VolunteerID, attendanceType: status.AttendanceType ?? '' } });
      loggedSubOperation = true;
    }
    if (!loggedSubOperation) {
      await writeLog({ type: 'EVENT_UPDATED', category: 'event_management', severity: 'INFO', metadata: { eventId, eventName, changeType } });
    }
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

    const resolvedData = afterData ?? beforeData;
    await writeLog({
      type: logType,
      category: 'user_management',
      severity: 'INFO',
      metadata: {
        uid: event.params.uid,
        username: (resolvedData?.['username'] as string | undefined) ?? '',
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
