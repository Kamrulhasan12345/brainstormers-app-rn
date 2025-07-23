import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { connectionCleanupService } from '../services/connection-cleanup';

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

  // Simple fallback refresh every 3 minutes if subscription fails
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      console.log('useNotifications: Fallback refresh (3 min)');
      loadNotifications();
    }, 180000); // 3 minutes

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

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) {
      console.log('❌ useNotifications: No user ID, skipping subscription');
      return;
    }

    const channelName = `notifications_${user.id}`;
    console.log(
      '🚀 useNotifications: Setting up subscription for user:',
      user.id
    );
    console.log('🚀 useNotifications: Channel name:', channelName);

    const notificationSubscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('🔔 NOTIFICATION CHANGE RECEIVED:', payload);

          // Check if this change is for the current user
          const notification = (payload.new || payload.old) as Notification;
          if (!notification || notification.recipient_id !== user.id) {
            console.log('❌ Notification not for current user, ignoring');
            return;
          }

          if (payload.eventType === 'INSERT') {
            console.log('🆕 NEW NOTIFICATION INSERTED:', payload);
            const newNotification = payload.new as Notification;

            console.log('🆕 Notification details:', {
              id: newNotification.id,
              title: newNotification.title,
              body: newNotification.body,
              is_read: newNotification.is_read,
              recipient_id: newNotification.recipient_id,
            });

            // Check if notification is not expired
            const now = new Date();
            const isExpired =
              newNotification.expires_at &&
              new Date(newNotification.expires_at) <= now;

            if (!isExpired) {
              console.log('✅ Adding notification to list');
              // Add new notification to the beginning of the list
              setNotifications((prev) => {
                console.log('📝 Previous notifications count:', prev.length);
                const newList = [newNotification, ...prev];
                console.log('📝 New notifications count:', newList.length);
                return newList;
              });

              // Update unread count if notification is unread
              if (!newNotification.is_read) {
                console.log('🔔 UPDATING UNREAD COUNT - NEW NOTIFICATION');
                setUnreadCount((prev) => {
                  const newCount = prev + 1;
                  console.log(`🔔 Unread count: ${prev} → ${newCount}`);
                  return newCount;
                });
              } else {
                console.log(
                  '📖 New notification is already read, not incrementing count'
                );
              }
            } else {
              console.log('⏰ Notification is expired, not adding');
            }
          } else if (payload.eventType === 'UPDATE') {
            console.log('🔄 NOTIFICATION UPDATED:', payload);
            const updatedNotification = payload.new as Notification;
            const oldNotification = payload.old as Notification;

            console.log('🔄 Update details:', {
              id: updatedNotification.id,
              old_is_read: oldNotification.is_read,
              new_is_read: updatedNotification.is_read,
            });

            // Update notification in the list
            setNotifications((prev) =>
              prev.map((notification) =>
                notification.id === updatedNotification.id
                  ? updatedNotification
                  : notification
              )
            );

            // Update unread count if read status changed
            if (oldNotification.is_read !== updatedNotification.is_read) {
              if (updatedNotification.is_read && !oldNotification.is_read) {
                // Notification was marked as read
                console.log('🔔 UPDATING UNREAD COUNT - MARKED AS READ');
                setUnreadCount((prev) => {
                  const newCount = Math.max(0, prev - 1);
                  console.log(
                    `🔔 Unread count decreased: ${prev} → ${newCount}`
                  );
                  return newCount;
                });
              } else if (
                !updatedNotification.is_read &&
                oldNotification.is_read
              ) {
                // Notification was marked as unread (rare case)
                console.log('🔔 UPDATING UNREAD COUNT - MARKED AS UNREAD');
                setUnreadCount((prev) => {
                  const newCount = prev + 1;
                  console.log(
                    `🔔 Unread count increased: ${prev} → ${newCount}`
                  );
                  return newCount;
                });
              }
            } else {
              console.log(
                '📝 Read status unchanged, no unread count update needed'
              );
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ NOTIFICATION DELETED:', payload);
            const deletedNotification = payload.old as Notification;

            // Remove notification from the list
            setNotifications((prev) =>
              prev.filter(
                (notification) => notification.id !== deletedNotification.id
              )
            );

            // Update unread count if deleted notification was unread
            if (!deletedNotification.is_read) {
              console.log(
                '🔔 UPDATING UNREAD COUNT - DELETED UNREAD NOTIFICATION'
              );
              setUnreadCount((prev) => {
                const newCount = Math.max(0, prev - 1);
                console.log(`🔔 Unread count decreased: ${prev} → ${newCount}`);
                return newCount;
              });
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 SUBSCRIPTION STATUS CHANGED:', status);
        if (err) {
          console.error('❌ SUBSCRIPTION ERROR:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ SUCCESSFULLY SUBSCRIBED TO NOTIFICATIONS!');
          console.log('✅ Channel name:', channelName);
          connectionCleanupService.addSubscription(channelName);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ CHANNEL ERROR');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ SUBSCRIPTION TIMED OUT');
        } else if (status === 'CLOSED') {
          console.log('🔒 SUBSCRIPTION CLOSED');
        }
      });

    return () => {
      console.log('🧹 useNotifications: Unsubscribing from', channelName);
      connectionCleanupService.removeSubscription(channelName);
      notificationSubscription.unsubscribe();
    };
  }, [user?.id]);

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
