import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false, requireStudent = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isStudent, needsProfileCompletion, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (needsProfileCompletion) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin/complete-profile" replace />;
    } else {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/student/dashboard" replace />;
  }

  if (requireStudent && !isStudent) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
