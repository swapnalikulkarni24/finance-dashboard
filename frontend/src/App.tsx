// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Define a custom Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4F46E5', // Indigo-600
    },
    secondary: {
      main: '#6B7280', // Gray-500
    },
    success: {
      main: '#22C55E', // Green-500
    },
    error: {
      main: '#EF4444', // Red-500
    },
    warning: {
      main: '#FCD34D', // Amber-400
    },
    background: {
      default: '#f3f4f6', // Light gray background
    },
  },
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Rounded corners for buttons
          textTransform: 'none', // Prevent uppercase by default
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Rounded corners for text fields
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Rounded corners for cards/papers
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Tailwind-like shadow
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.875rem', // Smaller font size for tooltips
          backgroundColor: 'rgba(0, 0, 0, 0.85)', // Darker background
        },
      },
    },
  },
});

// PrivateRoute component to protect routes
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
        <CircularProgress color="primary" size={60} thickness={4} />
      </Box>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Provides consistent baseline styling */}
      <Router>
        <AuthProvider>
          <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              />
              {/* Redirect root to login page by default */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </Box>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
