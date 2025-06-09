// Luxury Navbar Component for Midas The Lifestyle
// Premium navigation with black/gold aesthetic and responsive design

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  AccountCircle,
  Dashboard,
  BookOnline,
  DirectionsCar,
  SailingOutlined,
  FlightTakeoff,
  Home,
  Logout,
  AdminPanelSettings,
  Person,
  Settings,
  Notifications,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks and Store
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  selectIsAuthenticated,
  selectUser,
  selectUserRole,
  logoutUser,
} from '@/store/slices/authSlice';
import { selectMyBookings } from '@/store/slices/bookingSlice';

// Logo Component
const Logo: React.FC = () => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Typography
      variant="h4"
      component={Link}
      to="/"
      sx={{
        fontFamily: 'Playfair Display, serif',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textDecoration: 'none',
        letterSpacing: '-0.02em',
        cursor: 'pointer',
      }}
    >
      MIDAS
    </Typography>
  </motion.div>
);

// Navigation Links
const navigationLinks = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Luxury Cars', path: '/inventory/cars', icon: DirectionsCar },
  { label: 'Yachts', path: '/inventory/yachts', icon: SailingOutlined },
  { label: 'Private Jets', path: '/inventory/jets', icon: FlightTakeoff },
  { label: 'Properties', path: '/inventory/properties', icon: Home },
];

// User Menu Items
const userMenuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Dashboard },
  { label: 'My Bookings', path: '/my-bookings', icon: BookOnline },
  { label: 'Profile', path: '/profile', icon: Person },
  { label: 'Settings', path: '/settings', icon: Settings },
];

// Admin Menu Items
const adminMenuItems = [
  { label: 'Admin Dashboard', path: '/admin/dashboard', icon: AdminPanelSettings },
  { label: 'Inventory Management', path: '/admin/inventory', icon: DirectionsCar },
  { label: 'Booking Management', path: '/admin/bookings', icon: BookOnline },
  { label: 'Customer Management', path: '/admin/customers', icon: Person },
  { label: 'Reports & Analytics', path: '/admin/reports', icon: Dashboard },
];

const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Selectors
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);
  const myBookings = useAppSelector(selectMyBookings);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handlers
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    handleUserMenuClose();
    navigate('/');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleUserMenuClose();
  };

  // Get pending bookings count
  const pendingBookingsCount = myBookings.filter(
    booking => booking.status === 'pending-payment' || booking.status === 'payment-processing'
  ).length;

  // Desktop Navigation
  const DesktopNavigation = () => (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
      {navigationLinks.map((link) => (
        <motion.div
          key={link.path}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
        >
          <Button
            component={Link}
            to={link.path}
            sx={{
              color: location.pathname === link.path ? 'primary.main' : 'text.primary',
              fontWeight: location.pathname === link.path ? 600 : 400,
              textTransform: 'none',
              fontSize: '0.95rem',
              px: 2,
              py: 1,
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                color: 'primary.main',
              },
            }}
          >
            {link.label}
          </Button>
        </motion.div>
      ))}
    </Box>
  );

  // User Avatar and Menu
  const UserMenu = () => (
    <>
      <IconButton
        onClick={handleUserMenuOpen}
        sx={{
          p: 0,
          ml: 2,
          border: '2px solid',
          borderColor: 'primary.main',
          '&:hover': {
            borderColor: 'primary.light',
          },
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.main',
            color: 'black',
            fontWeight: 600,
          }}
        >
          {user?.firstName?.[0]?.toUpperCase() || 'U'}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            minWidth: 200,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              '&:hover': {
                bgcolor: 'rgba(212, 175, 55, 0.1)',
                color: 'primary.main',
              },
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.serviceProfile?.tier?.toUpperCase()} Member
          </Typography>
        </Box>

        {userMenuItems.map((item) => (
          <MenuItem
            key={item.path}
            onClick={() => handleNavigation(item.path)}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
              <item.icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={item.label} />
            {item.path === '/my-bookings' && pendingBookingsCount > 0 && (
              <Badge
                badgeContent={pendingBookingsCount}
                color="error"
                sx={{ ml: 1 }}
              />
            )}
          </MenuItem>
        ))}

        {(userRole === 'admin' || userRole === 'super-admin') && (
          <>
            <Divider sx={{ my: 1 }} />
            {adminMenuItems.map((item) => (
              <MenuItem
                key={item.path}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                  <item.icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </MenuItem>
            ))}
          </>
        )}

        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>
    </>
  );

  // Mobile Drawer
  const MobileDrawer = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      PaperProps={{
        sx: {
          width: 280,
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo />
        <IconButton onClick={handleMobileMenuToggle}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ px: 2 }}>
        {navigationLinks.map((link) => (
          <ListItem
            key={link.path}
            button
            onClick={() => handleNavigation(link.path)}
            sx={{
              borderRadius: 2,
              mb: 1,
              bgcolor: location.pathname === link.path ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
              color: location.pathname === link.path ? 'primary.main' : 'text.primary',
              '&:hover': {
                bgcolor: 'rgba(212, 175, 55, 0.1)',
                color: 'primary.main',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
              <link.icon />
            </ListItemIcon>
            <ListItemText primary={link.label} />
          </ListItem>
        ))}
      </List>

      {isAuthenticated && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.serviceProfile?.tier?.toUpperCase()} Member
            </Typography>
          </Box>

          <List sx={{ px: 2 }}>
            {userMenuItems.map((item) => (
              <ListItem
                key={item.path}
                button
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  '&:hover': {
                    bgcolor: 'rgba(212, 175, 55, 0.1)',
                    color: 'primary.main',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
                {item.path === '/my-bookings' && pendingBookingsCount > 0 && (
                  <Badge badgeContent={pendingBookingsCount} color="error" />
                )}
              </ListItem>
            ))}

            {(userRole === 'admin' || userRole === 'super-admin') && (
              <>
                <Divider sx={{ my: 1 }} />
                {adminMenuItems.map((item) => (
                  <ListItem
                    key={item.path}
                    button
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'rgba(212, 175, 55, 0.1)',
                        color: 'primary.main',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                      <item.icon />
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItem>
                ))}
              </>
            )}

            <Divider sx={{ my: 1 }} />
            <ListItem
              button
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'rgba(255, 68, 68, 0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </>
      )}

      {!isAuthenticated && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ px: 2, pb: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleNavigation('/login')}
              sx={{ mb: 1 }}
            >
              Login
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleNavigation('/register')}
            >
              Register
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );

  return (
    <AppBar
      position="fixed"
      elevation={scrolled ? 4 : 0}
      sx={{
        bgcolor: scrolled ? 'rgba(26, 26, 26, 0.95)' : 'rgba(26, 26, 26, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(212, 175, 55, 0.2)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <DesktopNavigation />

        {/* Right Side Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isAuthenticated ? (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none' }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{ textTransform: 'none' }}
              >
                Register
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              <IconButton sx={{ mr: 1 }}>
                <Badge badgeContent={pendingBookingsCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <UserMenu />
            </Box>
          )}

          {/* Mobile Menu Button */}
          <IconButton
            sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
            onClick={handleMobileMenuToggle}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <MobileDrawer />
    </AppBar>
  );
};

export default Navbar;
