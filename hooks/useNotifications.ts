import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/NotificationService';

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

// Global notification data store to prevent multiple simultaneous loads
class NotificationDataStore {
  private static instance: NotificationDataStore;
  private notifications: Notification[] = [];
  private unreadCount: number = 0;
  private isLoading: boolean = false;
  private lastLoadUserId: string | null = null;
  private subscribers: ((data: {
    notifications: Notification[];
    unreadCount: number;
  }) => void)[] = [];

  static getInstance(): NotificationDataStore {
    if (!NotificationDataStore.instance) {
      NotificationDataStore.instance = new NotificationDataStore();
    }
    return NotificationDataStore.instance;
  }

  subscribe(
    callback: (data: {
      notifications: Notification[];
      unreadCount: number;
    }) => void
  ) {
    this.subscribers.push(callback);
    // Immediately call with current data
    callback({
      notifications: this.notifications,
      unreadCount: this.unreadCount,
    });

    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) =>
      callback({
        notifications: this.notifications,
        unreadCount: this.unreadCount,
      })
    );
  }

  async loadNotifications(userId: string): Promise<void> {
    // Prevent multiple simultaneous loads for the same user
    if (this.isLoading && this.lastLoadUserId === userId) {
      console.log('🔄 Notification load already in progress for user:', userId);
      return;
    }

    try {
      this.isLoading = true;
      this.lastLoadUserId = userId;

      console.log('📊 Loading notifications for user:', userId);

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading notifications:', error);
        throw error;
      }

      this.notifications = notifications || [];
      this.unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

      console.log('✅ Loaded notifications:', this.notifications.length);
      console.log(`🔔 Unread notifications: ${this.unreadCount}`);

      this.notifySubscribers();
    } catch (error) {
      console.error('❌ Exception loading notifications:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  markAsRead(notificationId: string) {
    this.notifications = this.notifications.map((n) =>
      n.id === notificationId ? { ...n, is_read: true } : n
    );
    this.unreadCount = this.notifications.filter((n) => !n.is_read).length;
    this.notifySubscribers();
  }
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
  const [permissionStatus, setPermissionStatus] = useState<{
    granted: boolean;
    canAskAgain: boolean;
  }>({ granted: false, canAskAgain: true });
  const { user } = useAuth();

  const store = NotificationDataStore.getInstance();

  // Note: Notification service initialization is handled by NotificationSetup component
  // This hook only uses the service, doesn't initialize it

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(
      ({ notifications: newNotifications, unreadCount: newUnreadCount }) => {
        setNotifications(newNotifications);
        setUnreadCount(newUnreadCount);
      }
    );

    return unsubscribe;
  }, [store]);

  // Load notifications when user changes
  useEffect(() => {
    if (!user?.id) {
      console.log('❌ useNotifications: No user ID provided');
      return;
    }

    setLoading(true);
    store
      .loadNotifications(user.id)
      .catch((err) => setError('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, [user?.id, store]);

  // Check and update permission status
  const checkPermissions = useCallback(async () => {
    const status = await notificationService.getPermissionStatus();
    setPermissionStatus({
      granted: status.granted,
      canAskAgain: status.canAskAgain,
    });
  }, []);

  // Request notification permissions
  const requestPermissions = useCallback(async () => {
    const status = await notificationService.requestPermissions();
    setPermissionStatus({
      granted: status.granted,
      canAskAgain: status.canAskAgain,
    });
    return status.granted;
  }, []);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);

        if (error) {
          console.error('❌ Error marking notification as read:', error);
          throw error;
        }

        // Update store
        store.markAsRead(notificationId);
      } catch (err) {
        console.error('❌ Error marking notification as read:', err);
        throw err;
      }
    },
    [store]
  );

  // Listen to the global notification events to refresh data
  useEffect(() => {
    if (!user?.id) return;

    console.log('🎧 useNotifications: Setting up global notification listener');
    const removeListener = notificationUpdateEmitter.addListener(() => {
      console.log(
        '🔔 useNotifications: Global notification event received, refreshing data'
      );
      store.loadNotifications(user.id!);
    });

    return removeListener;
  }, [user?.id, store]);

  // Simple fallback refresh every 30 seconds to keep unread count updated
  // useEffect(() => {
  //   if (!user?.id) return;

  //   const interval = setInterval(() => {
  //     console.log('🔄 useNotifications: Periodic refresh for unread count');
  //     loadNotifications();
  //   }, 300000); // 5 minutes

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [user?.id, loadNotifications]);

  // Check permissions on hook initialization
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Update badge count when unread count changes
  useEffect(() => {
    notificationService.updateBadgeCount(unreadCount);
  }, [unreadCount]);

  const cleanup = useCallback(() => {
    console.log('useNotifications: Performing cleanup');
    setNotifications([]);
    setUnreadCount(0);
    setError(null);
    setLoading(false);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      await store.loadNotifications(user.id);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      setError('Failed to refresh notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id, store]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    permissionStatus,
    markAsRead,
    cleanup,
    checkPermissions,
    requestPermissions,
    loadNotifications: refreshNotifications, // For backward compatibility
    refreshNotifications,
  };
}
