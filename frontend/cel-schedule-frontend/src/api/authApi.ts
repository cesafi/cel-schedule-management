import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  linkWithPopup,
  unlink,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  OAuthProvider,
  User,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  githubProvider,
  microsoftProvider,
} from '../config/firebase';
import type {
  AuthUser,
  LoginDTO,
  AuthUserCreateDTO,
  AuthUserUpdateDTO,
  UserProfile,
} from '../types';
import { AccessLevel } from '../types';
import { firestoreService } from '../services/firestore';
import { clientWriteLog } from '../utils/clientLog';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDERS: Record<string, OAuthProvider | typeof googleProvider | typeof githubProvider> = {
  'google.com': googleProvider,
  'github.com': githubProvider,
  'microsoft.com': microsoftProvider,
};

const IDENTITY_TOOLKIT_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a Firebase Auth account via the Identity Toolkit REST API.
 * Uses a direct fetch so the current admin session is NOT replaced by the
 * new user's session (unlike createUserWithEmailAndPassword from the SDK).
 * Returns the new Firebase UID.
 */
const createFirebaseAuthUser = async (
  email: string,
  password: string,
  displayName: string,
): Promise<string> => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string;
  const resp = await fetch(`${IDENTITY_TOOLKIT_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
  });
  const data = await resp.json() as Record<string, unknown>;
  if (!resp.ok) {
    const msg = (data['error'] as Record<string, unknown>)?.['message'] as string | undefined;
    throw new Error(msg ?? 'Failed to create Firebase Auth user');
  }
  return data['localId'] as string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build an AuthUser from a Firebase User + their Firestore UserProfile.
 * Custom claims carry accessLevel and volunteerId so we do not need a
 * round-trip to Firestore on every auth check.
 */
export async function buildAuthUser(firebaseUser: User): Promise<AuthUser> {
  const tokenResult = await firebaseUser.getIdTokenResult(/* forceRefresh */ false);
  const claims = tokenResult.claims as { accessLevel?: number; volunteerId?: string };

  // Firestore profile has the display username and may have fresher claims
  let profile: UserProfile | null = null;
  try {
    profile = await firestoreService.users.getById(firebaseUser.uid);
  } catch {
    // Profile may not exist yet (e.g. right after account creation)
  }

  const accessLevel: AccessLevel =
    (claims.accessLevel as AccessLevel) ??
    (profile?.accessLevel as AccessLevel) ??
    AccessLevel.DEPTHEAD;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    username: profile?.username ?? firebaseUser.displayName ?? firebaseUser.email ?? '',
    volunteerId: (claims.volunteerId as string) ?? profile?.volunteerId ?? '',
    accessLevel,
    providers: firebaseUser.providerData.map((p) => p.providerId),
    createdAt: profile?.createdAt ?? firebaseUser.metadata.creationTime ?? '',
    lastUpdated: profile?.lastUpdated ?? firebaseUser.metadata.lastSignInTime ?? '',
    isDisabled: profile?.isDisabled ?? false,
  };
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  // -------------------------------------------------------------------------
  // Email / password login
  // -------------------------------------------------------------------------
  async login(credentials: LoginDTO): Promise<AuthUser> {
    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );
      const authUser = await buildAuthUser(user);
      await clientWriteLog({
        type: 'USER_LOGIN',
        category: 'authentication',
        severity: 'INFO',
        metadata: { uid: user.uid, email: user.email ?? '', username: authUser.username },
      });
      return authUser;
    } catch (err) {
      await clientWriteLog({
        type: 'USER_LOGIN_FAILED',
        category: 'authentication',
        severity: 'WARNING',
        metadata: { email: credentials.email, error: (err as Error).message ?? 'Unknown error' },
      });
      throw err;
    }
  },

  // -------------------------------------------------------------------------
  // OAuth sign-in via popup — no redirect, no server secret needed
  // -------------------------------------------------------------------------
  async loginWithProvider(
    providerId: 'google.com' | 'github.com' | 'microsoft.com',
  ): Promise<AuthUser> {
    const provider = PROVIDERS[providerId];
    if (!provider) throw new Error(`Unsupported provider: ${providerId}`);
    const { user } = await signInWithPopup(auth, provider);
    const authUser = await buildAuthUser(user);
    await clientWriteLog({
      type: 'OAUTH_LOGIN',
      category: 'authentication',
      severity: 'INFO',
      metadata: { uid: user.uid, email: user.email ?? '', provider: providerId },
    });
    return authUser;
  },

  // -------------------------------------------------------------------------
  // Link an additional OAuth provider to the current account
  // -------------------------------------------------------------------------
  async linkProvider(
    providerId: 'google.com' | 'github.com' | 'microsoft.com',
  ): Promise<AuthUser> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');
    const provider = PROVIDERS[providerId];
    if (!provider) throw new Error(`Unsupported provider: ${providerId}`);
    const { user } = await linkWithPopup(currentUser, provider);
    const authUser = await buildAuthUser(user);
    await clientWriteLog({
      type: 'OAUTH_LINKED',
      category: 'authentication',
      severity: 'INFO',
      metadata: { uid: user.uid, email: user.email ?? '', provider: providerId },
    });
    return authUser;
  },

  // -------------------------------------------------------------------------
  // Unlink an OAuth provider from the current account
  // -------------------------------------------------------------------------
  async unlinkProvider(providerId: string): Promise<AuthUser> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');
    const user = await unlink(currentUser, providerId);
    return buildAuthUser(user);
  },

  // -------------------------------------------------------------------------
  // Change password (requires re-authentication)
  // -------------------------------------------------------------------------
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error('Not authenticated');
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
    await clientWriteLog({
      type: 'PASSWORD_CHANGED',
      category: 'user_management',
      severity: 'INFO',
      metadata: { uid: currentUser.uid, email: currentUser.email },
    });
  },

  // -------------------------------------------------------------------------
  // Sign out
  // -------------------------------------------------------------------------
  async logout(): Promise<void> {
    const currentUser = auth.currentUser;
    const uid = currentUser?.uid ?? '';
    const email = currentUser?.email ?? '';
    await signOut(auth);
    await clientWriteLog({
      type: 'USER_LOGOUT',
      category: 'authentication',
      severity: 'INFO',
      metadata: { uid, email },
    });
  },

  // -------------------------------------------------------------------------
  // Get current user (reads from Firebase Auth + Firestore profile)
  // -------------------------------------------------------------------------
  async getCurrentUser(): Promise<AuthUser | null> {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return buildAuthUser(currentUser);
  },

  // -------------------------------------------------------------------------
  // Force-refresh the ID token (use after admin updates custom claims)
  // -------------------------------------------------------------------------
  async refreshToken(): Promise<void> {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(/* forceRefresh */ true);
    }
  },

  // -------------------------------------------------------------------------
  // Admin-only: Create a new auth user via Firebase Identity Toolkit REST API
  // + Firestore profile. No Cloud Function / Blaze plan required.
  // -------------------------------------------------------------------------
  async createUser(data: AuthUserCreateDTO): Promise<{ uid: string }> {
    const uid = await createFirebaseAuthUser(data.email, data.password, data.username);
    await firestoreService.users.create(uid, {
      email: data.email,
      username: data.username,
      volunteerId: data.volunteerId,
      accessLevel: data.accessLevel,
      isDisabled: false,
    });
    await clientWriteLog({
      type: 'USER_CREATED',
      category: 'user_management',
      severity: 'INFO',
      metadata: { uid, email: data.email, username: data.username, accessLevel: data.accessLevel },
    });
    return { uid };
  },

  // -------------------------------------------------------------------------
  // Admin-only: Update an existing user's Firestore profile.
  // Note: password changes of other users require the Firebase Admin SDK
  // (server-side only). Use the create-admin script for password resets.
  // -------------------------------------------------------------------------
  async updateUser(uid: string, data: AuthUserUpdateDTO): Promise<void> {
    const profileUpdate: Partial<Omit<UserProfile, 'uid'>> = {};
    if (data.accessLevel !== undefined) profileUpdate.accessLevel = data.accessLevel;
    if (data.isDisabled !== undefined) profileUpdate.isDisabled = data.isDisabled;
    if (data.username !== undefined) profileUpdate.username = data.username;
    if (Object.keys(profileUpdate).length > 0) {
      await firestoreService.users.update(uid, profileUpdate);
    }

    let logType = 'USER_UPDATED';
    if (data.isDisabled === true) logType = 'USER_DISABLED';
    else if (data.isDisabled === false) logType = 'USER_ENABLED';
    else if (data.accessLevel !== undefined) logType = 'ACCESS_LEVEL_CHANGED';

    await clientWriteLog({
      type: logType,
      category: 'user_management',
      severity: 'INFO',
      metadata: { uid, ...(data.accessLevel !== undefined ? { accessLevel: data.accessLevel } : {}), ...(data.isDisabled !== undefined ? { isDisabled: data.isDisabled } : {}) },
    });
  },

  // -------------------------------------------------------------------------
  // Admin-only: List all users from the Firestore users collection.
  // -------------------------------------------------------------------------
  async listUsers(): Promise<AuthUser[]> {
    const profiles = await firestoreService.users.getAll();
    return profiles.map((p) => ({
      id: p.uid,
      email: p.email,
      username: p.username,
      volunteerId: p.volunteerId,
      accessLevel: p.accessLevel,
      providers: [],
      createdAt: p.createdAt,
      lastUpdated: p.lastUpdated,
      isDisabled: p.isDisabled,
    }));
  },
};
