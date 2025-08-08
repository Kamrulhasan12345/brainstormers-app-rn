import React, { useEffect, useState } from 'react';
import { notificationService } from '@/services/NotificationService';
import { pushTokenService } from '@/services/push-token-management';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';

interface NotificationSetupProps {
  children: React.ReactNode;
  showPermissionPrompt?: boolean;
  autoRequestPermissions?: boolean;
}

export function NotificationSetup({
  children,
  showPermissionPrompt = true,
  autoRequestPermissions = false,
}: NotificationSetupProps) {
  const { user, isAuthenticated } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  useEffect(() => {
    // Only initialize notification service when user is authenticated
    if (!isAuthenticated) {
      console.log(
        '📱 Skipping notification initialization - user not authenticated'
      );
      return;
    }

    // Initialize notification service when component mounts
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        // Remove the duplicate log message here since the service logs its own status

        // Check if device supports notifications
        if (!notificationService.isDeviceSupported()) {
          console.log('📱 Device does not support notifications');
          return;
        }

        // Check current permission status
        const permissionStatus =
          await notificationService.getPermissionStatus();
        setPermissionChecked(true);

        if (!permissionStatus.granted) {
          if (autoRequestPermissions) {
            // Automatically request permissions
            const newStatus = await notificationService.requestPermissions();
            if (newStatus.granted && user?.id) {
              // Register push token after permission granted
              await pushTokenService.registerPushToken(user.id);
            }
          } else if (showPermissionPrompt && isAuthenticated) {
            // Show permission prompt
            setShowPrompt(true);
          }
        } else if (user?.id) {
          // Permission already granted, ensure push token is registered
          await pushTokenService.registerPushToken(user.id);
        }
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, [autoRequestPermissions, showPermissionPrompt, isAuthenticated, user?.id]);

  // Register push token when user logs in
  useEffect(() => {
    const registerTokenForUser = async () => {
      if (user?.id && permissionChecked) {
        const permissionStatus =
          await notificationService.getPermissionStatus();
        if (permissionStatus.granted) {
          try {
            await pushTokenService.registerPushToken(user.id);
            console.log('✅ Push token registered for user:', user.id);
          } catch (error) {
            console.error('❌ Failed to register push token:', error);
          }
        }
      }
    };

    registerTokenForUser();
  }, [user?.id, permissionChecked]);

  const handlePermissionGranted = async () => {
    if (user?.id) {
      try {
        await pushTokenService.registerPushToken(user.id);
        console.log('✅ Push token registered after permission granted');
      } catch (error) {
        console.error(
          '❌ Failed to register push token after permission:',
          error
        );
      }
    }
  };

  const handleClosePrompt = () => {
    setShowPrompt(false);
  };

  return (
    <>
      {children}

      {showPermissionPrompt && (
        <NotificationPermissionPrompt
          visible={showPrompt}
          onClose={handleClosePrompt}
          onPermissionGranted={handlePermissionGranted}
          showSkipOption={true}
        />
      )}
    </>
  );
}
