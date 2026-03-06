/**
 * clientWriteLog
 *
 * Writes audit log entries directly to the Firestore `logs` collection from
 * the browser client.  Used for events that never touch a Firestore document
 * write and therefore cannot be caught by Cloud Function onWrite triggers
 * (e.g. Firebase Auth sign-in/out, batch import lifecycle).
 *
 * Field names are kept in PascalCase to match the existing schema written by
 * the Cloud Functions and the legacy Go backend.
 *
 * Failures are non-fatal — logged as console warnings so they never break
 * the UI operation that triggered them.
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOG_COLLECTION = 'logs' as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClientLogEntry {
  type: string;
  category: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const clientWriteLog = async (entry: ClientLogEntry): Promise<void> => {
  const now = Timestamp.now();
  try {
    await addDoc(collection(db, LOG_COLLECTION), {
      Type: entry.type,
      Category: entry.category,
      Severity: entry.severity,
      Metadata: entry.metadata,
      TimeDetected: now,
      IsArchived: false,
      LastUpdated: now,
    });
  } catch (err) {
    console.warn('[clientWriteLog] Failed to write audit log:', err);
  }
};
