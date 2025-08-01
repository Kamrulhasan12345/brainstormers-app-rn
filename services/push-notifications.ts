import { supabase } from '@/lib/supabase';
import { notificationService } from './NotificationService';

interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

class PushNotificationService {
  /**
   * Send push notifications to multiple devices using the new notification service
   */
  async sendPushNotifications(
    recipientIds: string[],
    notification: PushNotificationData
  ): Promise<{ success: boolean; results: any[] }> {
    return await notificationService.sendPushNotifications(
      recipientIds,
      notification
    );
  }

  /**
   * Send immediate notifications to dispatch all pending notifications
   */
  async sendImmediateNotifications(): Promise<boolean> {
    return await notificationService.sendImmediateNotifications();
  }

  /**
   * Dispatch pending notifications using your Edge Function
   */
  async dispatchPendingNotifications(): Promise<boolean> {
    return await notificationService.dispatchPendingNotifications();
  }

  /**
   * Trigger routine notification processing
   */
  async sendRoutineNotifications(): Promise<boolean> {
    return await notificationService.sendRoutineNotifications();
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    notification: PushNotificationData,
    delayMs?: number
  ): Promise<string> {
    // Pass undefined for immediate, or use the notification service directly
    return await notificationService.scheduleLocalNotification(
      notification,
      undefined
    );
  }

  /**
   * Register a push token for a user (legacy method - prefer using pushTokenService directly)
   */
  async registerPushToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web'
  ): Promise<void> {
    try {
      const { error } = await supabase.from('push_tokens').upsert({
        user_id: userId,
        token,
        platform,
        last_active: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  /**
   * Deactivate ALL push tokens for a user (ADMIN FUNCTION - use with caution)
   * This will log the user out of ALL devices!
   */
  async deactivateAllPushTokens(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deactivating all push tokens:', error);
      throw error;
    }
  }

  /**
   * Deactivate a specific push token (safer for single device logout)
   */
  async deactivateSpecificPushToken(
    userId: string,
    token: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);

      if (error) throw error;
    } catch (error) {
      console.error('Error deactivating specific push token:', error);
      throw error;
    }
  }

  /**
   * Send notification with automatic push notification
   * This combines database insertion with push notification sending
   */
  async sendNotificationWithPush(
    recipientIds: string[],
    notificationData: {
      title?: string;
      body: string;
      type: 'info' | 'warning' | 'success' | 'error';
      link?: string;
      expires_at?: string;
    }
  ): Promise<{ notificationIds: string[]; pushResults: any[] }> {
    try {
      // Insert notifications into database
      const notifications = recipientIds.map((recipientId) => ({
        recipient_id: recipientId,
        title: notificationData.title || null,
        body: notificationData.body,
        type: notificationData.type,
        link: notificationData.link || null,
        expires_at: notificationData.expires_at || null,
      }));

      const { data: insertedNotifications, error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select('id');

      if (insertError) throw insertError;

      // Send push notifications
      const pushResults = await this.sendPushNotifications(recipientIds, {
        title: notificationData.title || 'New Notification',
        body: notificationData.body,
        data: {
          type: notificationData.type,
          link: notificationData.link,
        },
      });

      return {
        notificationIds: insertedNotifications?.map((n) => n.id) || [],
        pushResults: pushResults.results,
      };
    } catch (error) {
      console.error('Error sending notification with push:', error);
      throw error;
    }
  }

  /**
   * Send scheduled notification (for future implementation)
   */
  async scheduleNotification(
    recipientIds: string[],
    notificationData: {
      title?: string;
      body: string;
      type: 'info' | 'warning' | 'success' | 'error';
      link?: string;
      expires_at?: string;
    },
    scheduledFor: Date
  ): Promise<{ success: boolean; scheduledIds: string[] }> {
    try {
      // Insert notifications with scheduled_for timestamp
      const notifications = recipientIds.map((recipientId) => ({
        recipient_id: recipientId,
        title: notificationData.title || null,
        body: notificationData.body,
        type: notificationData.type,
        link: notificationData.link || null,
        expires_at: notificationData.expires_at || null,
        scheduled_for: scheduledFor.toISOString(),
        sent_at: null, // Will be set when actually sent
      }));

      const { data: insertedNotifications, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select('id');

      if (error) throw error;

      return {
        success: true,
        scheduledIds: insertedNotifications?.map((n) => n.id) || [],
      };
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
