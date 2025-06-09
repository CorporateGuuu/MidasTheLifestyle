// Loading Screen Component for Midas The Lifestyle
// Luxury loading screen with brand elements and smooth animations

import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading luxury experience...', 
  fullScreen = true 
}) => {
  return (
    <Box
      sx={{
        position: fullScreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        width: '100%',
        height: fullScreen ? '100vh' : '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'background.default',
        zIndex: fullScreen ? 9999 : 1,
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.1) 0%, transparent 50%)',
          opacity: 0.5,
        }}
      />

      {/* Logo Animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Typography
          variant="h2"
          component="div"
          sx={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            mb: 4,
            letterSpacing: '-0.02em',
          }}
        >
          MIDAS
        </Typography>
      </motion.div>

      {/* Loading Spinner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
          <CircularProgress
            size={60}
            thickness={4}
            sx={{
              color: 'primary.main',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                }}
              />
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* Loading Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
            fontWeight: 500,
            letterSpacing: '0.05em',
          }}
        >
          {message}
        </Typography>
      </motion.div>

      {/* Animated Dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                }}
              />
            </motion.div>
          ))}
        </Box>
      </motion.div>
    </Box>
  );
};

export default LoadingScreen;
