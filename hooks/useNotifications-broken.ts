import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

inter  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen to the global notification events to refresh data
  useEffect(() => {
    console.log('🎧 useNotifications: Setting up global notification listener');
    const removeListener = notificationUpdateEmitter.addListener(() => {
      console.log('🔔 useNotifications: Global notification event received, refreshing data');
      loadNotifications();
    });

    return removeListener;
  }, [loadNotifications]);

  // Simple fallback refresh every 30 seconds to keep unread count updated
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      console.log('🔄 useNotifications: Periodic refresh for unread count');
      loadNotifications();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [user?.id, loadNotifications]); {
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

// Simple event emitter for notification updates
class NotificationEventEmitter {
  private listeners: (() => void)[] = [];

  addListener(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  emit() {
    this.listeners.forEach(callback => callback());
  }
}

export const notificationUpdateEmitter = new NotificationEventEmitter();

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Enhanced logging for unread count changes
  useEffect(() => {
    console.log(`🔔 UNREAD COUNT CHANGED: ${unreadCount} for user ${user?.id}`);
  }, [unreadCount, user?.id]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        console.log('❌ loadNotifications: No user ID');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      console.log(
        '📥 loadNotifications: Fetching notifications for user:',
        user.id
      );

      // Fetch notifications for the current user
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      console.log(
        '📥 loadNotifications: Raw data received:',
        data?.length || 0,
        'notifications'
      );

      // Filter out expired notifications
      const now = new Date();
      const validNotifications = (data || []).filter((notification) => {
        if (!notification.expires_at) return true;
        return new Date(notification.expires_at) > now;
      });

      console.log(
        '📥 loadNotifications: Valid notifications:',
        validNotifications.length
      );

      setNotifications(validNotifications);

      // Count unread notifications
      const unread = validNotifications.filter((n) => !n.is_read).length;
      console.log('🔔 loadNotifications: Setting unread count to:', unread);
      setUnreadCount(unread);
    } catch (error) {
      console.error(
        '❌ loadNotifications: Error loading notifications:',
        error
      );
      setError(
        error instanceof Error ? error.message : 'Failed to load notifications'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      if (!user?.id) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Simple fallback refresh every 30 seconds to keep unread count updated
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      console.log('� useNotifications: Periodic refresh for unread count');
      loadNotifications();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [user?.id, loadNotifications]);

  const cleanup = useCallback(() => {
    console.log('useNotifications: Performing cleanup');
    setNotifications([]);
    setUnreadCount(0);
    setError(null);
    setLoading(false);
  }, []);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    latestNotification: notifications[0] || null,
    cleanup,
  };
}
