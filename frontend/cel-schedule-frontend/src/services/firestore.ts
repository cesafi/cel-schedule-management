import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Volunteer, EventSchedule, Department } from '../types';
import type { UserProfile } from '../types/authUser';
import type {
  VolunteerCreateDTO,
  VolunteerUpdateDTO,
} from '../types/volunteer';
import type {
  DepartmentCreateDTO,
  DepartmentUpdateDTO,
  AddMemberDTO,
  UpdateMemberDTO,
} from '../types/department';
import type {
  EventCreateDTO,
  EventUpdateDTO,
  AddStatusDTO,
  UpdateStatusDTO,
  TimeInDTO,
  TimeOutDTO,
} from '../types/event';

// ---------------------------------------------------------------------------
// Collection names — must match Firestore exactly
// ---------------------------------------------------------------------------
const COLLECTIONS = {
  volunteers: 'volunteers',
  events: 'events',
  departments: 'departments',
  users: 'users',          // replaces auth_users — stores UserProfile per UID
  logs: 'logs',
} as const;

// ---------------------------------------------------------------------------
// Helper: convert Firestore doc data (PascalCase keys → camelCase, Timestamps → ISO)
// ---------------------------------------------------------------------------
const convertFirestoreData = (data: unknown): unknown => {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (Array.isArray(data)) {
    return data.map((item) => convertFirestoreData(item));
  }
  if (data !== null && typeof data === 'object') {
    const converted: Record<string, unknown> = {};
    Object.keys(data as object).forEach((key) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      converted[camelKey] = convertFirestoreData((data as Record<string, unknown>)[key]);
    });
    return converted;
  }
  return data;
};

// ---------------------------------------------------------------------------
// Helper: build a Firestore timestamp-aware update payload
// ---------------------------------------------------------------------------
const withTimestamps = <T extends object>(data: T) => ({
  ...data,
  LastUpdated: serverTimestamp(),
});

const withCreationTimestamps = <T extends object>(data: T) => ({
  ...data,
  CreatedAt: serverTimestamp(),
  LastUpdated: serverTimestamp(),
  IsDisabled: false,
});

// ---------------------------------------------------------------------------
// firestoreService
// ---------------------------------------------------------------------------
export const firestoreService = {

  // ==========================================================================
  // Users (replaces auth_users — stores UserProfile per Firebase UID)
  // ==========================================================================
  users: {
    async getById(uid: string): Promise<UserProfile> {
      const docRef = doc(db, COLLECTIONS.users, uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error(`User profile not found: ${uid}`);
      return {
        uid: snap.id,
        ...(convertFirestoreData(snap.data()) as Omit<UserProfile, 'uid'>),
      } as UserProfile;
    },

    async create(uid: string, profile: Omit<UserProfile, 'uid' | 'createdAt' | 'lastUpdated'>): Promise<void> {
      const docRef = doc(db, COLLECTIONS.users, uid);
      await setDoc(docRef, withCreationTimestamps(profile));
    },

    async update(uid: string, data: Partial<Omit<UserProfile, 'uid'>>): Promise<void> {
      const docRef = doc(db, COLLECTIONS.users, uid);
      await updateDoc(docRef, withTimestamps(data));
    },
  },

  // ==========================================================================
  // Volunteers
  // ==========================================================================
  volunteers: {
    async getAll(): Promise<Volunteer[]> {
      const q = query(
        collection(db, COLLECTIONS.volunteers),
        where('IsDisabled', '==', false),
      );
      const snapshot = await getDocs(q);
      const volunteers = snapshot.docs.map((d) => ({
        id: d.id,
        ...(convertFirestoreData(d.data()) as Omit<Volunteer, 'id'>),
      })) as Volunteer[];
      return volunteers.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    },

    /** Fetch all volunteers including soft-deleted ones (admin only) */
    async getAllIncludingDisabled(): Promise<Volunteer[]> {
      const snapshot = await getDocs(collection(db, COLLECTIONS.volunteers));
      const volunteers = snapshot.docs.map((d) => ({
        id: d.id,
        ...(convertFirestoreData(d.data()) as Omit<Volunteer, 'id'>),
      })) as Volunteer[];
      return volunteers.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    },

    async getById(id: string): Promise<Volunteer> {
      const docRef = doc(db, COLLECTIONS.volunteers, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Volunteer not found');
      return { id: snap.id, ...(convertFirestoreData(snap.data()) as Omit<Volunteer, 'id'>) } as Volunteer;
    },

    async create(data: VolunteerCreateDTO): Promise<Volunteer> {
      const ref: DocumentReference = await addDoc(
        collection(db, COLLECTIONS.volunteers),
        withCreationTimestamps({ Name: data.name }),
      );
      return firestoreService.volunteers.getById(ref.id);
    },

    async update(id: string, data: VolunteerUpdateDTO): Promise<Volunteer> {
      const docRef = doc(db, COLLECTIONS.volunteers, id);
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload['Name'] = data.name;
      if (data.isDisabled !== undefined) payload['IsDisabled'] = data.isDisabled;
      await updateDoc(docRef, withTimestamps(payload));
      return firestoreService.volunteers.getById(id);
    },

    /** Soft-delete — sets IsDisabled = true */
    async delete(id: string): Promise<void> {
      const docRef = doc(db, COLLECTIONS.volunteers, id);
      await updateDoc(docRef, withTimestamps({ IsDisabled: true }));
    },

    /** Restore — sets IsDisabled = false */
    async restore(id: string): Promise<void> {
      const docRef = doc(db, COLLECTIONS.volunteers, id);
      await updateDoc(docRef, withTimestamps({ IsDisabled: false }));
    },

    /** Hard delete — permanently removes the document from Firestore */
    async hardDelete(id: string): Promise<void> {
      const docRef = doc(db, COLLECTIONS.volunteers, id);
      await deleteDoc(docRef);
    },
  },

  // ==========================================================================
  // Departments
  // ==========================================================================
  departments: {
    async getAll(): Promise<Department[]> {
      const q = query(
        collection(db, COLLECTIONS.departments),
        where('IsDisabled', '==', false),
      );
      const snapshot = await getDocs(q);
      const departments = snapshot.docs.map((d) => ({
        id: d.id,
        ...(convertFirestoreData(d.data()) as Omit<Department, 'id'>),
      })) as Department[];
      return departments.sort((a, b) =>
        (a.departmentName ?? '').localeCompare(b.departmentName ?? ''),
      );
    },

    /** Fetch all departments including soft-deleted ones (admin only) */
    async getAllIncludingDisabled(): Promise<Department[]> {
      const snapshot = await getDocs(collection(db, COLLECTIONS.departments));
      const departments = snapshot.docs.map((d) => ({
        id: d.id,
        ...(convertFirestoreData(d.data()) as Omit<Department, 'id'>),
      })) as Department[];
      return departments.sort((a, b) =>
        (a.departmentName ?? '').localeCompare(b.departmentName ?? ''),
      );
    },

    async getById(id: string): Promise<Department> {
      const docRef = doc(db, COLLECTIONS.departments, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error(`Department not found: ${id}`);
      return {
        id: snap.id,
        ...(convertFirestoreData(snap.data()) as Omit<Department, 'id'>),
      } as Department;
    },

    async create(data: DepartmentCreateDTO): Promise<Department> {
      const now = new Date().toISOString();
      const ref: DocumentReference = await addDoc(
        collection(db, COLLECTIONS.departments),
        withCreationTimestamps({
          DepartmentName: data.departmentName,
          VolunteerMembers: [
            {
              VolunteerID: data.initialHeadId,
              JoinedDate: now,
              MembershipType: 'HEAD',
              LastUpdated: now,
            },
          ],
        }),
      );
      return firestoreService.departments.getById(ref.id);
    },

    async update(id: string, data: DepartmentUpdateDTO): Promise<Department> {
      const docRef = doc(db, COLLECTIONS.departments, id);
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload['DepartmentName'] = data.name;
      if (data.isDisabled !== undefined) payload['IsDisabled'] = data.isDisabled;
      await updateDoc(docRef, withTimestamps(payload));
      return firestoreService.departments.getById(id);
    },

    /** Soft-delete */
    async delete(id: string): Promise<void> {
      const docRef = doc(db, COLLECTIONS.departments, id);
      await updateDoc(docRef, withTimestamps({ IsDisabled: true }));
    },

    /** Restore — sets IsDisabled = false */
    async restore(id: string): Promise<void> {
      const docRef = doc(db, COLLECTIONS.departments, id);
      await updateDoc(docRef, withTimestamps({ IsDisabled: false }));
    },

    /** Hard delete — permanently removes the document from Firestore */
    async hardDelete(id: string): Promise<void> {
      const docRef = doc(db, COLLECTIONS.departments, id);
      await deleteDoc(docRef);
    },

    async addMember(deptId: string, data: AddMemberDTO): Promise<Department> {
      const docRef = doc(db, COLLECTIONS.departments, deptId);
      const now = new Date().toISOString();
      await updateDoc(docRef, {
        VolunteerMembers: arrayUnion({
          VolunteerID: data.volunteerId,
          JoinedDate: now,
          MembershipType: data.membershipType,
          LastUpdated: now,
        }),
        LastUpdated: serverTimestamp(),
      });
      return firestoreService.departments.getById(deptId);
    },

    async updateMember(
      deptId: string,
      volunteerId: string,
      data: UpdateMemberDTO,
    ): Promise<Department> {
      const dept = await firestoreService.departments.getById(deptId);
      const now = new Date().toISOString();
      const updatedMembers = (dept.volunteerMembers ?? []).map((m) =>
        m.volunteerID === volunteerId
          ? { ...m, membershipType: data.membershipType, lastUpdated: now }
          : m,
      );
      // Re-map to PascalCase for Firestore
      const docRef = doc(db, COLLECTIONS.departments, deptId);
      await updateDoc(docRef, {
        VolunteerMembers: updatedMembers.map((m) => ({
          VolunteerID: m.volunteerID,
          JoinedDate: m.joinedDate,
          MembershipType: m.membershipType,
          LastUpdated: m.lastUpdated,
        })),
        LastUpdated: serverTimestamp(),
      });
      return firestoreService.departments.getById(deptId);
    },

    async removeMember(deptId: string, volunteerId: string): Promise<void> {
      const dept = await firestoreService.departments.getById(deptId);
      const memberToRemove = (dept.volunteerMembers ?? []).find(
        (m) => m.volunteerID === volunteerId,
      );
      if (!memberToRemove) return;
      const docRef = doc(db, COLLECTIONS.departments, deptId);
      // arrayRemove requires exact match — use full object with original casing from Firestore
      const snap = await getDoc(docRef);
      const raw = snap.data()?.VolunteerMembers ?? [];
      const toRemove = raw.find(
        (m: Record<string, unknown>) => m['VolunteerID'] === volunteerId,
      );
      if (toRemove) {
        await updateDoc(docRef, {
          VolunteerMembers: arrayRemove(toRemove),
          LastUpdated: serverTimestamp(),
        });
      }
    },
  },

  // ==========================================================================
  // Events
  // ==========================================================================
  events: {
    async getAll(): Promise<EventSchedule[]> {
      const q = query(
        collection(db, COLLECTIONS.events),
        where('IsDisabled', '==', false),
      );
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map((d) => ({
        id: d.id,
        ...(convertFirestoreData(d.data()) as Omit<EventSchedule, 'id'>),
      })) as EventSchedule[];
      return events.sort(
        (a, b) =>
          new Date(b.timeAndDate ?? 0).getTime() - new Date(a.timeAndDate ?? 0).getTime(),
      );
    },

    /** Fetch all events including soft-deleted ones (admin only) */
    async getAllIncludingDisabled(): Promise<EventSchedule[]> {
      const snapshot = await getDocs(collection(db, COLLECTIONS.events));
      const events = snapshot.docs.map((d) => ({
        id: d.id,
        ...(convertFirestoreData(d.data()) as Omit<EventSchedule, 'id'>),
      })) as EventSchedule[];
      return events.sort(
        (a, b) =>
          new Date(b.timeAndDate ?? 0).getTime() - new Date(a.timeAndDate ?? 0).getTime(),
      );
    },

    async getById(id: string): Promise<EventSchedule> {
      const docRef = doc(db, COLLECTIONS.events, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Event not found');
      return { id: snap.id, ...(convertFirestoreData(snap.data()) as Omit<EventSchedule, 'id'>) } as EventSchedule;
    },

    async create(data: EventCreateDTO): Promise<EventSchedule> {
      const ref: DocumentReference = await addDoc(
        collection(db, COLLECTIONS.events),
        withCreationTimestamps({
          Name: data.name,
          Description: data.description,
          TimeAndDate: data.timeAndDate,
          Location: data.location ?? null,
          ScheduledVolunteers: data.scheduledVolunteers ?? [],
          VoluntaryVolunteers: data.voluntaryVolunteers ?? [],
          AssignedGroups: data.assignedGroups ?? [],
          Statuses: [],
        }),
      );
      return firestoreService.events.getById(ref.id);
    },

    async update(id: string, data: EventUpdateDTO): Promise<EventSchedule> {
      const docRef = doc(db, COLLECTIONS.events, id);
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload['Name'] = data.name;
      if (data.description !== undefined) payload['Description'] = data.description;
      if (data.timeAndDate !== undefined) payload['TimeAndDate'] = data.timeAndDate;
      if (data.location !== undefined) payload['Location'] = data.location;
      if (data.scheduledVolunteers !== undefined) payload['ScheduledVolunteers'] = data.scheduledVolunteers;
      if (data.voluntaryVolunteers !== undefined) payload['VoluntaryVolunteers'] = data.voluntaryVolunteers;
      if (data.assignedGroups !== undefined) payload['AssignedGroups'] = data.assignedGroups;
      if (data.isDisabled !== undefined) payload['IsDisabled'] = data.isDisabled;
      await updateDoc(docRef, withTimestamps(payload));
      return firestoreService.events.getById(id);
    },

    /** Soft-delete */
    async delete(id: string): Promise<void> {
      const docRef = doc(db, COLLECTIONS.events, id);
      await updateDoc(docRef, withTimestamps({ IsDisabled: true }));
    },

    /** Restore — sets IsDisabled = false */
    async restore(id: string): Promise<void> {
      const docRef = doc(db, COLLECTIONS.events, id);
      await updateDoc(docRef, withTimestamps({ IsDisabled: false }));
    },

    /** Hard delete — permanently removes the document from Firestore */
    async hardDelete(id: string): Promise<void> {
      const docRef = doc(db, COLLECTIONS.events, id);
      await deleteDoc(docRef);
    },

    async addStatus(eventId: string, data: AddStatusDTO): Promise<EventSchedule> {
      const docRef = doc(db, COLLECTIONS.events, eventId);
      await updateDoc(docRef, {
        ScheduledVolunteers: arrayUnion(data.volunteerID),
        Statuses: arrayUnion({
          VolunteerID: data.volunteerID,
          AssignedAt: new Date().toISOString(),
        }),
        LastUpdated: serverTimestamp(),
      });
      return firestoreService.events.getById(eventId);
    },

    async updateStatus(
      eventId: string,
      volunteerId: string,
      data: UpdateStatusDTO,
    ): Promise<EventSchedule> {
      const event = await firestoreService.events.getById(eventId);
      const snap = await getDoc(doc(db, COLLECTIONS.events, eventId));
      const rawStatuses: Record<string, unknown>[] = snap.data()?.Statuses ?? [];
      const updatedStatuses = rawStatuses.map((s) =>
        s['VolunteerID'] === volunteerId
          ? {
              ...s,
              ...(data.timeIn !== undefined ? { TimeIn: data.timeIn } : {}),
              ...(data.attendanceType !== undefined ? { AttendanceType: data.attendanceType } : {}),
              ...(data.timeOut !== undefined ? { TimeOut: data.timeOut } : {}),
            }
          : s,
      );
      // Touch to suppress unused var warning
      void event;
      await updateDoc(doc(db, COLLECTIONS.events, eventId), {
        Statuses: updatedStatuses,
        LastUpdated: serverTimestamp(),
      });
      return firestoreService.events.getById(eventId);
    },

    async timeIn(eventId: string, volunteerId: string, data: TimeInDTO): Promise<void> {
      const snap = await getDoc(doc(db, COLLECTIONS.events, eventId));
      const rawStatuses: Record<string, unknown>[] = snap.data()?.Statuses ?? [];
      const updatedStatuses = rawStatuses.map((s) =>
        s['VolunteerID'] === volunteerId
          ? { ...s, TimeIn: data.timeIn ?? new Date().toISOString(), TimeInType: data.timeInType }
          : s,
      );
      await updateDoc(doc(db, COLLECTIONS.events, eventId), {
        Statuses: updatedStatuses,
        LastUpdated: serverTimestamp(),
      });
    },

    async timeOut(eventId: string, volunteerId: string, data: TimeOutDTO): Promise<void> {
      const snap = await getDoc(doc(db, COLLECTIONS.events, eventId));
      const rawStatuses: Record<string, unknown>[] = snap.data()?.Statuses ?? [];
      const updatedStatuses = rawStatuses.map((s) =>
        s['VolunteerID'] === volunteerId
          ? { ...s, TimeOut: data.timeOut ?? new Date().toISOString(), TimeOutType: data.timeOutType }
          : s,
      );
      await updateDoc(doc(db, COLLECTIONS.events, eventId), {
        Statuses: updatedStatuses,
        LastUpdated: serverTimestamp(),
      });
    },

    async addDepartments(eventId: string, departmentIds: string[]): Promise<void> {
      const docRef = doc(db, COLLECTIONS.events, eventId);
      await updateDoc(docRef, {
        AssignedGroups: arrayUnion(...departmentIds),
        LastUpdated: serverTimestamp(),
      });
    },

    async removeDepartment(eventId: string, departmentId: string): Promise<void> {
      const docRef = doc(db, COLLECTIONS.events, eventId);
      await updateDoc(docRef, {
        AssignedGroups: arrayRemove(departmentId),
        LastUpdated: serverTimestamp(),
      });
    },

    async removeVolunteer(eventId: string, volunteerId: string): Promise<void> {
      const snap = await getDoc(doc(db, COLLECTIONS.events, eventId));
      const rawStatuses: Record<string, unknown>[] = snap.data()?.Statuses ?? [];
      const toRemove = rawStatuses.find((s) => s['VolunteerID'] === volunteerId);
      const updates: Record<string, unknown> = {
        ScheduledVolunteers: arrayRemove(volunteerId),
        VoluntaryVolunteers: arrayRemove(volunteerId),
        LastUpdated: serverTimestamp(),
      };
      if (toRemove) updates['Statuses'] = arrayRemove(toRemove);
      await updateDoc(doc(db, COLLECTIONS.events, eventId), updates);
    },

    /** Returns all events where a given volunteer has a status entry */
    async getStatusHistoryForVolunteer(volunteerId: string): Promise<EventSchedule[]> {
      const q = query(
        collection(db, COLLECTIONS.events),
        where('ScheduledVolunteers', 'array-contains', volunteerId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(convertFirestoreData(d.data()) as Omit<EventSchedule, 'id'>),
        })) as EventSchedule[];
    },

    /** Returns all events that have a given department in AssignedGroups */
    async getStatusHistoryForDepartment(departmentId: string): Promise<EventSchedule[]> {
      const q = query(
        collection(db, COLLECTIONS.events),
        where('AssignedGroups', 'array-contains', departmentId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(convertFirestoreData(d.data()) as Omit<EventSchedule, 'id'>),
        })) as EventSchedule[];
    },
  },

  // ==========================================================================
  // Logs (admin read-only via Firestore Security Rules)
  // Writes happen through Cloud Function onWrite triggers automatically.
  // ==========================================================================
  logs: {
    async getAll(filters?: {
      logType?: string;
      volunteerId?: string;
      eventId?: string;
      departmentId?: string;
      includeArchived?: boolean;
      limit?: number;
    }) {
      const constraints = [];
      if (!filters?.includeArchived) {
        constraints.push(where('IsArchived', '==', false));
      }
      if (filters?.logType) constraints.push(where('Type', '==', filters.logType));
      constraints.push(orderBy('TimeDetected', 'desc'));

      const q = query(collection(db, COLLECTIONS.logs), ...constraints);
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map((d) => ({
        id: d.id,
        ...(convertFirestoreData(d.data()) as object),
      }));
      // Client-side entity-scoped filtering (Cloud Function triggers tag these fields)
      let filtered = logs as Array<Record<string, unknown>>;
      if (filters?.volunteerId) {
        filtered = filtered.filter(
          (l) => (l['metadata'] as Record<string, unknown>)?.['volunteerId'] === filters.volunteerId,
        );
      }
      if (filters?.eventId) {
        filtered = filtered.filter(
          (l) => (l['metadata'] as Record<string, unknown>)?.['eventId'] === filters.eventId,
        );
      }
      if (filters?.departmentId) {
        filtered = filtered.filter(
          (l) =>
            (l['metadata'] as Record<string, unknown>)?.['departmentId'] === filters.departmentId,
        );
      }
      const limit = filters?.limit ?? 200;
      return filtered.slice(0, limit);
    },

    async getArchivedLogs() {
      const q = query(
        collection(db, COLLECTIONS.logs),
        where('IsArchived', '==', true),
        orderBy('TimeDetected', 'desc'),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...(convertFirestoreData(d.data()) as object) }));
    },

    async getStats() {
      const q = query(collection(db, COLLECTIONS.logs), where('IsArchived', '==', false));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map((d) => d.data() as Record<string, unknown>);
      const byType: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      let archived = 0;
      for (const l of logs) {
        if (l['Type']) byType[l['Type'] as string] = (byType[l['Type'] as string] ?? 0) + 1;
        if (l['Category']) byCategory[l['Category'] as string] = (byCategory[l['Category'] as string] ?? 0) + 1;
        if (l['Severity']) bySeverity[l['Severity'] as string] = (bySeverity[l['Severity'] as string] ?? 0) + 1;
        if (l['IsArchived']) archived++;
      }
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentLogs = logs.filter((l) => {
        const t = l['TimeDetected'];
        if (t instanceof Timestamp) return t.toMillis() > oneWeekAgo;
        return false;
      }).length;
      return { totalLogs: logs.length, byType, byCategory, bySeverity, archived, recentLogs };
    },
  },

  // ==========================================================================
  // Batch write helper
  // ==========================================================================
  batch: {
    /** Executes multiple creates atomically using Firestore batched writes (max 500 ops). */
    async batchCreate(
      operations: Array<{ collectionPath: string; data: Record<string, unknown> }>,
    ): Promise<string[]> {
      const ids: string[] = [];
      // Firestore allows max 500 writes per batch
      const BATCH_LIMIT = 500;
      for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
        const chunk = operations.slice(i, i + BATCH_LIMIT);
        const batch = writeBatch(db);
        for (const op of chunk) {
          const ref = doc(collection(db, op.collectionPath));
          batch.set(ref, withCreationTimestamps(op.data));
          ids.push(ref.id);
        }
        await batch.commit();
      }
      return ids;
    },
  },
};

