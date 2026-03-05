import { AccessLevel } from './enums';

// Auth User types

/**
 * The authenticated user shape used throughout the application.
 * id      = Firebase UID
 * email   = Firebase Auth email
 * username = display name stored in Firestore users/{uid}
 * accessLevel = from Firebase Auth custom claims
 * providers = list of sign-in providers linked to the account
 */
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  volunteerId: string;
  accessLevel: AccessLevel;
  providers: string[];
  createdAt: string;
  lastUpdated: string;
  isDisabled: boolean;
}

/**
 * Shape of the Firestore document at users/{uid}.
 * Custom claims (accessLevel, volunteerId) are mirrored here
 * so the app can read them without waiting for a token refresh.
 */
export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  volunteerId: string;
  accessLevel: AccessLevel;
  isDisabled: boolean;
  createdAt: string;
  lastUpdated: string;
}

/** DTO used by the admin "Create User" callable Cloud Function. */
export interface AuthUserCreateDTO {
  email: string;
  password: string;
  username: string;
  volunteerId: string;
  accessLevel: AccessLevel;
}

/** DTO used by the admin "Update User" callable Cloud Function. */
export interface AuthUserUpdateDTO {
  password?: string;
  accessLevel?: AccessLevel;
  isDisabled?: boolean;
  username?: string;
}

/** Credentials for email + password sign-in. */
export interface LoginDTO {
  email: string;
  password: string;
}

// Legacy – kept so any imports that reference LoginResponse still compile
// while being migrated. Remove once all usages are gone.
export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  accessLevel: AccessLevel;
  expiresAt: string;
}
