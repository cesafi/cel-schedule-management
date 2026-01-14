import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './AuthContext';
import { AccessLevel } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: AccessLevel;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireRole 
}) => {
  // AUTH DISABLED FOR TESTING - Just render children without checks
  return <>{children}</>;
  
  /* ORIGINAL AUTH CODE - COMMENTED OUT FOR TESTING
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && !hasRole(requireRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
  */
};
