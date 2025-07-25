import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, LoginCredentials } from '@/types/auth';
import { authService } from '@/services/auth';
import { supabase } from '@/lib/supabase';
import { connectionCleanupService } from '@/services/connection-cleanup';
import { pushTokenService } from '@/services/push-token-management';

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
    // Configure push notifications
    pushTokenService.configureNotifications();

    // Initialize periodic cleanup (only once per app session)
    pushTokenService.initializePeriodicCleanup();

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

          // Register push token for the user
          if (user) {
            await pushTokenService.registerPushToken(user.id);
          }
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

        // Register push token for returning user
        if (user) {
          await pushTokenService.registerPushToken(user.id);
        }
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
      console.log('Logout initiated - starting graceful shutdown');

      // Get current user ID before clearing state
      const currentUserId = authState.user?.id;

      // First, get connection status before cleanup
      const connectionStatus = connectionCleanupService.getStatus();
      console.log('Active connections before logout:', connectionStatus);

      // Deactivate only current device's push token before clearing state
      if (currentUserId) {
        console.log('Deactivating current device push token...');
        await pushTokenService.deactivateCurrentDeviceToken(currentUserId);
      }

      // Immediately clear the state to prevent UI issues
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      // Clean up all realtime connections
      console.log('Cleaning up realtime connections...');
      await connectionCleanupService.cleanupAllConnections();

      // Sign out from Supabase
      console.log('Signing out from Supabase...');
      await authService.logout();

      console.log('Logout completed successfully - all connections cleaned up');
    } catch (error) {
      console.error('Error during logout:', error);

      // Even if there's an error, ensure cleanup is attempted and state is cleared
      try {
        await connectionCleanupService.cleanupAllConnections();
      } catch (cleanupError) {
        console.error('Error during emergency cleanup:', cleanupError);
      }

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
