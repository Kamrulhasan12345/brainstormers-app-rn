import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { Bell, BellOff, Settings } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPermissionPromptProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
  showSkipOption?: boolean;
}

export function NotificationPermissionPrompt({
  visible,
  onClose,
  onPermissionGranted,
  showSkipOption = true,
}: NotificationPermissionPromptProps) {
  const { permissionStatus, requestPermissions } = useNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermissions();

      if (granted) {
        onPermissionGranted?.();
        onClose();
      } else {
        // Permission denied
        if (!permissionStatus.canAskAgain) {
          // User has denied permission permanently
          Alert.alert(
            'Notifications Blocked',
            'To receive important updates, please enable notifications in your device settings.',
            [
              { text: 'Not Now', style: 'cancel' },
              { text: 'Open Settings', onPress: openSettings },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Error',
        'Unable to request notification permissions. Please try again.'
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Bell size={48} color="#3B82F6" />
          </View>

          <Text style={styles.title}>Stay Updated</Text>

          <Text style={styles.description}>
            Get notified about new assignments, exam schedules, important
            announcements, and more.
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitText}>• Assignment deadlines</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitText}>• Exam notifications</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitText}>• Important announcements</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitText}>• Grade updates</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRequestPermission}
              disabled={isRequesting}
            >
              <Bell size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>
                {isRequesting ? 'Requesting...' : 'Enable Notifications'}
              </Text>
            </TouchableOpacity>

            {showSkipOption && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSkip}
                disabled={isRequesting}
              >
                <BellOff size={20} color="#6B7280" style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>Not Now</Text>
              </TouchableOpacity>
            )}
          </View>

          {!permissionStatus.canAskAgain && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={openSettings}
            >
              <Settings size={16} color="#3B82F6" />
              <Text style={styles.settingsButtonText}>
                Open Settings to Enable
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  benefitItem: {
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  settingsButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
