import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: any;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  guestLogin: () => Promise<void>;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  // Clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsGuest(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          clearAuthData();
          setLoading(false);
          return;
        }

        // Verify current session
        try {
          const response = await axios.get('http://localhost:3000/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data.user);
          setIsGuest(response.data.user.isGuest || false);
        } catch (error) {
          // If access token fails, try refresh token
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            clearAuthData();
            return;
          }

          try {
            const refreshResponse = await axios.post('http://localhost:3000/api/auth/refresh', { token: refreshToken });
            localStorage.setItem('accessToken', refreshResponse.data.accessToken);
            localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
            setUser(refreshResponse.data.user);
            setIsGuest(refreshResponse.data.user.isGuest || false);
          } catch (refreshError) {
            clearAuthData();
          }
        }
      } catch (error) {
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      clearAuthData(); // Clear any existing auth data first
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password
      });
      
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setUser(response.data.user);
      setIsGuest(response.data.user.isGuest || false);
      toast.success('Logged in successfully');
    } catch (error: any) {
      clearAuthData();
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      clearAuthData(); // Clear any existing auth data first
      await axios.post('http://localhost:3000/api/auth/register', {
        username,
        email,
        password
      });
      toast.success('Registration successful! Please login to continue.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const guestLogin = async () => {
    try {
      clearAuthData(); // Clear any existing auth data first
      const response = await axios.post('http://localhost:3000/api/auth/guest');
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setUser(response.data.user);
      setIsGuest(true);
      toast.success('Logged in as guest');
    } catch (error: any) {
      clearAuthData();
      toast.error(error.response?.data?.error || 'Guest login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axios.post('http://localhost:3000/api/auth/logout', { token: refreshToken });
      }
      clearAuthData();
      toast.success('Logged out successfully');
    } catch (error: any) {
      clearAuthData(); // Clear data even if the server request fails
      toast.error(error.response?.data?.error || 'Logout failed');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, guestLogin, isGuest }}>
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