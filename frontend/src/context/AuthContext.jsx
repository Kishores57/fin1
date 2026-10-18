import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authApi.getCurrentUser());
  const [token, setToken] = useState(() => authApi.getToken());
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetTabAfterAuth, setTargetTabAfterAuth] = useState('register');
  const [authSuccessCallback, setAuthSuccessCallback] = useState(null);

  // Verify and refresh stored profile on mount
  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      const storedToken = authApi.getToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const data = await authApi.getMe();
        if (!cancelled && data?.user) {
          setUser(data.user);
          setToken(storedToken);
        }
      } catch (err) {
        // If token expired or invalid, clear session
        if (!cancelled) {
          authApi.logout();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const register = async (userData) => {
    const data = await authApi.register(userData);
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setToken(null);
  };

  const refreshProfile = async () => {
    try {
      const data = await authApi.getMe();
      if (data?.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  /**
   * Helper to request authentication before entering a feature.
   * If already authenticated, runs action immediately.
   * If not, opens Auth modal and executes callback after login.
   */
  const requireAuth = (targetTab = 'register', onAuthenticated = null) => {
    if (user && token) {
      if (onAuthenticated) onAuthenticated(user);
      return true;
    }
    setTargetTabAfterAuth(targetTab);
    setAuthSuccessCallback(() => onAuthenticated);
    setShowAuthModal(true);
    return false;
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setShowAuthModal(false);
    if (authSuccessCallback && typeof authSuccessCallback === 'function') {
      authSuccessCallback(authenticatedUser);
      setAuthSuccessCallback(null);
    }
  };

  const value = {
    user,
    token,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    isAuthenticated: Boolean(user && token),
    loading,
    login,
    register,
    logout,
    refreshProfile,
    showAuthModal,
    setShowAuthModal,
    targetTabAfterAuth,
    setTargetTabAfterAuth,
    requireAuth,
    handleAuthSuccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
