import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getAuthToken } from '../utils/auth';
import { showNotification } from '@mantine/notifications';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Check if token exists but might be expired
    const token = getAuthToken();
    if (token) {
      try {
        // Decode JWT token to check expiration
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          showNotification({
            title: 'Session Expired',
            message: 'Your credentials are not validated. Please sign in again.',
            color: 'red',
          });
        }
      } catch (error) {
        // If token is invalid, it will be handled by API calls
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  if (!isAuthenticated()) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
