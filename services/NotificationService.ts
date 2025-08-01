import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationResponse {
  notification: Notifications.Notification;
  actionIdentifier: string;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

class NotificationService {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private isInitialized = false;

  /**
   * Initialize the notification service
   * Should be called once during app startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set up notification categories
      await this.setupNotificationCategories();

      // Set up listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
    this.isInitialized = false;
  }

  /**
   * Setup notification categories and actions
   */
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('exam', [
      {
        identifier: 'view_exam',
        buttonTitle: 'View Exam',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { isDestructive: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('lecture', [
      {
        identifier: 'view_lecture',
        buttonTitle: 'View Lecture',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { isDestructive: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('general', [
      {
        identifier: 'view',
        buttonTitle: 'View',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { isDestructive: true },
      },
    ]);
  }

  /**
   * Setup notification listeners for foreground and response handling
   */
  private setupNotificationListeners(): void {
    // Listen for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Foreground notification received:', notification);
        this.handleForegroundNotification(notification);
      }
    );

    // Listen for notification responses (user tapped notification)
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('👆 Notification response received:', response);
        this.handleNotificationResponse(response);
      });
  }

  /**
   * Handle notifications received while app is in foreground
   */
  private handleForegroundNotification(
    notification: Notifications.Notification
  ): void {
    const { request } = notification;
    const { content } = request;

    // You can customize foreground behavior here
    // For example, show a custom in-app notification banner
    console.log('Foreground notification:', {
      title: content.title,
      body: content.body,
      data: content.data,
    });

    // Update badge count
    this.updateBadgeCount();
  }

  /**
   * Handle notification tap responses and navigation
   */
  private handleNotificationResponse(response: NotificationResponse): void {
    const { notification, actionIdentifier } = response;
    const { data } = notification.request.content;

    console.log('Handling notification response:', {
      actionIdentifier,
      data,
    });

    // Handle different action types
    switch (actionIdentifier) {
      case 'view_exam':
      case 'view_lecture':
      case 'view':
        this.navigateFromNotification(data);
        break;
      case 'dismiss':
        // Just dismiss, no action needed
        break;
      default:
        // Default tap behavior
        this.navigateFromNotification(data);
        break;
    }

    // Clear badge after handling
    this.clearBadge();
  }

  /**
   * Navigate to appropriate screen based on notification data
   */
  private navigateFromNotification(data: any): void {
    if (!data) return;

    try {
      const { type, id, route } = data;

      if (route) {
        // Direct route specified
        router.push(route);
        return;
      }

      // Navigate based on type
      switch (type) {
        case 'exam':
          if (id) {
            router.push(`/(tabs)/exams/${id}`);
          } else {
            router.push('/(tabs)/exams');
          }
          break;
        case 'lecture':
          if (id) {
            router.push(`/(tabs)/lectures/${id}`);
          } else {
            router.push('/(tabs)/lectures');
          }
          break;
        case 'notification':
        case 'general':
          router.push('/(tabs)/notifications');
          break;
        default:
          // Default to notifications screen
          router.push('/(tabs)/notifications');
          break;
      }
    } catch (error) {
      console.error('❌ Navigation error from notification:', error);
      // Fallback to notifications screen
      router.push('/(tabs)/notifications');
    }
  }

  /**
   * Check and request notification permissions
   */
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();

    return {
      granted: status === 'granted',
      canAskAgain,
      status,
    };
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    const { status, canAskAgain } = await Notifications.requestPermissionsAsync(
      {
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: false,
          provideAppNotificationSettings: true,
          allowProvisional: false,
        },
      }
    );

    return {
      granted: status === 'granted',
      canAskAgain,
      status,
    };
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    notification: NotificationPayload,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: 'default',
        badge: 1,
        categoryIdentifier: this.getCategoryFromData(notification.data),
      },
      trigger: trigger || null, // null = immediate
    });

    return notificationId;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Update app badge count
   */
  async updateBadgeCount(count?: number): Promise<void> {
    try {
      if (count !== undefined) {
        await Notifications.setBadgeCountAsync(count);
      } else {
        // Get unread notification count from database
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { count: unreadCount, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);

        if (!error && unreadCount !== null) {
          await Notifications.setBadgeCountAsync(unreadCount);
        }
      }
    } catch (error) {
      console.error('❌ Error updating badge count:', error);
    }
  }

  /**
   * Clear app badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Check if device supports notifications
   */
  isDeviceSupported(): boolean {
    return Device.isDevice && Platform.OS !== 'web';
  }

  /**
   * Get notification category based on data
   */
  private getCategoryFromData(data?: Record<string, any>): string {
    if (!data) return 'general';

    const { type } = data;
    switch (type) {
      case 'exam':
        return 'exam';
      case 'lecture':
        return 'lecture';
      default:
        return 'general';
    }
  }

  /**
   * Send push notifications via Supabase Edge Function
   */
  async sendPushNotifications(
    recipientIds: string[],
    notification: NotificationPayload
  ): Promise<{ success: boolean; results: any[] }> {
    try {
      // Get push tokens for the recipients
      const { data: pushTokens, error } = await supabase
        .from('push_tokens')
        .select('token, user_id')
        .in('user_id', recipientIds);

      if (error) throw error;

      if (!pushTokens || pushTokens.length === 0) {
        console.log('No push tokens found for recipients');
        return { success: true, results: [] };
      }

      // Extract tokens
      const tokens = pushTokens.map((pt) => pt.token);

      // Call Supabase Edge Function
      const { data, error: funcError } = await supabase.functions.invoke(
        'send-push',
        {
          body: {
            tokens,
            notification,
          },
        }
      );

      if (funcError) throw funcError;

      console.log('✅ Push notifications sent successfully:', data);
      return { success: true, results: data?.results || [] };
    } catch (error) {
      console.error('❌ Error sending push notifications:', error);
      return { success: false, results: [] };
    }
  }

  /**
   * Send immediate notifications (calls your existing Supabase function)
   */
  async sendImmediateNotifications(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'send-immediate',
        {
          body: {},
        }
      );

      if (error) throw error;

      console.log('✅ Immediate notifications sent:', data);
      return true;
    } catch (error) {
      console.error('❌ Error sending immediate notifications:', error);
      return false;
    }
  }

  /**
   * Dispatch pending notifications (calls your dispatch function)
   */
  async dispatchPendingNotifications(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'dispatch-pending-notifications',
        {
          body: {},
        }
      );

      if (error) throw error;

      console.log('✅ Pending notifications dispatched:', data);
      return true;
    } catch (error) {
      console.error('❌ Error dispatching pending notifications:', error);
      return false;
    }
  }

  /**
   * Trigger routine notification sending
   */
  async sendRoutineNotifications(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-routine', {
        body: {},
      });

      if (error) throw error;

      console.log('✅ Routine notifications processed:', data);
      return true;
    } catch (error) {
      console.error('❌ Error processing routine notifications:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
