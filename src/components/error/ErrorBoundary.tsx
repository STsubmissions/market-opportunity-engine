import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
} from '@mui/material';
import { RefreshRounded as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Here you could send the error to an error reporting service
    // Example: Sentry.captureException(error);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleReportError = () => {
    // Implement error reporting logic
    const errorReport = {
      error: this.state.error?.toString(),
      errorInfo: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    
    console.log('Error report:', errorReport);
    // Here you would typically send this to your error reporting service
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
                maxWidth: 600,
              }}
            >
              <Typography variant="h4" color="error" gutterBottom>
                Oops! Something went wrong
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                We're sorry, but something unexpected happened. Our team has been notified and is working on it.
              </Typography>

              {process.env.NODE_ENV === 'development' && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: 'grey.100',
                    maxHeight: 200,
                    overflow: 'auto',
                    textAlign: 'left',
                  }}
                >
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error?.toString()}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Paper>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRefresh}
                >
                  Refresh Page
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={this.handleReportError}
                >
                  Report Error
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
