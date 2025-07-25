import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { pushTokenService } from '@/services/push-token-management';

export function usePushTokenActivity() {
  const { user } = useAuth();

  useEffect(() => {
    let appStateSubscription: any;

    if (user) {
      // Update token activity when app becomes active
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          console.log('App became active, updating push token activity');
          pushTokenService.updateTokenActivity(user.id);
        }
      };

      // Subscribe to app state changes
      appStateSubscription = AppState.addEventListener(
        'change',
        handleAppStateChange
      );

      // Update token activity immediately when user is available
      pushTokenService.updateTokenActivity(user.id);
    }

    return () => {
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
  }, [user]);
}
