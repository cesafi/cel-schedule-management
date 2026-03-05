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
import { httpsCallable } from 'firebase/functions';
import {
  auth,
  functions,
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDERS: Record<string, OAuthProvider | typeof googleProvider | typeof githubProvider> = {
  'google.com': googleProvider,
  'github.com': githubProvider,
  'microsoft.com': microsoftProvider,
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
    const { user } = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password,
    );
    return buildAuthUser(user);
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
    return buildAuthUser(user);
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
    return buildAuthUser(user);
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
  },

  // -------------------------------------------------------------------------
  // Sign out
  // -------------------------------------------------------------------------
  async logout(): Promise<void> {
    await signOut(auth);
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
  // Admin-only: Create a new auth user via Cloud Function
  // -------------------------------------------------------------------------
  async createUser(data: AuthUserCreateDTO): Promise<{ uid: string }> {
    const fn = httpsCallable<AuthUserCreateDTO, { uid: string }>(functions, 'createAuthUser');
    const result = await fn(data);
    return result.data;
  },

  // -------------------------------------------------------------------------
  // Admin-only: Update an existing auth user via Cloud Function
  // -------------------------------------------------------------------------
  async updateUser(uid: string, data: AuthUserUpdateDTO): Promise<void> {
    const fn = httpsCallable<{ uid: string } & AuthUserUpdateDTO, void>(
      functions,
      'updateAuthUser',
    );
    await fn({ uid, ...data });
  },

  // -------------------------------------------------------------------------
  // Admin-only: List all auth users via Cloud Function
  // -------------------------------------------------------------------------
  async listUsers(): Promise<AuthUser[]> {
    const fn = httpsCallable<void, AuthUser[]>(functions, 'listAuthUsers');
    const result = await fn();
    return result.data;
  },
};
