import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, post } from '../utils/apiUtils';

interface User {
  id: string;
  email: string;
  name: string;
  apiKey?: string;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    defaultAnalysisDepth: 'basic' | 'advanced';
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const userData = await get<User>('/auth/me');
          setUser(userData);
        }
      } catch (err) {
        localStorage.removeItem('auth_token');
        setError('Session expired. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await post<{ token: string; user: User }>('/auth/login', {
        email,
        password,
      });
      
      localStorage.setItem('auth_token', response.token);
      if (response.user.apiKey) {
        localStorage.setItem('seranking_api_key', response.user.apiKey);
      }
      
      setUser(response.user);
    } catch (err) {
      setError('Invalid email or password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await post<{ token: string; user: User }>('/auth/register', {
        email,
        password,
        name,
      });
      
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
    } catch (err) {
      setError('Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await post('/auth/logout', {});
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('seranking_api_key');
      setUser(null);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await post<User>('/auth/update', updates);
      setUser(updatedUser);
      
      if (updates.apiKey) {
        localStorage.setItem('seranking_api_key', updates.apiKey);
      }
    } catch (err) {
      setError('Failed to update user information');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
