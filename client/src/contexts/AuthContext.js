import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import api from '../utils/axiosConfig';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null, // Don't load token from localStorage on initial load
  isAuthenticated: false,
  loading: false, // Start with loading false
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'RESTORE_TOKEN':
      return {
        ...state,
        token: action.payload,
        loading: true
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up token in localStorage
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('token', state.token);
    } else {
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Check for stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      dispatch({ type: 'AUTH_START' });
      // Set the token in state to trigger the loadUser effect
      dispatch({ type: 'RESTORE_TOKEN', payload: storedToken });
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const res = await api.get('/api/auth/me');
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: res.data, token: state.token }
          });
        } catch (error) {
          dispatch({ type: 'AUTH_FAILURE', payload: 'Token is invalid' });
          localStorage.removeItem('token');
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    loadUser();
  }, [state.token]);

  // Register user
  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await api.post('/api/auth/register', userData);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: res.data.user,
          token: res.data.accessToken
        }
      });
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  // Login user
  const login = async (credentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await api.post('/api/auth/login', credentials);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: res.data.user,
          token: res.data.accessToken
        }
      });
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout user
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const res = await api.put('/api/auth/me', userData);
      dispatch({ type: 'UPDATE_USER', payload: res.data });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await api.put('/api/auth/change-password', passwordData);
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

