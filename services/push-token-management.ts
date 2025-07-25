import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase, isDemoMode } from '@/lib/supabase';

interface PushTokenData {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

class PushTokenService {
  private currentToken: string | null = null;

  /**
   * Get the device's push notification token
   */
  async getExpoPushToken(): Promise<PushTokenData | null> {
    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Check for existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return null;
      }

      // Get the push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId:
          Constants.expoConfig?.extra?.eas?.projectId ||
          process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      const platform =
        Platform.OS === 'ios'
          ? 'ios'
          : Platform.OS === 'android'
          ? 'android'
          : 'web';

      this.currentToken = token.data;

      return {
        token: token.data,
        platform,
      };
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register push token for a user in the database
   */
  async registerPushToken(userId: string): Promise<void> {
    if (isDemoMode()) {
      console.log('Push token registration skipped in demo mode');
      return;
    }

    try {
      const tokenData = await this.getExpoPushToken();
      if (!tokenData) {
        console.log('No push token available for registration');
        return;
      }

      // Check if this exact token already exists for this user
      const { data: existingToken } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('token', tokenData.token)
        .single();

      if (existingToken) {
        // Token already exists, just update the last_active timestamp
        const { error } = await supabase
          .from('push_tokens')
          .update({ last_active: new Date().toISOString() })
          .eq('id', existingToken.id);

        if (error) {
          console.error('Error updating existing push token:', error);
        } else {
          console.log('Existing push token updated for user:', userId);
        }
        return;
      }

      // Register the new token (don't delete existing tokens for other devices)
      const { error } = await supabase.from('push_tokens').insert({
        user_id: userId,
        token: tokenData.token,
        platform: tokenData.platform,
        last_active: new Date().toISOString(),
      });

      if (error) {
        console.error('Error registering push token:', error);
        throw error;
      }

      console.log('New push token registered successfully for user:', userId);
    } catch (error) {
      console.error('Error in registerPushToken:', error);
      // Don't throw the error as push token registration shouldn't block login
    }
  }

  /**
   * Update the last_active timestamp for the current token
   */
  async updateTokenActivity(userId: string): Promise<void> {
    if (isDemoMode() || !this.currentToken) {
      return;
    }

    try {
      const { error } = await supabase
        .from('push_tokens')
        .update({ last_active: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('token', this.currentToken);

      if (error) {
        console.error('Error updating token activity:', error);
      }
    } catch (error) {
      console.error('Error in updateTokenActivity:', error);
    }
  }

  /**
   * Deactivate only the current device's push token (called on logout)
   */
  async deactivateCurrentDeviceToken(userId: string): Promise<void> {
    if (isDemoMode()) {
      console.log('Push token deactivation skipped in demo mode');
      return;
    }

    if (!this.currentToken) {
      console.log('No current token to deactivate');
      return;
    }

    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', this.currentToken);

      if (error) {
        console.error('Error deactivating current device token:', error);
        throw error;
      }

      console.log('Current device push token deactivated for user:', userId);
      this.currentToken = null;
    } catch (error) {
      console.error('Error in deactivateCurrentDeviceToken:', error);
      // Don't throw the error as token deactivation shouldn't block logout
    }
  }

  /**
   * Deactivate all push tokens for a user (admin function - use with caution)
   */
  async deactivateAllUserTokens(userId: string): Promise<void> {
    if (isDemoMode()) {
      console.log('Push token deactivation skipped in demo mode');
      return;
    }

    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deactivating all user tokens:', error);
        throw error;
      }

      console.log('All push tokens deactivated for user:', userId);
      this.currentToken = null;
    } catch (error) {
      console.error('Error in deactivateAllUserTokens:', error);
      // Don't throw the error as token deactivation shouldn't block logout
    }
  }

  /**
   * Clean up old/inactive tokens (can be called periodically)
   */
  async cleanupOldTokens(daysOld: number = 30): Promise<void> {
    if (isDemoMode()) {
      return;
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .lt('last_active', cutoffDate.toISOString());

      if (error) {
        console.error('Error cleaning up old tokens:', error);
        throw error;
      }

      console.log('Old push tokens cleaned up successfully');
    } catch (error) {
      console.error('Error in cleanupOldTokens:', error);
    }
  }

  /**
   * Initialize periodic cleanup (call this once when app starts)
   */
  initializePeriodicCleanup(): void {
    // Clean up old tokens every 24 hours
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    setInterval(() => {
      console.log('Running periodic push token cleanup...');
      this.cleanupOldTokens(30); // Clean tokens older than 30 days
    }, CLEANUP_INTERVAL);
  }

  /**
   * Get current token (for debugging)
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Get all active tokens for a user (for debugging/admin purposes)
   */
  async getUserTokens(userId: string): Promise<any[]> {
    if (isDemoMode()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('id, token, platform, last_active')
        .eq('user_id', userId)
        .order('last_active', { ascending: false });

      if (error) {
        console.error('Error fetching user tokens:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserTokens:', error);
      return [];
    }
  }

  /**
   * Configure notification handling
   */
  configureNotifications(): void {
    // Set notification handler for when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Set default notification channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }
}

export const pushTokenService = new PushTokenService();
