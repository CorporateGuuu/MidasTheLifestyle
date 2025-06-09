// Home Page Component for Midas The Lifestyle
// Luxury landing page with hero section, featured inventory, and premium experience showcase

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  useTheme,
  useMediaQuery,
  Paper,
  Avatar,
  Rating,
} from '@mui/material';
import {
  DirectionsCar,
  SailingOutlined,
  FlightTakeoff,
  Home as HomeIcon,
  Star,
  TrendingUp,
  Security,
  Support,
  ArrowForward,
} from '@mui/icons-material';
import { motion, useInView } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';

// Hooks and API
import { useGetFeaturedInventoryQuery } from '@/store';
import { luxuryAnimations } from '@/theme/luxuryTheme';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// Hero Section Component
const HeroSection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const heroSlides = [
    {
      image: '/images/hero/luxury-car-hero.jpg',
      title: 'Luxury Car Rentals',
      subtitle: 'Experience the finest automobiles',
      cta: 'Explore Cars',
      path: '/inventory/cars',
    },
    {
      image: '/images/hero/yacht-hero.jpg',
      title: 'Exclusive Yacht Charters',
      subtitle: 'Sail in unparalleled luxury',
      cta: 'Discover Yachts',
      path: '/inventory/yachts',
    },
    {
      image: '/images/hero/jet-hero.jpg',
      title: 'Private Jet Services',
      subtitle: 'Fly with ultimate sophistication',
      cta: 'View Jets',
      path: '/inventory/jets',
    },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: '70vh', md: '90vh' },
        overflow: 'hidden',
        mt: { xs: 7, md: 8 },
      }}
    >
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        loop
        style={{ height: '100%' }}
      >
        {heroSlides.map((slide, index) => (
          <SwiperSlide key={index}>
            <Box
              sx={{
                position: 'relative',
                height: '100%',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Container maxWidth="lg">
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                >
                  <Box textAlign="center" color="white">
                    <Typography
                      variant={isMobile ? 'h3' : 'h1'}
                      component="h1"
                      gutterBottom
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                      }}
                    >
                      {slide.title}
                    </Typography>
                    <Typography
                      variant={isMobile ? 'h6' : 'h4'}
                      component="p"
                      gutterBottom
                      sx={{
                        mb: 4,
                        opacity: 0.9,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      {slide.subtitle}
                    </Typography>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate(slide.path)}
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          borderRadius: 3,
                          textTransform: 'none',
                          boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)',
                        }}
                      >
                        {slide.cta}
                      </Button>
                    </motion.div>
                  </Box>
                </motion.div>
              </Container>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Swiper Pagination Styles */}
      <style jsx global>{`
        .swiper-pagination-bullet {
          background: rgba(212, 175, 55, 0.5);
          opacity: 1;
          width: 12px;
          height: 12px;
        }
        .swiper-pagination-bullet-active {
          background: #D4AF37;
          transform: scale(1.2);
        }
      `}</style>
    </Box>
  );
};

// Categories Section Component
const CategoriesSection: React.FC = () => {
  const navigate = useNavigate();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  const categories = [
    {
      title: 'Luxury Cars',
      description: 'Premium automobiles for discerning tastes',
      icon: DirectionsCar,
      path: '/inventory/cars',
      image: '/images/categories/luxury-cars.jpg',
      count: '50+ Vehicles',
    },
    {
      title: 'Exclusive Yachts',
      description: 'Magnificent vessels for ocean adventures',
      icon: SailingOutlined,
      path: '/inventory/yachts',
      image: '/images/categories/yachts.jpg',
      count: '25+ Yachts',
    },
    {
      title: 'Private Jets',
      description: 'Elite aviation for ultimate convenience',
      icon: FlightTakeoff,
      path: '/inventory/jets',
      image: '/images/categories/jets.jpg',
      count: '15+ Aircraft',
    },
    {
      title: 'Luxury Properties',
      description: 'Exquisite accommodations worldwide',
      icon: HomeIcon,
      path: '/inventory/properties',
      image: '/images/categories/properties.jpg',
      count: '100+ Properties',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" component="h2" gutterBottom color="primary.main">
            Luxury Categories
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
            Discover our exclusive collection of premium vehicles, vessels, and properties
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {categories.map((category, index) => (
            <Grid item xs={12} sm={6} md={3} key={category.title}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 16px 48px rgba(212, 175, 55, 0.2)',
                    },
                  }}
                  onClick={() => navigate(category.path)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={category.image}
                    alt={category.title}
                    sx={{
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  />
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box mb={2}>
                      <category.icon
                        sx={{
                          fontSize: 40,
                          color: 'primary.main',
                          mb: 1,
                        }}
                      />
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom fontWeight={600}>
                      {category.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {category.description}
                    </Typography>
                    <Chip
                      label={category.count}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(212, 175, 55, 0.1)',
                        color: 'primary.main',
                        fontWeight: 600,
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
};

// Featured Inventory Section
const FeaturedInventorySection: React.FC = () => {
  const navigate = useNavigate();
  const { data: featuredInventory, isLoading } = useGetFeaturedInventoryQuery(6);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  if (isLoading || !featuredInventory?.data) {
    return null;
  }

  return (
    <Box sx={{ bgcolor: 'background.elevated', py: 8 }}>
      <Container maxWidth="lg">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <Box textAlign="center" mb={6}>
            <Typography variant="h2" component="h2" gutterBottom color="primary.main">
              Featured Collection
            </Typography>
            <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
              Handpicked premium vehicles and experiences for the most discerning clientele
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {featuredInventory.data.slice(0, 6).map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 16px 48px rgba(212, 175, 55, 0.2)',
                      },
                    }}
                    onClick={() => navigate(`/vehicle/${item.itemId}`)}
                  >
                    <CardMedia
                      component="img"
                      height="240"
                      image={item.media.primaryImage || '/images/placeholder-vehicle.jpg'}
                      alt={item.itemName}
                    />
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" component="h3" fontWeight={600}>
                          {item.brand} {item.model}
                        </Typography>
                        <Chip
                          label={item.category.toUpperCase()}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {item.year} • {item.location.primaryLocation}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" color="primary.main" fontWeight={600}>
                          ${item.pricing.basePrice.toLocaleString()}/day
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          endIcon={<ArrowForward />}
                          sx={{ textTransform: 'none' }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <Box textAlign="center" mt={6}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/inventory')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
              }}
            >
              View All Inventory
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

// Why Choose Us Section
const WhyChooseUsSection: React.FC = () => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  const features = [
    {
      icon: Star,
      title: 'Premium Quality',
      description: 'Only the finest vehicles and properties in our exclusive collection',
    },
    {
      icon: Security,
      title: 'Secure & Insured',
      description: 'Comprehensive insurance coverage and secure booking process',
    },
    {
      icon: Support,
      title: '24/7 Concierge',
      description: 'Dedicated luxury concierge service available around the clock',
    },
    {
      icon: TrendingUp,
      title: 'Best Value',
      description: 'Competitive pricing with transparent fees and no hidden costs',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" component="h2" gutterBottom color="primary.main">
            Why Choose Midas
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth="600px" mx="auto">
            Experience the difference with our commitment to luxury, quality, and exceptional service
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    height: '100%',
                    bgcolor: 'transparent',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(212, 175, 55, 0.05)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <feature.icon
                    sx={{
                      fontSize: 48,
                      color: 'primary.main',
                      mb: 2,
                    }}
                  />
                  <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
};

// Main Home Page Component
const HomePage: React.FC = () => {
  return (
    <Box>
      <HeroSection />
      <CategoriesSection />
      <FeaturedInventorySection />
      <WhyChooseUsSection />
    </Box>
  );
};

export default HomePage;
