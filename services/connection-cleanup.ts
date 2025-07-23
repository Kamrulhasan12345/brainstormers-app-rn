import { supabase } from '../lib/supabase';

class ConnectionCleanupService {
  private static instance: ConnectionCleanupService;
  private activeSubscriptions: Set<string> = new Set();

  static getInstance(): ConnectionCleanupService {
    if (!ConnectionCleanupService.instance) {
      ConnectionCleanupService.instance = new ConnectionCleanupService();
    }
    return ConnectionCleanupService.instance;
  }

  // Track active subscriptions
  addSubscription(channelName: string) {
    this.activeSubscriptions.add(channelName);
    console.log('ConnectionCleanup: Added subscription:', channelName);
    console.log(
      'ConnectionCleanup: Active subscriptions:',
      this.activeSubscriptions.size
    );
  }

  // Remove subscription from tracking
  removeSubscription(channelName: string) {
    this.activeSubscriptions.delete(channelName);
    console.log('ConnectionCleanup: Removed subscription:', channelName);
    console.log(
      'ConnectionCleanup: Active subscriptions:',
      this.activeSubscriptions.size
    );
  }

  // Force cleanup all connections
  async cleanupAllConnections(): Promise<void> {
    console.log('ConnectionCleanup: Starting cleanup of all connections');
    console.log(
      'ConnectionCleanup: Active subscriptions before cleanup:',
      this.activeSubscriptions.size
    );

    try {
      // Remove all channels from Supabase
      await supabase.removeAllChannels();
      console.log('ConnectionCleanup: All Supabase channels removed');

      // Clear our tracking
      this.activeSubscriptions.clear();
      console.log('ConnectionCleanup: All subscriptions cleared from tracking');

      // Give a small delay to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log('ConnectionCleanup: Cleanup completed successfully');
    } catch (error) {
      console.error('ConnectionCleanup: Error during cleanup:', error);
      // Still clear our tracking even if there was an error
      this.activeSubscriptions.clear();
    }
  }

  // Get current status
  getStatus() {
    return {
      activeSubscriptions: this.activeSubscriptions.size,
      subscriptionNames: Array.from(this.activeSubscriptions),
    };
  }
}

export const connectionCleanupService = ConnectionCleanupService.getInstance();
