import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, LoginDTO, AccessLevel } from '../../types';
import { authApi } from '../../api/authApi';
import { storage } from '../../utils/storage';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => void;
  hasRole: (role: AccessLevel) => boolean;
  isAdmin: boolean;
  isDeptHead: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      storage.setUser(response.user);
      setUser(response.user);
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

  const hasRole = (role: AccessLevel): boolean => {
    if (!user) return false;
    return user.accessLevel <= role; // Lower number = higher access
  };

  const isAdmin = user?.accessLevel === AccessLevel.ADMIN;
  const isDeptHead = user?.accessLevel === AccessLevel.DEPTHEAD || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        isAdmin,
        isDeptHead,
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
