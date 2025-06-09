// Protected Route Component for Midas The Lifestyle
// Route guard for authenticated users with luxury loading states

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { selectIsAuthenticated, selectAuthError } from '@/store/slices/authSlice';
import LoadingScreen from '@/components/common/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authError = useAppSelector(selectAuthError);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return <LoadingScreen message="Verifying access..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
