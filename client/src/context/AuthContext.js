import React, {createContext, useState, useEffect, useContext} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Helper to decode JWT and get expiration
const getTokenExpiration = token => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Set axios default header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      fetchUser();
      checkTokenExpiration();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  // Check token expiration periodically
  const checkTokenExpiration = () => {
    if (!token) return;

    const expiration = getTokenExpiration(token);
    if (!expiration) return;

    const now = Date.now();
    const timeUntilExpiry = expiration - now;

    // If token already expired
    if (timeUntilExpiry <= 0) {
      handleSessionExpired();
      return;
    }

    // Warn 1 hour before expiration
    const warningTime = 60 * 60 * 1000; // 1 hour in ms
    if (timeUntilExpiry <= warningTime) {
      const minutesLeft = Math.floor(timeUntilExpiry / 60000);
      toast.warning(
        `הסשן שלך יפוג בעוד ${minutesLeft} דקות. מומלץ להתחבר מחדש.`,
        {autoClose: 10000},
      );
    }

    // Set timeout to check again or to expire
    const checkInterval = Math.min(
      timeUntilExpiry - warningTime,
      5 * 60 * 1000,
    ); // Check every 5 minutes or when warning needed
    if (checkInterval > 0) {
      const timeout = setTimeout(checkTokenExpiration, checkInterval);
      return () => clearTimeout(timeout);
    }
  };

  // Handle expired session
  const handleSessionExpired = () => {
    setSessionExpired(true);
    toast.error('פג תוקף הסשן. עליך להתחבר מחדש כדי להמשיך.', {
      autoClose: false,
      closeOnClick: false,
    });
    logout();
  };

  // Axios interceptor for 401 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          const message = error.response?.data?.message || '';
          if (
            message.includes('Token') ||
            message.includes('expired') ||
            message.includes('invalid')
          ) {
            handleSessionExpired();
          }
        }
        return Promise.reject(error);
      },
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
      setSessionExpired(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      // Token expired or invalid
      if (err.response?.status === 401) {
        handleSessionExpired();
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = newToken => {
    setSessionExpired(false);
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    sessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
