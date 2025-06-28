// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Define the shape of the user object
interface IUser {
  _id: string;
  username: string;
  email: string;
  // Add any other user properties your backend returns upon successful login
}

// Define the shape of the AuthContext
interface AuthContextType {
  user: IUser | null;
  token: string | null;
  login: (token: string, user: IUser) => void;
  logout: () => void;
  isLoading: boolean; // To indicate if auth state is being loaded
  error: string | null; // For auth-related errors (e.g., login failure)
  clearError: () => void; // Function to clear the error state
}

// Create the context with default null values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Base URL for your backend API (ensure this matches your backend's port)
const API_BASE_URL = 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to load authentication state from local storage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load auth state from local storage:", e);
      // Clear potentially corrupt data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false); // Authentication state loaded
    }
  }, []);

  // Login function: stores token and user in state and local storage
  const login = useCallback((newToken: string, newUser: IUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setError(null); // Clear any previous errors on successful login
  }, []);

  // Logout function: clears state and local storage
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setError(null); // Clear any errors on logout
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user,
    token,
    login,
    logout,
    isLoading,
    error,
    clearError,
  }), [user, token, login, logout, isLoading, error, clearError]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
