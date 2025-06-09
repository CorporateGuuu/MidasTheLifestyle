// Admin Route Component for Midas The Lifestyle
// Route guard for admin users with role-based access control

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { AdminPanelSettings, ArrowBack } from '@mui/icons-material';
import { useAppSelector } from '@/hooks/redux';
import { 
  selectIsAuthenticated, 
  selectUser, 
  selectUserRole 
} from '@/store/slices/authSlice';
import LoadingScreen from '@/components/common/LoadingScreen';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super-admin';
  redirectTo?: string;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  requiredRole = 'admin',
  redirectTo = '/login' 
}) => {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);

  // Show loading while checking authentication
  if (isAuthenticated === null || (isAuthenticated && !user)) {
    return <LoadingScreen message="Verifying admin access..." />;
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

  // Check if user has required admin role
  const hasRequiredRole = () => {
    if (!userRole) return false;
    
    if (requiredRole === 'super-admin') {
      return userRole === 'super-admin';
    }
    
    return userRole === 'admin' || userRole === 'super-admin';
  };

  // Show access denied if user doesn't have required role
  if (!hasRequiredRole()) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={8}
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'warning.main',
              borderRadius: 4,
            }}
          >
            {/* Access Denied Icon */}
            <AdminPanelSettings
              sx={{
                fontSize: 80,
                color: 'warning.main',
                mb: 3,
              }}
            />

            {/* Access Denied Title */}
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 700,
                color: 'warning.main',
                mb: 2,
              }}
            >
              Access Restricted
            </Typography>

            {/* Access Denied Description */}
            <Typography
              variant="h6"
              color="text.secondary"
              gutterBottom
              sx={{ mb: 4 }}
            >
              This area is restricted to authorized administrators only.
              You don't have the required permissions to access this page.
            </Typography>

            {/* User Info */}
            <Box
              sx={{
                bgcolor: 'background.default',
                p: 3,
                borderRadius: 2,
                mb: 4,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current User:
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Role: {userRole?.toUpperCase() || 'CUSTOMER'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Required Role: {requiredRole.toUpperCase()}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="contained"
                startIcon={<ArrowBack />}
                onClick={() => window.history.back()}
                sx={{
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Go Back
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/dashboard'}
                sx={{
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Go to Dashboard
              </Button>
            </Box>

            {/* Support Information */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                If you believe you should have access to this area, please contact our support team at{' '}
                <Typography
                  component="a"
                  href="mailto:concierge@midasthelifestyle.com"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  concierge@midasthelifestyle.com
                </Typography>
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Render admin content
  return <>{children}</>;
};

export default AdminRoute;
