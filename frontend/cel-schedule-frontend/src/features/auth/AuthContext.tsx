import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, LoginDTO, AccessLevel } from '../../types';
import { Department, MembershipType } from '../../types';
import { authApi } from '../../api/authApi';
import { departmentsApi } from '../../api/departmentsApi';
import { storage } from '../../utils/storage';

interface AuthContextType {
  user: AuthUser | null;
  userDepartments: Department[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => void;
  hasRole: (role: AccessLevel) => boolean;
  isAdmin: boolean;
  isDeptHead: boolean;
  isHeadOfDepartment: (departmentId: string) => boolean;
  canManageVolunteer: (volunteerId: string, allDepartments: Department[]) => boolean;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userDepartments, setUserDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's departments when user changes
  useEffect(() => {
    const fetchUserDepartments = async () => {
      if (user?.volunteerId) {
        try {
          const allDepartments = await departmentsApi.getAll();
          const myDepartments = allDepartments.filter(dept =>
            dept.volunteerMembers?.some(
              m => m.volunteerID === user.volunteerId && m.membershipType === MembershipType.HEAD
            )
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

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = () => {
      const token = storage.getToken();
      const savedUser = storage.getUser();

      if (token && savedUser) {
        setUser(savedUser);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginDTO) => {
    try {
      // Use real login API now that backend is ready
      const response = await authApi.login(credentials);
      
      storage.setToken(response.token);
      
      // Fetch full user details to get volunteerId
      try {
        const fullUser = await authApi.getCurrentUser();
        storage.setUser(fullUser);
        setUser(fullUser);
      } catch (userError) {
        // Fallback: construct user object from login response
        const user: AuthUser = {
          id: response.userId,
          username: response.username,
          volunteerId: '', // Will need to be fetched later
          accessLevel: response.accessLevel,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDisabled: false,
        };
        storage.setUser(user);
        setUser(user);
      }
    } catch (error) {
      storage.clear();
      throw error;
    }
  };

  const logout = () => {
    storage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  const setTokenHelper = (token: string) => {
    storage.setToken(token);
  };

  const setUserHelper = (newUser: AuthUser | null) => {
    if (newUser) {
      storage.setUser(newUser);
    }
    setUser(newUser);
  };

  const hasRole = (role: AccessLevel): boolean => {
    if (!user) return false;
    return user.accessLevel <= role; // Lower number = higher access
  };

  const isAdmin = user?.accessLevel === AccessLevel.ADMIN;
  const isDeptHead = user?.accessLevel === AccessLevel.DEPTHEAD || isAdmin;

  const isHeadOfDepartment = (departmentId: string): boolean => {
    if (isAdmin) return true;
    return userDepartments.some(dept => dept.id === departmentId);
  };

  const canManageVolunteer = (volunteerId: string, allDepartments: Department[]): boolean => {
    if (isAdmin) return true;
    if (!isDeptHead) return false;
    
    // Check if volunteer belongs to any department the user heads
    return userDepartments.some(userDept =>
      userDept.volunteerMembers?.some(m => m.volunteerID === volunteerId)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userDepartments,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        isAdmin,
        isDeptHead,
        isHeadOfDepartment,
        canManageVolunteer,
        setUser: setUserHelper,
        setToken: setTokenHelper,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
