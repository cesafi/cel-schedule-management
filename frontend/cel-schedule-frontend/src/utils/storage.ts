// Local storage helpers for token management
import { AuthUser } from '../types/authUser';

const TOKEN_KEY = 'cel_auth_token';
const USER_KEY = 'cel_auth_user';

export const storage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser(): AuthUser | null {
    const user = localStorage.getItem(USER_KEY);
    if (!user) return null;
    
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
