'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bio?: string;
  profilePicture?: string;
  profilePictureUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (firstName: string, password: string) => Promise<{ success: boolean }>;
  register: (firstName: string, lastName: string, email: string, phoneNumber: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateProfilePicture: (pictureUrl: string) => void;
  updateUser: (user: User) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          console.log('Profile response:', response.data);
          setUser(response.data.user);
          setToken(storedToken);
          
          // Set the token in axios defaults for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (error) {
          console.error('Profile fetch error:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (firstName: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        firstName,
        password
      });
      
      console.log('Login response:', response.data);
      const { user: userData, token: authToken } = response.data;
      
      if (!authToken) {
        throw new Error('No token received');
      }
      
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      
      // Set cookie for middleware
      document.cookie = `token=${authToken}; path=/`;
      
      // Set the token in axios defaults for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  };

  const register = async (firstName: string, lastName: string, email: string, phoneNumber: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        firstName,
        lastName,
        email,
        phoneNumber
      });
      return response.data;
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfilePicture = (pictureUrl: string) => {
    if (user) {
      setUser({ ...user, profilePicture: pictureUrl });
    }
  };

  const updateUser = (updatedUser: User) => {
    console.log('Updating user in context:', updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      isLoading,
      updateProfilePicture,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 