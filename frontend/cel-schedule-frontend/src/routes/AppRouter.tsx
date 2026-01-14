import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, LoginPage, ProtectedRoute } from '../features/auth';
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
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:id" element={<DepartmentDetailPage />} />
            <Route path="/volunteers" element={<VolunteersPage />} />
            <Route path="/volunteers/:id" element={<VolunteerDetailPage />} />

            {/* Admin only route */}
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
