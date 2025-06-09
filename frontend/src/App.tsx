// Main App Component for Midas The Lifestyle Frontend
// Luxury rental platform with comprehensive routing and theme integration

import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Store and Theme
import { store } from '@/store';
import { luxuryTheme } from '@/theme/luxuryTheme';

// Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminRoute from '@/components/auth/AdminRoute';

// Hooks
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { initializeAuth, getCurrentUser, selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';

// Lazy-loaded Pages
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const InventoryPage = React.lazy(() => import('@/pages/InventoryPage'));
const VehicleDetailsPage = React.lazy(() => import('@/pages/VehicleDetailsPage'));
const BookingPage = React.lazy(() => import('@/pages/BookingPage'));
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('@/pages/auth/ResetPasswordPage'));
const CustomerDashboard = React.lazy(() => import('@/pages/customer/CustomerDashboard'));
const MyBookingsPage = React.lazy(() => import('@/pages/customer/MyBookingsPage'));
const BookingDetailsPage = React.lazy(() => import('@/pages/customer/BookingDetailsPage'));
const ProfilePage = React.lazy(() => import('@/pages/customer/ProfilePage'));
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminInventoryPage = React.lazy(() => import('@/pages/admin/AdminInventoryPage'));
const AdminBookingsPage = React.lazy(() => import('@/pages/admin/AdminBookingsPage'));
const AdminCustomersPage = React.lazy(() => import('@/pages/admin/AdminCustomersPage'));
const AdminReportsPage = React.lazy(() => import('@/pages/admin/AdminReportsPage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));

// Create React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading Component
const PageLoader: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="60vh"
    flexDirection="column"
    gap={2}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <CircularProgress 
        size={60} 
        thickness={4}
        sx={{ 
          color: 'primary.main',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }} 
      />
    </motion.div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <Box
        component="span"
        sx={{
          color: 'primary.main',
          fontSize: '1.1rem',
          fontWeight: 500,
          letterSpacing: '0.05em',
        }}
      >
        Loading Luxury Experience...
      </Box>
    </motion.div>
  </Box>
);

// App Content Component
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    // Initialize authentication state
    dispatch(initializeAuth());
    
    // Get current user if authenticated
    if (isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
      }}
    >
      <Navbar />
      
      <Box component="main" sx={{ flex: 1, position: 'relative' }}>
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/inventory/:category" element={<InventoryPage />} />
              <Route path="/vehicle/:itemId" element={<VehicleDetailsPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/booking/:itemId" element={<BookingPage />} />

              {/* Auth Routes */}
              <Route 
                path="/login" 
                element={
                  isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
                } 
              />
              <Route 
                path="/register" 
                element={
                  isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
                } 
              />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Customer Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-details/:bookingId"
                element={
                  <ProtectedRoute>
                    <BookingDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/inventory"
                element={
                  <AdminRoute>
                    <AdminInventoryPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <AdminRoute>
                    <AdminBookingsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/customers"
                element={
                  <AdminRoute>
                    <AdminCustomersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <AdminRoute>
                    <AdminReportsPage />
                  </AdminRoute>
                }
              />

              {/* Catch-all route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </Box>

      <Footer />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1A1A',
            color: '#FFFFFF',
            border: '1px solid #D4AF37',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </Box>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={luxuryTheme}>
            <CssBaseline />
            <Router>
              <AppContent />
            </Router>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
