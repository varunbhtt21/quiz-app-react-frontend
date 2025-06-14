import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email?: string;
  mobile?: string;
  name?: string;
  date_of_birth?: string;
  role: 'admin' | 'student';
  is_active: boolean;
  course_ids?: string[];
  profile_completed?: boolean;
  auth_provider?: 'traditional' | 'otpless';
  registration_status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  role: 'admin' | 'student';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  needsProfileCompletion: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOTPLESS: (token: string, userData: any) => Promise<void>;
  updateUserProfile: (userData: any) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      
      if (storedToken) {
        try {
          // Verify token and get current user
          const userData = await apiService.getCurrentUser() as User;
          setToken(storedToken);
          setUser(userData);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password) as LoginResponse;
      
      // Store token in localStorage FIRST so getCurrentUser() can use it
      localStorage.setItem('access_token', response.access_token);
      
      // Now get actual user data from backend with the stored token
      const actualUserData = await apiService.getCurrentUser() as User;
      
      setToken(response.access_token);
      setUser(actualUserData);
      localStorage.setItem('user', JSON.stringify(actualUserData));
    } catch (error) {
      // Clean up if anything fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      throw error;
    }
  };

  const loginWithOTPLESS = async (accessToken: string, userData: any) => {
    try {
      // First, store the token so API calls can use it immediately
      localStorage.setItem('access_token', accessToken);
      
      const userInfo: User = {
        id: userData.id,
        mobile: userData.mobile,
        name: userData.name,
        email: userData.email,
        date_of_birth: userData.date_of_birth,
        role: userData.role || 'student',
        is_active: true,
        profile_completed: userData.profile_completed || false,
        auth_provider: 'otpless',
        registration_status: userData.registration_status || 'ACTIVE'
      };
      
      // Update localStorage first
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      // Then update React state - this ensures localStorage is always consistent
      setToken(accessToken);
      setUser(userInfo);
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      // Clean up on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      throw error;
    }
  };

  const updateUserProfile = (updatedUserData: any) => {
    if (user) {
      const updatedUser: User = {
        ...user,
        ...updatedUserData,
        profile_completed: true
      };
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  const value: AuthState = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    needsProfileCompletion: !!user && (!user.profile_completed || !user.name || !user.email), // Stricter check: require name, email, and profile_completed flag (date_of_birth checked on backend)
    login,
    loginWithOTPLESS,
    updateUserProfile,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
