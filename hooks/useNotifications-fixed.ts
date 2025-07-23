import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

// Simple event emitter for notification updates
class NotificationEventEmitter {
  private listeners: (() => void)[] = [];

  addListener(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  emit() {
    this.listeners.forEach((callback) => callback());
  }
}

export const notificationUpdateEmitter = new NotificationEventEmitter();

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ useNotifications: No user ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📱 Loading notifications for user:', user.id);

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading notifications:', error);
        setError('Failed to load notifications');
        return;
      }

      console.log('✅ Loaded notifications:', notifications?.length || 0);
      setNotifications(notifications || []);

      // Calculate unread count
      const unread = notifications?.filter((n) => !n.is_read).length || 0;
      console.log(`🔔 Unread notifications: ${unread}`);
      setUnreadCount(unread);
    } catch (err) {
      console.error('❌ Exception loading notifications:', err);
      setError('Failed to load notifications');
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

      if (error) {
        console.error('❌ Error marking notification as read:', error);
        throw error;
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Listen to the global notification events to refresh data
  useEffect(() => {
    console.log('🎧 useNotifications: Setting up global notification listener');
    const removeListener = notificationUpdateEmitter.addListener(() => {
      console.log(
        '🔔 useNotifications: Global notification event received, refreshing data'
      );
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
    unreadCount,
    loading,
    error,
    markAsRead,
    reload: loadNotifications,
    cleanup,
  };
}
