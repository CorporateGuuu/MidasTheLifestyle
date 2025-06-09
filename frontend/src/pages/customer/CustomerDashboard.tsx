// Customer Dashboard for Midas The Lifestyle
// Comprehensive dashboard showing bookings, profile, and luxury service metrics

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  IconButton,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  BookOnline,
  DirectionsCar,
  Star,
  TrendingUp,
  CalendarToday,
  LocationOn,
  Phone,
  Email,
  Edit,
  Notifications,
  History,
  Favorite,
  Settings,
  CreditCard,
  Security,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Hooks and Store
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { useGetMyBookingsQuery } from '@/store';

// Mock data for charts
const bookingTrends = [
  { month: 'Jan', bookings: 2, spending: 15000 },
  { month: 'Feb', bookings: 1, spending: 8000 },
  { month: 'Mar', bookings: 3, spending: 22000 },
  { month: 'Apr', bookings: 2, spending: 18000 },
  { month: 'May', bookings: 4, spending: 35000 },
  { month: 'Jun', bookings: 3, spending: 28000 },
];

const categorySpending = [
  { name: 'Luxury Cars', value: 65, color: '#D4AF37' },
  { name: 'Yachts', value: 25, color: '#F4E4BC' },
  { name: 'Private Jets', value: 10, color: '#B8941F' },
];

const CustomerDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  // State
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  // Selectors
  const user = useAppSelector(selectUser);
  const { data: bookingsData, isLoading: isLoadingBookings } = useGetMyBookingsQuery({
    limit: 5,
    status: 'confirmed,in-progress,completed',
  });

  const recentBookings = bookingsData?.data || [];

  // Quick Stats Component
  const QuickStats = () => (
    <Grid container spacing={3} mb={4}>
      <Grid item xs={12} sm={6} md={3}>
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <BookOnline sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="primary.main">
                {user?.totalBookings || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Bookings
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <CreditCard sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="success.main">
                ${(user?.totalSpent || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Spent
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {user?.loyaltyPoints || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Loyalty Points
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <CardContent>
              <TrendingUp sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600} color="info.main">
                {user?.serviceProfile?.tier?.toUpperCase() || 'STANDARD'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Service Tier
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  );

  // Profile Card Component
  const ProfileCard = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              color: 'black',
              fontSize: '2rem',
              fontWeight: 600,
              mr: 3,
            }}
          >
            {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Chip
                label={`${user?.serviceProfile?.tier?.toUpperCase()} MEMBER`}
                color="primary"
                size="small"
                icon={<Star />}
              />
              <Chip
                label={user?.status?.toUpperCase()}
                color="success"
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
              <Email sx={{ fontSize: 16 }} />
              {user?.email}
            </Typography>
            {user?.phone && (
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                <Phone sx={{ fontSize: 16 }} />
                {user?.phone}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => navigate('/profile')}>
            <Edit />
          </IconButton>
        </Box>

        {/* Loyalty Progress */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              Loyalty Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.loyaltyPoints || 0} / 10,000 points
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((user?.loyaltyPoints || 0) / 10000) * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(212, 175, 55, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main',
                borderRadius: 4,
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" mt={1} display="block">
            {10000 - (user?.loyaltyPoints || 0)} points to next tier
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  // Recent Bookings Component
  const RecentBookings = () => (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            Recent Bookings
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/my-bookings')}
            sx={{ textTransform: 'none' }}
          >
            View All
          </Button>
        </Box>

        {isLoadingBookings ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography color="text.secondary">Loading bookings...</Typography>
          </Box>
        ) : recentBookings.length === 0 ? (
          <Box textAlign="center" py={4}>
            <DirectionsCar sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No bookings yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Start your luxury experience by booking your first vehicle
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/inventory')}
              sx={{ textTransform: 'none' }}
            >
              Browse Inventory
            </Button>
          </Box>
        ) : (
          <List disablePadding>
            {recentBookings.map((booking, index) => (
              <React.Fragment key={booking._id}>
                <ListItem
                  sx={{
                    px: 0,
                    cursor: 'pointer',
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'rgba(212, 175, 55, 0.05)',
                    },
                  }}
                  onClick={() => navigate(`/booking-details/${booking.bookingId}`)}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'primary.main',
                        color: 'black',
                      }}
                    >
                      <DirectionsCar />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight={600}>
                        {booking.item.brand} {booking.item.model}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <Chip
                            label={booking.status.replace('-', ' ').toUpperCase()}
                            size="small"
                            color={
                              booking.status === 'completed' ? 'success' :
                              booking.status === 'confirmed' ? 'primary' :
                              booking.status === 'cancelled' ? 'error' : 'default'
                            }
                          />
                          <Typography variant="body2" color="primary.main" fontWeight={600}>
                            ${booking.pricing.total.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < recentBookings.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  // Quick Actions Component
  const QuickActions = () => (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <List disablePadding>
          <ListItem
            button
            onClick={() => navigate('/inventory')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <DirectionsCar color="primary" />
            </ListItemIcon>
            <ListItemText primary="Browse Vehicles" />
          </ListItem>
          
          <ListItem
            button
            onClick={() => navigate('/my-bookings')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <Badge badgeContent={recentBookings.filter(b => b.status === 'pending-payment').length} color="error">
                <BookOnline color="primary" />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="My Bookings" />
          </ListItem>
          
          <ListItem
            button
            onClick={() => navigate('/profile')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <Settings color="primary" />
            </ListItemIcon>
            <ListItemText primary="Account Settings" />
          </ListItem>
          
          <ListItem
            button
            onClick={() => navigate('/favorites')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <Favorite color="primary" />
            </ListItemIcon>
            <ListItemText primary="Favorites" />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  // Analytics Charts Component
  const AnalyticsCharts = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Booking Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#D4AF37" />
                <YAxis stroke="#D4AF37" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #D4AF37',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="spending"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  dot={{ fill: '#D4AF37', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Category Preferences
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categorySpending}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categorySpending.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box mt={2}>
              {categorySpending.map((category) => (
                <Box key={category.name} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        bgcolor: category.color,
                        borderRadius: '50%',
                      }}
                    />
                    <Typography variant="body2">{category.name}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {category.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 8 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box mb={4}>
            <Typography variant="h3" component="h1" gutterBottom color="primary.main">
              Welcome back, {user?.firstName}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Your luxury lifestyle dashboard
            </Typography>
          </Box>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <QuickStats />
        </motion.div>

        {/* Main Content */}
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <RecentBookings />
            </motion.div>
            
            <Box mt={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <AnalyticsCharts />
              </motion.div>
            </Box>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <ProfileCard />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <QuickActions />
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CustomerDashboard;
