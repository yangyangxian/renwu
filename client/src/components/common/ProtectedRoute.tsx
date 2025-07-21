import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { publicRoutes, LOGIN_PATH, SIGNUP_PATH, ROOT_PATH, TASKS_PATH } from '@/routes/routeConfig';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, authServerError } = useAuth();
  const location = useLocation();

  const isPublicRoute = publicRoutes.includes(location.pathname);
    
  // If user is authenticated and tries to access login or signup page, redirect to docs
  if (isAuthenticated && (location.pathname === LOGIN_PATH || location.pathname === SIGNUP_PATH)) {
    return <Navigate to={ROOT_PATH} replace />;
  }
  
  if (!isAuthenticated && !authServerError && !isPublicRoute) {
    return <Navigate to={LOGIN_PATH} state={{ from: location }} replace />;
  }

  if (location.pathname === ROOT_PATH) {
    return <Navigate to={TASKS_PATH} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
