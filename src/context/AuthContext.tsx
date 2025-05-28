
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Simulated API call - replace with actual API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const data = await response.json();
      
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      // For demo purposes, we'll simulate different users
      if (email === 'admin@quiz.com' && password === 'admin123') {
        const mockAdmin = {
          id: '1',
          email: 'admin@quiz.com',
          first_name: 'Admin',
          last_name: 'User',
          is_admin: true,
        };
        const mockToken = 'mock-admin-token';
        
        setToken(mockToken);
        setUser(mockAdmin);
        localStorage.setItem('access_token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockAdmin));
      } else if (email === 'student@quiz.com' && password === 'student123') {
        const mockStudent = {
          id: '2',
          email: 'student@quiz.com',
          first_name: 'Student',
          last_name: 'User',
          is_admin: false,
        };
        const mockToken = 'mock-student-token';
        
        setToken(mockToken);
        setUser(mockStudent);
        localStorage.setItem('access_token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockStudent));
      } else {
        throw new Error('Invalid credentials');
      }
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
    isAdmin: user?.is_admin || false,
    isStudent: user ? !user.is_admin : false,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
