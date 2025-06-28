// frontend/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Alert,
  Fade,
  Link as MuiLink, // Renamed to avoid conflict if you use react-router-dom's Link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close'; // Import the CloseIcon
import axios from 'axios'; // Import axios for API calls

// Base URL for your backend API (ensure this matches your backend's port)
const API_BASE_URL = 'http://localhost:5000/api';

const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false); // State to toggle between login/register form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // State for loading indicator during API calls

  // Destructure only `login` and `clearError` from useAuth
  // The `error` from useAuth might be for global auth issues (e.g., token expiry),
  // we'll use a local state for immediate login/register errors.
  const { login, error: authContextError, clearError: clearAuthContextError } = useAuth();
  const navigate = useNavigate(); // Hook to navigate programmatically

  // State for local component error messages (e.g., failed login/register attempt)
  const [localError, setLocalError] = useState<string | null>(null);

  // Handles the form submission for both login and registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true); // Start loading indicator
    setLocalError(null); // Clear any previous local errors
    clearAuthContextError(); // Clear any global auth context errors

    try {
      let res;
      if (isRegister) {
        // API call for registration
        res = await axios.post(`${API_BASE_URL}/auth/register`, { username, email, password });
      } else {
        // API call for login
        res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      }

      // If the API call is successful, use the 'login' function from AuthContext
      // This function updates the global auth state and stores the token/user.
      // Ensure your backend returns { token: '...', user: { _id: '...', username: '...', email: '...' } }
      login(res.data.token, res.data.user);

      // Navigate to the dashboard upon successful authentication
      navigate('/dashboard');

    } catch (err: any) {
      // Handle API errors (e.g., 400 Bad Request, 401 Unauthorized from backend)
      console.error('Authentication failed:', err);
      // Display the error message from the backend, or a generic one
      setLocalError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  // Function to toggle between login and registration forms
  const toggleFormType = () => {
    setIsRegister(prev => !prev); // Toggle the boolean state
    setLocalError(null); // Clear errors when switching form type
    clearAuthContextError(); // Clear global auth errors when switching
    setUsername(''); // Clear fields
    setEmail('');
    setPassword('');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(45deg, #4F46E5 30%, #6366F1 90%)', // Tailwind indigo gradient
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: { xs: 4, sm: 5 },
          width: '100%',
          maxWidth: 450,
          borderRadius: 3, // Increased border radius for more rounded corners
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'scale(1.02)', // Slight scale effect on hover
          },
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary', mb: 4 }}>
          {isRegister ? 'Register' : 'Login'}
        </Typography>

        {/* Display local error messages for login/register failures */}
        {(localError || authContextError) && (
          <Fade in={!!(localError || authContextError)}>
            <Box sx={{ mb: 3 }}> {/* Wrap Alert in Box for Fade component */}
              <Alert
                severity="error"
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setLocalError(null); // Clear local error
                      clearAuthContextError(); // Clear global error
                    }}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
                sx={{ borderRadius: 2 }}
              >
                {localError || authContextError} {/* Display local error first, then auth context error */}
              </Alert>
            </Box>
          </Fade>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {isRegister && (
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required // Username is required for registration
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          )}
          <TextField
            label="Email Address"
            variant="outlined"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading} // Disable button when loading
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : (isRegister ? 'Register' : 'Login')}
          </Button>
        </Box>
        <Typography variant="body2" align="center" sx={{ mt: 3, color: 'text.secondary' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <MuiLink
            component="button" // Use MuiLink as a button for accessibility
            onClick={toggleFormType} // Use the combined toggle function
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            {isRegister ? 'Login' : 'Register'}
          </MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;
