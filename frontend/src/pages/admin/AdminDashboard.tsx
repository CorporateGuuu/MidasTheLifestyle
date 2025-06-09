// Admin Dashboard for Midas The Lifestyle
// Comprehensive admin interface with real-time metrics, analytics, and management tools

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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  IconButton,
  Badge,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard,
  TrendingUp,
  TrendingDown,
  People,
  DirectionsCar,
  AttachMoney,
  BookOnline,
  Warning,
  CheckCircle,
  Schedule,
  Refresh,
  Analytics,
  Inventory,
  PersonAdd,
  Assessment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

// Hooks and Store
import {
  useGetDashboardOverviewQuery,
  useGetRealTimeMetricsQuery,
  useGetInventoryAnalyticsQuery,
  useGetCustomerAnalyticsQuery,
} from '@/store';

// Mock data for charts
const revenueData = [
  { month: 'Jan', revenue: 125000, bookings: 45 },
  { month: 'Feb', revenue: 98000, bookings: 38 },
  { month: 'Mar', revenue: 156000, bookings: 52 },
  { month: 'Apr', revenue: 142000, bookings: 48 },
  { month: 'May', revenue: 189000, bookings: 65 },
  { month: 'Jun', revenue: 203000, bookings: 72 },
];

const categoryData = [
  { name: 'Luxury Cars', value: 65, color: '#D4AF37' },
  { name: 'Yachts', value: 20, color: '#F4E4BC' },
  { name: 'Private Jets', value: 10, color: '#B8941F' },
  { name: 'Properties', value: 5, color: '#8B7355' },
];

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // State
  const [dateRange, setDateRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  // API Queries
  const { data: overviewData, isLoading: isLoadingOverview, refetch: refetchOverview } = useGetDashboardOverviewQuery(dateRange);
  const { data: realtimeData, isLoading: isLoadingRealtime } = useGetRealTimeMetricsQuery();
  const { data: inventoryData, isLoading: isLoadingInventory } = useGetInventoryAnalyticsQuery(dateRange);
  const { data: customerData, isLoading: isLoadingCustomer } = useGetCustomerAnalyticsQuery(dateRange);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchOverview(),
    ]);
    setRefreshing(false);
  };

  // Metrics Cards Component
  const MetricsCards = () => {
    const metrics = [
      {
        title: 'Total Revenue',
        value: `$${(overviewData?.data?.totalRevenue || 0).toLocaleString()}`,
        change: overviewData?.data?.revenueGrowth || 0,
        icon: AttachMoney,
        color: 'success.main',
      },
      {
        title: 'Total Bookings',
        value: (overviewData?.data?.totalBookings || 0).toLocaleString(),
        change: overviewData?.data?.bookingGrowth || 0,
        icon: BookOnline,
        color: 'primary.main',
      },
      {
        title: 'Active Customers',
        value: (overviewData?.data?.activeCustomers || 0).toLocaleString(),
        change: overviewData?.data?.customerGrowth || 0,
        icon: People,
        color: 'info.main',
      },
      {
        title: 'Inventory Utilization',
        value: `${(overviewData?.data?.inventoryUtilization || 0).toFixed(1)}%`,
        change: overviewData?.data?.utilizationGrowth || 0,
        icon: DirectionsCar,
        color: 'warning.main',
      },
    ];

    return (
      <Grid container spacing={3} mb={4}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={metric.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <metric.icon sx={{ fontSize: 40, color: metric.color }} />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {metric.change > 0 ? (
                        <TrendingUp sx={{ fontSize: 20, color: 'success.main' }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 20, color: 'error.main' }} />
                      )}
                      <Typography
                        variant="body2"
                        color={metric.change > 0 ? 'success.main' : 'error.main'}
                        fontWeight={600}
                      >
                        {Math.abs(metric.change).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h4" fontWeight={600} gutterBottom>
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {metric.title}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Real-time Status Component
  const RealTimeStatus = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            Real-time Status
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={realtimeData?.data?.systemHealth?.toUpperCase() || 'HEALTHY'}
              color={
                realtimeData?.data?.systemHealth === 'healthy' ? 'success' :
                realtimeData?.data?.systemHealth === 'warning' ? 'warning' : 'error'
              }
              size="small"
            />
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight={600} color="primary.main">
                {realtimeData?.data?.activeUsers || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="h3" fontWeight={600} color="warning.main">
                {realtimeData?.data?.pendingBookings || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Bookings
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" mb={1}>
                Last Updated
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {realtimeData?.data?.lastUpdated ? 
                  new Date(realtimeData.data.lastUpdated).toLocaleTimeString() : 
                  'Just now'
                }
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Revenue Chart Component
  const RevenueChart = () => (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600}>
            Revenue & Bookings Trend
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={dateRange}
              label="Period"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 3 months</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#D4AF37"
              strokeWidth={3}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
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
            onClick={() => navigate('/admin/inventory')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <Inventory color="primary" />
            </ListItemIcon>
            <ListItemText primary="Manage Inventory" />
          </ListItem>
          
          <ListItem
            button
            onClick={() => navigate('/admin/bookings')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <Badge badgeContent={realtimeData?.data?.pendingBookings || 0} color="error">
                <BookOnline color="primary" />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Manage Bookings" />
          </ListItem>
          
          <ListItem
            button
            onClick={() => navigate('/admin/customers')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <People color="primary" />
            </ListItemIcon>
            <ListItemText primary="Customer Management" />
          </ListItem>
          
          <ListItem
            button
            onClick={() => navigate('/admin/reports')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <Assessment color="primary" />
            </ListItemIcon>
            <ListItemText primary="Reports & Analytics" />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  // Category Distribution Component
  const CategoryDistribution = () => (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Booking Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <Box mt={2}>
          {categoryData.map((category) => (
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
  );

  // Recent Activity Component
  const RecentActivity = () => (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Recent Activity
        </Typography>
        <List disablePadding>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <PersonAdd color="success" />
            </ListItemIcon>
            <ListItemText
              primary="New customer registration"
              secondary="John Smith joined as Premium member"
            />
            <Typography variant="caption" color="text.secondary">
              2 min ago
            </Typography>
          </ListItem>
          
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <BookOnline color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="New booking confirmed"
              secondary="Ferrari F8 Tributo - $2,500/day"
            />
            <Typography variant="caption" color="text.secondary">
              15 min ago
            </Typography>
          </ListItem>
          
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <CheckCircle color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Booking completed"
              secondary="Lamborghini Huracán rental finished"
            />
            <Typography variant="caption" color="text.secondary">
              1 hour ago
            </Typography>
          </ListItem>
          
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <Warning color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Maintenance scheduled"
              secondary="Yacht maintenance due next week"
            />
            <Typography variant="caption" color="text.secondary">
              2 hours ago
            </Typography>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  if (isLoadingOverview) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 8 }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
          </Box>
        </Container>
      </Box>
    );
  }

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
              Admin Dashboard
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Comprehensive overview of your luxury rental business
            </Typography>
          </Box>
        </motion.div>

        {/* Metrics Cards */}
        <MetricsCards />

        {/* Real-time Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <RealTimeStatus />
        </motion.div>

        {/* Main Content */}
        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <RevenueChart />
            </motion.div>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <QuickActions />
            </motion.div>
            
            <Box mt={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <CategoryDistribution />
              </motion.div>
            </Box>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Box mt={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <RecentActivity />
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
