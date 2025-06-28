import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, User, LoginCredentials } from '@/types/auth';
import { authService } from '@/services/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const user = await authService.getCurrentUser();
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });
    } catch (error) {
      console.error('Error checking auth state:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const user = await authService.login(credentials);
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
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