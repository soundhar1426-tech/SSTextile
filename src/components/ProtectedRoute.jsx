import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * Guards routes against unauthenticated access or unauthorized roles.
 * - Customer routes: Redirects to /login if no valid session.
 * - Admin routes: Redirects to /admin/login if not logged in as admin.
 */
export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, token, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-body-sm text-on-surface-variant font-medium">Verifying authentication...</p>
      </div>
    );
  }

  if (adminOnly) {
    if (!token || !isAdmin || currentUser?.role !== 'admin') {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
  } else {
    if (!token || !currentUser) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
