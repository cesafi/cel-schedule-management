import { AccessLevel } from './enums';

// Auth User types

export interface AuthUser {
  id: string;
  username: string;
  volunteerId: string;
  accessLevel: AccessLevel;
  thirdPartyAuthToken?: string;
  createdAt: string;
  updatedAt: string;
  isDisabled: boolean;
}

export interface AuthUserCreateDTO {
  username: string;
  password: string;
  volunteerId: string;
  accessLevel: AccessLevel;
  thirdPartyAuthToken?: string;
}

export interface AuthUserUpdateDTO {
  password?: string;
  accessLevel?: AccessLevel;
  thirdPartyAuthToken?: string;
  isDisabled?: boolean;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  accessLevel: AccessLevel;
  expiresAt: string;
}
