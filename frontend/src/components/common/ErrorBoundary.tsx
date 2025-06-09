// Error Boundary Component for Midas The Lifestyle
// Catches JavaScript errors and displays luxury-themed error page

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { ErrorOutline, Refresh, Home } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service (Sentry, LogRocket, etc.)
      console.error('Production error:', {
        error: error.toString(),
        errorInfo: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
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
                borderColor: 'error.main',
                borderRadius: 4,
              }}
            >
              {/* Error Icon */}
              <ErrorOutline
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 3,
                }}
              />

              {/* Error Title */}
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 700,
                  color: 'error.main',
                  mb: 2,
                }}
              >
                Oops! Something went wrong
              </Typography>

              {/* Error Description */}
              <Typography
                variant="h6"
                color="text.secondary"
                gutterBottom
                sx={{ mb: 4 }}
              >
                We apologize for the inconvenience. Our luxury experience has encountered an unexpected error.
              </Typography>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box
                  sx={{
                    textAlign: 'left',
                    bgcolor: 'background.default',
                    p: 3,
                    borderRadius: 2,
                    mb: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    Error Details (Development Mode):
                  </Typography>
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Box>
              )}

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
                  startIcon={<Refresh />}
                  onClick={this.handleRefresh}
                  sx={{
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Refresh Page
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                  sx={{
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Go Home
                </Button>
              </Box>

              {/* Support Information */}
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  If this problem persists, please contact our support team at{' '}
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

    return this.props.children;
  }
}

export default ErrorBoundary;
