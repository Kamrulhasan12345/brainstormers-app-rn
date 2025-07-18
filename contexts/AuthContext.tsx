import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, User, LoginCredentials } from '@/types/auth';
import { authService } from '@/services/auth';
import { supabase } from '@/lib/supabase';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check initial session
    checkAuthState();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_OUT' || !session?.user) {
        console.log('User signed out, clearing state');
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          console.log('User signed in, fetching profile');
          const user = await authService.getCurrentUser();
          console.log('User profile loaded:', user);
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: !!user,
          });
        } catch (error) {
          console.error('Error getting user profile:', error);
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('Checking initial auth state...');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        console.log('Found existing session, fetching user profile');
        const user = await authService.getCurrentUser();
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: !!user,
        });
      } else {
        console.log('No existing session found');
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
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
      console.log('Login attempt started');
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const user = await authService.login(credentials);
      console.log('Login successful, user:', user.role);
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      console.log('Refreshing user profile...');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const user = await authService.getCurrentUser();
        console.log('User profile refreshed:', user);
        setAuthState((prev) => ({
          ...prev,
          user,
        }));
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const logout = async () => {
    try {
      console.log('Logout initiated');

      // Immediately clear the state to prevent UI issues
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      // Sign out from Supabase
      await authService.logout();

      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, ensure the state is cleared
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, refreshUser }}>
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
