import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { AuthUser, LoginDTO, AccessLevel } from '../../types';
import { Department, MembershipType } from '../../types';
import { authApi, buildAuthUser } from '../../api/authApi';
import { departmentsApi } from '../../api/departmentsApi';

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  userDepartments: Department[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDTO) => Promise<void>;
  loginWithProvider: (providerId: 'google.com' | 'github.com' | 'microsoft.com') => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: AccessLevel) => boolean;
  isAdmin: boolean;
  isDeptHead: boolean;
  isHeadOfDepartment: (departmentId: string) => boolean;
  canManageVolunteer: (volunteerId: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userDepartments, setUserDepartments] = useState<Department[]>([]);
  // Start as loading — Firebase restores the session asynchronously on mount
  const [isLoading, setIsLoading] = useState(true);

  // ----- Fetch the authenticated user's departments whenever user changes -----
  useEffect(() => {
    const fetchUserDepartments = async () => {
      if (user?.volunteerId) {
        try {
          const allDepartments = await departmentsApi.getAll();
          const myDepartments = allDepartments.filter((dept) =>
            dept.volunteerMembers?.some(
              (m) => m.volunteerID === user.volunteerId && m.membershipType === MembershipType.HEAD,
            ),
          );
          setUserDepartments(myDepartments);
        } catch (error) {
          console.error('Failed to fetch user departments:', error);
          setUserDepartments([]);
        }
      } else {
        setUserDepartments([]);
      }
    };

    fetchUserDepartments();
  }, [user]);

  // ----- Subscribe to Firebase Auth state — single source of truth -----
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const appUser = await buildAuthUser(fbUser);
          setUser(appUser);
        } catch (err) {
          console.error('Failed to build AuthUser:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // ----- Login with email + password -----
  const login = async (credentials: LoginDTO) => {
    const appUser = await authApi.login(credentials);
    setUser(appUser);
  };

  // ----- Login with OAuth provider (popup) -----
  const loginWithProvider = async (
    providerId: 'google.com' | 'github.com' | 'microsoft.com',
  ) => {
    const appUser = await authApi.loginWithProvider(providerId);
    setUser(appUser);
  };

  // ----- Sign out -----
  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setFirebaseUser(null);
  };

  // ----- Force-refresh the current user's token + profile -----
  const refreshUser = async () => {
    if (firebaseUser) {
      await authApi.refreshToken();
      const updated = await buildAuthUser(firebaseUser);
      setUser(updated);
    }
  };

  // ----- Role helpers -----
  const hasRole = (role: AccessLevel): boolean => {
    if (!user) return false;
    return user.accessLevel <= role; // Lower number = higher access
  };

  const isAdmin = user?.accessLevel === AccessLevel.ADMIN;
  const isDeptHead = user?.accessLevel === AccessLevel.DEPTHEAD || isAdmin;

  const isHeadOfDepartment = (departmentId: string): boolean => {
    if (isAdmin) return true;
    return userDepartments.some((dept) => dept.id === departmentId);
  };

  const canManageVolunteer = (volunteerId: string): boolean => {
    if (isAdmin) return true;
    if (!isDeptHead) return false;
    return userDepartments.some((dept) =>
      dept.volunteerMembers?.some((m) => m.volunteerID === volunteerId),
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        userDepartments,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithProvider,
        logout,
        hasRole,
        isAdmin,
        isDeptHead,
        isHeadOfDepartment,
        canManageVolunteer,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

