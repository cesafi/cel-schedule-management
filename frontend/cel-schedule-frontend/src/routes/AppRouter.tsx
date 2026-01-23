import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, LoginPage, ProtectedRoute, OAuthCallback, AccountSettings } from '../features/auth';
import { MainLayout } from '../layouts';
import { HomePage } from './HomePage';
import { SchedulesPage, EventDetailPage } from '../features/events';
import { DepartmentsPage, DepartmentDetailPage } from '../features/departments';
import { VolunteersPage, VolunteerDetailPage } from '../features/volunteers';
import { AdminPage } from '../features/admin';
import { AccessLevel } from '../types';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* Public routes with MainLayout - Anonymous users can view */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:id" element={<DepartmentDetailPage />} />
            <Route path="/volunteers" element={<VolunteersPage />} />
            <Route path="/volunteers/:id" element={<VolunteerDetailPage />} />

            {/* Account settings - Requires authentication */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />

            {/* Admin only route - Requires authentication and admin role */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole={AccessLevel.ADMIN}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
