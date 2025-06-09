// Luxury Theme Configuration for Midas The Lifestyle
// Black and Gold luxury aesthetic with premium typography and spacing

import { createTheme, ThemeOptions } from '@mui/material/styles';

// Luxury Color Palette
const luxuryColors = {
  primary: {
    main: '#D4AF37', // Luxury Gold
    light: '#F4E4BC',
    dark: '#B8941F',
    contrastText: '#000000',
  },
  secondary: {
    main: '#000000', // Deep Black
    light: '#1A1A1A',
    dark: '#000000',
    contrastText: '#D4AF37',
  },
  background: {
    default: '#0A0A0A', // Rich Black
    paper: '#1A1A1A', // Charcoal
    elevated: '#2A2A2A', // Elevated surfaces
  },
  text: {
    primary: '#FFFFFF', // White text
    secondary: '#D4AF37', // Gold accent text
    disabled: '#666666',
  },
  error: {
    main: '#FF4444',
    light: '#FF6B6B',
    dark: '#CC0000',
  },
  warning: {
    main: '#FFB020',
    light: '#FFD54F',
    dark: '#F57C00',
  },
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
  },
  divider: '#333333',
};

// Luxury Typography
const luxuryTypography = {
  fontFamily: [
    'Playfair Display',
    'Georgia',
    'Times New Roman',
    'serif',
  ].join(','),
  h1: {
    fontSize: '3.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    color: '#D4AF37',
  },
  h2: {
    fontSize: '2.75rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    color: '#D4AF37',
  },
  h3: {
    fontSize: '2.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
    color: '#FFFFFF',
  },
  h4: {
    fontSize: '1.875rem',
    fontWeight: 500,
    lineHeight: 1.4,
    color: '#FFFFFF',
  },
  h5: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.5,
    color: '#FFFFFF',
  },
  h6: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.5,
    color: '#FFFFFF',
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: '#FFFFFF',
    fontFamily: [
      'Inter',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
    color: '#CCCCCC',
    fontFamily: [
      'Inter',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    fontFamily: [
      'Inter',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    color: '#999999',
    fontFamily: [
      'Inter',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: '#D4AF37',
    fontFamily: [
      'Inter',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
};

// Luxury Component Overrides
const luxuryComponents = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: '#0A0A0A',
        backgroundImage: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
        minHeight: '100vh',
      },
      '*::-webkit-scrollbar': {
        width: '8px',
      },
      '*::-webkit-scrollbar-track': {
        background: '#1A1A1A',
      },
      '*::-webkit-scrollbar-thumb': {
        background: '#D4AF37',
        borderRadius: '4px',
      },
      '*::-webkit-scrollbar-thumb:hover': {
        background: '#B8941F',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        padding: '12px 24px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)',
        },
      },
      contained: {
        background: 'linear-gradient(135deg, #D4AF37 0%, #F4E4BC 100%)',
        color: '#000000',
        fontWeight: 600,
        '&:hover': {
          background: 'linear-gradient(135deg, #B8941F 0%, #D4AF37 100%)',
        },
      },
      outlined: {
        borderColor: '#D4AF37',
        color: '#D4AF37',
        '&:hover': {
          borderColor: '#F4E4BC',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: '#1A1A1A',
        backgroundImage: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
        border: '1px solid #333333',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 16px 48px rgba(212, 175, 55, 0.2)',
          borderColor: '#D4AF37',
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#2A2A2A',
          borderRadius: '8px',
          '& fieldset': {
            borderColor: '#444444',
          },
          '&:hover fieldset': {
            borderColor: '#D4AF37',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#D4AF37',
            borderWidth: '2px',
          },
        },
        '& .MuiInputLabel-root': {
          color: '#CCCCCC',
          '&.Mui-focused': {
            color: '#D4AF37',
          },
        },
        '& .MuiOutlinedInput-input': {
          color: '#FFFFFF',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #333333',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: '#1A1A1A',
        borderRight: '1px solid #333333',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        color: '#D4AF37',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        '&:hover': {
          backgroundColor: 'rgba(212, 175, 55, 0.2)',
        },
      },
    },
  },
  MuiDataGrid: {
    styleOverrides: {
      root: {
        backgroundColor: '#1A1A1A',
        border: '1px solid #333333',
        '& .MuiDataGrid-cell': {
          borderColor: '#333333',
          color: '#FFFFFF',
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#2A2A2A',
          borderColor: '#333333',
          color: '#D4AF37',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
        },
      },
    },
  },
};

// Luxury Spacing and Breakpoints
const luxurySpacing = 8;

const luxuryBreakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
};

// Create Luxury Theme
export const luxuryTheme = createTheme({
  palette: luxuryColors,
  typography: luxuryTypography,
  components: luxuryComponents,
  spacing: luxurySpacing,
  breakpoints: luxuryBreakpoints,
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0, 0, 0, 0.1)',
    '0 4px 8px rgba(0, 0, 0, 0.15)',
    '0 8px 16px rgba(0, 0, 0, 0.2)',
    '0 12px 24px rgba(0, 0, 0, 0.25)',
    '0 16px 32px rgba(0, 0, 0, 0.3)',
    '0 20px 40px rgba(0, 0, 0, 0.35)',
    '0 24px 48px rgba(0, 0, 0, 0.4)',
    '0 32px 64px rgba(0, 0, 0, 0.45)',
    '0 40px 80px rgba(0, 0, 0, 0.5)',
    '0 8px 32px rgba(212, 175, 55, 0.2)',
    '0 16px 48px rgba(212, 175, 55, 0.25)',
    '0 24px 64px rgba(212, 175, 55, 0.3)',
    '0 32px 80px rgba(212, 175, 55, 0.35)',
    '0 40px 96px rgba(212, 175, 55, 0.4)',
    '0 48px 112px rgba(212, 175, 55, 0.45)',
    '0 56px 128px rgba(212, 175, 55, 0.5)',
    '0 64px 144px rgba(212, 175, 55, 0.55)',
    '0 72px 160px rgba(212, 175, 55, 0.6)',
    '0 80px 176px rgba(212, 175, 55, 0.65)',
    '0 88px 192px rgba(212, 175, 55, 0.7)',
    '0 96px 208px rgba(212, 175, 55, 0.75)',
    '0 104px 224px rgba(212, 175, 55, 0.8)',
    '0 112px 240px rgba(212, 175, 55, 0.85)',
    '0 120px 256px rgba(212, 175, 55, 0.9)',
  ],
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
} as ThemeOptions);

// Luxury Animation Variants for Framer Motion
export const luxuryAnimations = {
  fadeInUp: {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
  fadeInLeft: {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
  fadeInRight: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  luxuryHover: {
    whileHover: {
      scale: 1.05,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    whileTap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },
  },
};

export default luxuryTheme;
