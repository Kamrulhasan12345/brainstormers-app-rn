import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { connectionCleanupService } from '../services/connection-cleanup';
import { notificationUpdateEmitter } from '../hooks/useNotifications';
import GlobalNotificationPopup from '../components/GlobalNotificationPopup';

interface Notification {
  id: string;
  recipient_id: string;
  title: string | null;
  body: string;
  link: string | null;
  expires_at: string | null;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
}

interface GlobalNotificationContextType {
  showNotificationPopup: (notification: Notification) => void;
}

const GlobalNotificationContext = createContext<
  GlobalNotificationContextType | undefined
>(undefined);

export function useGlobalNotification() {
  const context = useContext(GlobalNotificationContext);
  if (!context) {
    throw new Error(
      'useGlobalNotification must be used within a GlobalNotificationProvider'
    );
  }
  return context;
}

interface GlobalNotificationProviderProps {
  children: React.ReactNode;
}

export function GlobalNotificationProvider({
  children,
}: GlobalNotificationProviderProps) {
  const [currentNotification, setCurrentNotification] =
    useState<Notification | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Listen for new notifications in real-time
  useEffect(() => {
    if (!user?.id) return;

    const channelName = `popup_notifications_${user.id}`;
    console.log(
      'GlobalNotificationContext: Setting up popup subscription for user:',
      user.id
    );

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log(
            'GlobalNotificationContext: Notification change for popup:',
            payload
          );

          // Check if this change is for the current user
          const notification = (payload.new || payload.old) as Notification;
          if (!notification || notification.recipient_id !== user.id) {
            console.log(
              'GlobalNotificationContext: Notification not for current user, ignoring'
            );
            return;
          }

          // Emit event to refresh useNotifications data for ANY change
          console.log(
            '🚀 GlobalNotificationContext: Emitting notification update event'
          );
          notificationUpdateEmitter.emit();

          // Only handle INSERT events for popups
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;

            // Show popup for any new notification
            console.log(
              'GlobalNotificationContext: Showing notification popup:',
              newNotification
            );
            setCurrentNotification(newNotification);
          }
        }
      )
      .subscribe((status) => {
        console.log('GlobalNotificationContext subscription status:', status);
        if (status === 'SUBSCRIBED') {
          connectionCleanupService.addSubscription(channelName);
        }
      });

    return () => {
      console.log(
        'GlobalNotificationContext: Unsubscribing from global notifications'
      );
      connectionCleanupService.removeSubscription(channelName);
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const showNotificationPopup = (notification: Notification) => {
    setCurrentNotification(notification);
  };

  const handleNotificationPress = () => {
    // Navigate to the appropriate notifications page based on user role
    if (user?.role === 'admin') {
      router.push('/(admin-tabs)/notifications');
    } else {
      // Both teachers and students use the same notifications page in (tabs)
      router.push('/(tabs)/notifications');
    }
  };

  const handleDismiss = () => {
    setCurrentNotification(null);
  };

  return (
    <GlobalNotificationContext.Provider value={{ showNotificationPopup }}>
      {children}
      <GlobalNotificationPopup
        notification={currentNotification}
        onDismiss={handleDismiss}
        onPress={handleNotificationPress}
      />
    </GlobalNotificationContext.Provider>
  );
}
