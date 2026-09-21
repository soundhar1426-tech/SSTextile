import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('gtex_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('gtex_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    const savedUser = localStorage.getItem('gtex_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser)?.role === 'admin';
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  // Verify and hydrate current user on initial mount
  useEffect(() => {
    const verifyUserSession = async () => {
      const storedToken = localStorage.getItem('gtex_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success && response.data.user) {
          setCurrentUser(response.data.user);
          setIsAdmin(response.data.user.role === 'admin');
          localStorage.setItem('gtex_user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.warn('[AuthContext] Session verification expired or failed. Clearing credentials.');
        localStorage.removeItem('gtex_token');
        localStorage.removeItem('gtex_user');
        setToken(null);
        setCurrentUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verifyUserSession();
  }, []);

  /**
   * Register a new Customer account via backend API
   */
  const registerCustomer = async (formData) => {
    try {
      const response = await api.post('/auth/register', formData);
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data;
        localStorage.setItem('gtex_token', receivedToken);
        localStorage.setItem('gtex_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setCurrentUser(receivedUser);
        setIsAdmin(receivedUser.role === 'admin');
        return { success: true, user: receivedUser };
      }
      return { success: false, error: response.data.message || 'Registration failed' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, error: message };
    }
  };

  /**
   * Authenticate customer via email and password
   */
  const loginCustomer = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data;
        localStorage.setItem('gtex_token', receivedToken);
        localStorage.setItem('gtex_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setCurrentUser(receivedUser);
        setIsAdmin(receivedUser.role === 'admin');
        return { success: true, user: receivedUser };
      }
      return { success: false, error: response.data.message || 'Login failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid email or password';
      return { success: false, error: message };
    }
  };

  /**
   * Authenticate admin via email and password with backend role verification
   */
  const loginAdmin = async (email, password) => {
    try {
      const response = await api.post('/auth/admin/login', { email, password });
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data;
        localStorage.setItem('gtex_token', receivedToken);
        localStorage.setItem('gtex_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setCurrentUser(receivedUser);
        setIsAdmin(true);
        return { success: true, user: receivedUser };
      }
      return { success: false, error: response.data.message || 'Admin login failed' };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid admin credentials';
      return { success: false, error: message };
    }
  };

  /**
   * Update profile information for authenticated customer
   */
  const updateProfile = async (formData) => {
    try {
      const response = await api.put('/auth/profile', formData);
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        localStorage.setItem('gtex_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setIsAdmin(updatedUser.role === 'admin');
        return {
          success: true,
          user: updatedUser,
          settings: response.data.settings || null,
          message: response.data.message,
        };
      }
      return { success: false, error: response.data.message || 'Failed to update profile' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update profile';
      return { success: false, error: message };
    }
  };

  /**
   * Logout user and clear all stored authentication tokens
   */
  const logout = () => {
    localStorage.removeItem('gtex_token');
    localStorage.removeItem('gtex_user');
    setToken(null);
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const logoutAdmin = () => {
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        currentUser,
        isAdmin,
        isAuthenticated: !!token && !!currentUser,
        loading,
        registerCustomer,
        loginCustomer,
        loginAdmin,
        updateProfile,
        logout,
        logoutAdmin,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
