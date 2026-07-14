import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../api';
import { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

const SESSION_CHECK_INTERVAL = 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const intervalRef = useRef(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setAuthenticated(false);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data.user);
      setAuthenticated(true);
      return data.data.user;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const verifySession = useCallback(async () => {
    try {
      const { data } = await authAPI.verifySession();
      setUser(data.data.user);
      setAuthenticated(true);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    fetchUser();
  }, [fetchUser, clearSession]);

  useEffect(() => {
    if (!authenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      verifySession();
    }, SESSION_CHECK_INTERVAL);

    const handleFocus = () => verifySession();
    window.addEventListener('focus', handleFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('focus', handleFocus);
    };
  }, [authenticated, verifySession]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    setUser(data.data.user);
    setAuthenticated(true);
    return data.data.user;
  };

  const signup = async (formData) => {
    const { data } = await authAPI.signup(formData);
    return data;
  };

  const signupManager = async (formData) => {
    const { data } = await authAPI.signupManager(formData);
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      clearSession();
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authenticated,
      login,
      signup,
      signupManager,
      logout,
      updateUser,
      fetchUser,
      verifySession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
