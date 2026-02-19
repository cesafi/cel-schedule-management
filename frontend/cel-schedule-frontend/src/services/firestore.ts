import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Volunteer, EventSchedule, Department } from '../types';

// Collection names - must match backend
const COLLECTIONS = {
  volunteers: 'volunteers',
  events: 'events',
  departments: 'departments',
  authUsers: 'auth_users',
  logs: 'logs',
} as const;

// Helper to convert Firestore data: PascalCase to camelCase + Timestamps to ISO strings
const convertFirestoreData = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => convertFirestoreData(item));
  }
  
  if (data !== null && typeof data === 'object') {
    const converted: any = {};
    Object.keys(data).forEach(key => {
      // Convert PascalCase to camelCase
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      converted[camelKey] = convertFirestoreData(data[key]);
    });
    return converted;
  }
  
  return data;
};

export const firestoreService = {
  // Volunteers
  volunteers: {
    async getAll(): Promise<Volunteer[]> {
      try {
        const q = query(
          collection(db, COLLECTIONS.volunteers),
          where('IsDisabled', '==', false)
        );
        const snapshot = await getDocs(q);
        const volunteers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...convertFirestoreData(doc.data())
        })) as Volunteer[];
        // Sort in-memory until indexes are ready
        return volunteers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } catch (error) {
        console.error('Error fetching volunteers from Firestore:', error);
        throw error;
      }
    },

    async getById(id: string): Promise<Volunteer> {
      try {
        const docRef = doc(db, COLLECTIONS.volunteers, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Volunteer not found');
        }

        return {
          id: docSnap.id,
          ...convertFirestoreData(docSnap.data())
        } as Volunteer;
      } catch (error) {
        console.error(`Error fetching volunteer ${id} from Firestore:`, error);
        throw error;
      }
    },
  },

  // Events
  events: {
    async getAll(): Promise<EventSchedule[]> {
      try {
        const q = query(
          collection(db, COLLECTIONS.events),
          where('IsDisabled', '==', false)
        );
        const snapshot = await getDocs(q);
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...convertFirestoreData(doc.data())
        })) as EventSchedule[];
        // Sort in-memory until indexes are ready
        return events.sort((a, b) => new Date(b.timeAndDate || 0).getTime() - new Date(a.timeAndDate || 0).getTime());
      } catch (error) {
        console.error('Error fetching events from Firestore:', error);
        throw error;
      }
    },

    async getById(id: string): Promise<EventSchedule> {
      try {
        const docRef = doc(db, COLLECTIONS.events, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          throw new Error('Event not found');
        }

        return {
          id: docSnap.id,
          ...convertFirestoreData(docSnap.data())
        } as EventSchedule;
      } catch (error) {
        console.error(`Error fetching event ${id} from Firestore:`, error);
        throw error;
      }
    },
  },

  // Departments
  departments: {
    async getAll(): Promise<Department[]> {
      try {
        console.log('[Firestore] Fetching all departments from collection:', COLLECTIONS.departments);
        
        const q = query(
          collection(db, COLLECTIONS.departments),
          where('IsDisabled', '==', false)
        );
        const snapshot = await getDocs(q);
        
        console.log('[Firestore] Found', snapshot.docs.length, 'departments');
        
        const departments = snapshot.docs.map(doc => {
          const dept = {
            id: doc.id,
            ...convertFirestoreData(doc.data())
          } as Department;
          console.log('[Firestore] Department ID:', doc.id, 'Name:', dept.departmentName);
          return dept;
        });
        
        // Sort in-memory until indexes are ready
        return departments.sort((a, b) => (a.departmentName || '').localeCompare(b.departmentName || ''));
      } catch (error) {
        console.error('Error fetching departments from Firestore:', error);
        throw error;
      }
    },

    async getById(id: string): Promise<Department> {
      try {
        console.log('[Firestore] Fetching department with ID:', id);
        console.log('[Firestore] Collection path:', COLLECTIONS.departments);
        
        const docRef = doc(db, COLLECTIONS.departments, id);
        const docSnap = await getDoc(docRef);
        
        console.log('[Firestore] Document exists:', docSnap.exists());
        
        if (!docSnap.exists()) {
          console.error('[Firestore] Department document not found. ID:', id);
          throw new Error(`Department not found with ID: ${id}`);
        }

        const rawData = docSnap.data();
        console.log('[Firestore] Raw document data:', rawData);
        
        const converted = {
          id: docSnap.id,
          ...convertFirestoreData(rawData)
        } as Department;
        
        console.log('[Firestore] Converted department:', converted);
        
        return converted;
      } catch (error) {
        console.error(`[Firestore] Error fetching department ${id}:`, error);
        if (error instanceof Error) {
          console.error('[Firestore] Error message:', error.message);
          console.error('[Firestore] Error stack:', error.stack);
        }
        throw error;
      }
    },
  },
};
