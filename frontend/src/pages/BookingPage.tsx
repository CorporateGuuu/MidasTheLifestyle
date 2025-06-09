// Booking Page Component for Midas The Lifestyle
// Complete booking flow with real-time availability checking and step-by-step process

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Schedule,
  LocationOn,
  Star,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

// Hooks and Store
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  selectCurrentBooking,
  selectBookingStep,
  selectIsBookingAvailable,
  selectBookingPricing,
  setSelectedItem,
  setBookingStep,
  nextBookingStep,
  previousBookingStep,
  checkAvailability,
  resetBookingFlow,
} from '@/store/slices/bookingSlice';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { useGetInventoryItemQuery } from '@/store';

// Booking Steps Configuration
const bookingSteps = [
  { key: 'vehicle-selection', label: 'Select Vehicle', icon: '🚗' },
  { key: 'date-selection', label: 'Choose Dates', icon: '📅' },
  { key: 'location-details', label: 'Location Details', icon: '📍' },
  { key: 'service-tier', label: 'Service Tier', icon: '⭐' },
  { key: 'add-ons', label: 'Add-ons', icon: '➕' },
  { key: 'guest-details', label: 'Guest Details', icon: '👤' },
  { key: 'review', label: 'Review', icon: '📋' },
  { key: 'payment', label: 'Payment', icon: '💳' },
  { key: 'confirmation', label: 'Confirmation', icon: '✅' },
];

const BookingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { itemId } = useParams<{ itemId: string }>();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selectors
  const currentBooking = useAppSelector(selectCurrentBooking);
  const currentStep = useAppSelector(selectBookingStep);
  const isAvailable = useAppSelector(selectIsBookingAvailable);
  const pricing = useAppSelector(selectBookingPricing);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Get inventory item if itemId is provided
  const { data: inventoryItem, isLoading: isLoadingItem } = useGetInventoryItemQuery(
    itemId || '',
    { skip: !itemId }
  );

  // Initialize booking with selected item
  useEffect(() => {
    if (itemId && inventoryItem?.data && !currentBooking.selectedItem) {
      dispatch(setSelectedItem(inventoryItem.data));
    }
  }, [itemId, inventoryItem, currentBooking.selectedItem, dispatch]);

  // Get current step index
  const currentStepIndex = bookingSteps.findIndex(step => step.key === currentStep);

  // Handle step navigation
  const handleNext = async () => {
    setError(null);
    
    // Validate current step before proceeding
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    dispatch(nextBookingStep());
  };

  const handleBack = () => {
    dispatch(previousBookingStep());
  };

  const handleStepClick = (stepKey: string) => {
    // Only allow navigation to completed steps or the next step
    const targetIndex = bookingSteps.findIndex(step => step.key === stepKey);
    if (targetIndex <= currentStepIndex + 1) {
      dispatch(setBookingStep(stepKey as any));
    }
  };

  // Validate current step
  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 'vehicle-selection':
        if (!currentBooking.selectedItem) {
          setError('Please select a vehicle to continue');
          return false;
        }
        return true;

      case 'date-selection':
        if (!currentBooking.startDate || !currentBooking.endDate) {
          setError('Please select both start and end dates');
          return false;
        }
        
        // Check availability
        if (currentBooking.selectedItem && !currentBooking.availabilityChecked) {
          setIsLoading(true);
          try {
            const result = await dispatch(checkAvailability({
              itemId: currentBooking.selectedItem.itemId,
              startDate: currentBooking.startDate,
              endDate: currentBooking.endDate,
            })).unwrap();
            
            if (!result.available) {
              setError(result.error || 'Selected dates are not available');
              return false;
            }
          } catch (err: any) {
            setError(err.message || 'Failed to check availability');
            return false;
          } finally {
            setIsLoading(false);
          }
        }
        
        if (!isAvailable) {
          setError('Selected dates are not available');
          return false;
        }
        return true;

      case 'location-details':
        if (!currentBooking.pickupLocation) {
          setError('Please provide pickup location details');
          return false;
        }
        return true;

      case 'guest-details':
        if (!isAuthenticated && !currentBooking.guestDetails) {
          setError('Please provide guest details to continue');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // Render step content placeholder
  const renderStepContent = () => {
    return (
      <Box p={4}>
        <Typography variant="h5" gutterBottom>
          {bookingSteps[currentStepIndex]?.label}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Step {currentStepIndex + 1} of {bookingSteps.length}
        </Typography>
        
        {/* Placeholder content for each step */}
        {currentStep === 'vehicle-selection' && currentBooking.selectedItem && (
          <Card sx={{ mb: 3 }}>
            <CardMedia
              component="img"
              height="200"
              image={currentBooking.selectedItem.media.primaryImage}
              alt={currentBooking.selectedItem.itemName}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {currentBooking.selectedItem.brand} {currentBooking.selectedItem.model}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentBooking.selectedItem.year} • {currentBooking.selectedItem.location.primaryLocation}
              </Typography>
              <Typography variant="h6" color="primary.main" mt={2}>
                ${currentBooking.selectedItem.pricing.basePrice.toLocaleString()}/day
              </Typography>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Navigation buttons */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            startIcon={<ArrowBack />}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isLoading || currentStepIndex === bookingSteps.length - 1}
            endIcon={isLoading ? <CircularProgress size={20} /> : <ArrowForward />}
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            {currentStepIndex === bookingSteps.length - 2 ? 'Complete Booking' : 'Continue'}
          </Button>
        </Box>
      </Box>
    );
  };

  // Loading state
  if (isLoadingItem) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, mt: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pt: 8 }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box mb={4}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ mb: 2, textTransform: 'none' }}
            >
              Back to Inventory
            </Button>
            <Typography variant="h3" component="h1" gutterBottom color="primary.main">
              Book Your Luxury Experience
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Complete your reservation in just a few simple steps
            </Typography>
          </Box>
        </motion.div>

        {/* Progress Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Paper elevation={2} sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
            <Stepper
              activeStep={currentStepIndex}
              orientation={isMobile ? 'vertical' : 'horizontal'}
              sx={{
                '& .MuiStepLabel-root': {
                  cursor: 'pointer',
                },
                '& .MuiStepIcon-root': {
                  color: 'divider',
                  '&.Mui-active': {
                    color: 'primary.main',
                  },
                  '&.Mui-completed': {
                    color: 'success.main',
                  },
                },
              }}
            >
              {bookingSteps.map((step, index) => (
                <Step key={step.key} completed={index < currentStepIndex}>
                  <StepLabel
                    onClick={() => handleStepClick(step.key)}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: index === currentStepIndex ? 600 : 400,
                        color: index === currentStepIndex ? 'primary.main' : 'text.secondary',
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{step.icon}</span>
                      {step.label}
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </motion.div>

        {/* Step Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Paper elevation={2} sx={{ bgcolor: 'background.paper', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </Paper>
        </motion.div>

        {/* Booking Summary Sidebar (Desktop) */}
        {!isMobile && currentBooking.selectedItem && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Paper
              elevation={2}
              sx={{
                position: 'fixed',
                right: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 320,
                p: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" gutterBottom color="primary.main">
                Booking Summary
              </Typography>
              
              <Box mb={2}>
                <img
                  src={currentBooking.selectedItem.media.primaryImage}
                  alt={currentBooking.selectedItem.itemName}
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
              </Box>

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {currentBooking.selectedItem.brand} {currentBooking.selectedItem.model}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" mb={2}>
                {currentBooking.selectedItem.year} • {currentBooking.selectedItem.location.primaryLocation}
              </Typography>

              {currentBooking.startDate && currentBooking.endDate && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    <Schedule sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    {dayjs(currentBooking.startDate).format('MMM DD')} - {dayjs(currentBooking.endDate).format('MMM DD, YYYY')}
                  </Typography>
                </Box>
              )}

              {currentBooking.pickupLocation && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    <LocationOn sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    {currentBooking.pickupLocation.city}, {currentBooking.pickupLocation.state}
                  </Typography>
                </Box>
              )}

              <Box mb={2}>
                <Chip
                  label={currentBooking.serviceTier.toUpperCase()}
                  size="small"
                  color="primary"
                  icon={<Star />}
                />
              </Box>

              {pricing && (
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Base Price:</Typography>
                    <Typography variant="body2">${pricing.basePrice.toLocaleString()}</Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" pt={1} borderTop="1px solid" borderColor="divider">
                    <Typography variant="h6" fontWeight={600}>Total:</Typography>
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      ${pricing.total.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default BookingPage;
