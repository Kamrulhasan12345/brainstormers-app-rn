import { supabase } from '@/lib/supabase';

interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface SendPushNotificationPayload {
  tokens: string[];
  notification: PushNotificationData;
}

class PushNotificationService {
  /**
   * Send push notifications to multiple devices
   * This would integrate with a Supabase Edge Function or external service
   */
  async sendPushNotifications(
    recipientIds: string[],
    notification: PushNotificationData
  ): Promise<{ success: boolean; results: any[] }> {
    try {
      // Get push tokens for the recipients
      const { data: pushTokens, error } = await supabase
        .from('push_tokens')
        .select('token, user_id')
        .in('user_id', recipientIds)
        .eq('active', true);

      if (error) throw error;

      if (!pushTokens || pushTokens.length === 0) {
        return { success: true, results: [] };
      }

      // Group tokens for batch sending
      const tokens = pushTokens.map((pt) => pt.token);

      // Call Supabase Edge Function for sending push notifications
      const { data, error: funcError } = await supabase.functions.invoke(
        'send-push',
        {
          body: {
            tokens,
            notification,
          } as SendPushNotificationPayload,
        }
      );

      if (funcError) throw funcError;

      return { success: true, results: data?.results || [] };
    } catch (error) {
      console.error('Error sending push notifications:', error);
      return { success: false, results: [] };
    }
  }

  /**
   * Register a push token for a user
   */
  async registerPushToken(userId: string, token: string): Promise<void> {
    try {
      const { error } = await supabase.from('push_tokens').upsert({
        user_id: userId,
        token,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  /**
   * Deactivate push tokens for a user (on logout)
   */
  async deactivatePushTokens(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deactivating push tokens:', error);
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
