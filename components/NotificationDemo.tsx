import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Bell, Send, Clock, Settings } from 'lucide-react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/NotificationService';
import { pushNotificationService } from '@/services/push-notifications';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationDemo() {
  const { user } = useAuth();
  const { permissionStatus, requestPermissions } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleRequestPermissions = async () => {
    setLoading(true);
    try {
      const granted = await requestPermissions();
      Alert.alert(
        'Permission Result',
        granted ? 'Notifications enabled!' : 'Permission denied'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLocalNotification = async () => {
    setLoading(true);
    try {
      await notificationService.scheduleLocalNotification({
        title: 'Test Notification',
        body: 'This is a test local notification!',
        data: { type: 'test', route: '/(tabs)/notifications' },
      });
      Alert.alert('Success', 'Local notification scheduled!');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule notification');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPushNotification = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to test push notifications');
      return;
    }

    setLoading(true);
    try {
      const result = await pushNotificationService.sendPushNotifications(
        [user.id],
        {
          title: 'Test Push Notification',
          body: 'This is a test push notification!',
          data: { type: 'test', route: '/(tabs)/notifications' },
        }
      );

      Alert.alert(
        'Result',
        result.success
          ? 'Push notification sent!'
          : 'Failed to send push notification'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send push notification');
    } finally {
      setLoading(false);
    }
  };

  const handleTestImmediate = async () => {
    setLoading(true);
    try {
      const success =
        await pushNotificationService.sendImmediateNotifications();
      Alert.alert(
        'Result',
        success
          ? 'Immediate notifications processed!'
          : 'Failed to process notifications'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process immediate notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleTestDispatch = async () => {
    setLoading(true);
    try {
      const success =
        await pushNotificationService.dispatchPendingNotifications();
      Alert.alert(
        'Result',
        success
          ? 'Pending notifications dispatched!'
          : 'Failed to dispatch notifications'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to dispatch pending notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleTestRoutine = async () => {
    setLoading(true);
    try {
      const success = await pushNotificationService.sendRoutineNotifications();
      Alert.alert(
        'Result',
        success
          ? 'Routine notifications processed!'
          : 'Failed to process notifications'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process routine notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Bell size={32} color="#3B82F6" />
        <Text style={styles.title}>Notification Demo</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permission Status</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Granted: {permissionStatus.granted ? '✅' : '❌'}
          </Text>
          <Text style={styles.statusText}>
            Can Ask Again: {permissionStatus.canAskAgain ? '✅' : '❌'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleRequestPermissions}
          disabled={loading || permissionStatus.granted}
        >
          <Settings size={20} color="white" />
          <Text style={styles.buttonText}>Request Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleTestLocalNotification}
          disabled={loading || !permissionStatus.granted}
        >
          <Bell size={20} color="#3B82F6" />
          <Text style={styles.secondaryButtonText}>
            Test Local Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleTestPushNotification}
          disabled={loading || !permissionStatus.granted || !user}
        >
          <Send size={20} color="#3B82F6" />
          <Text style={styles.secondaryButtonText}>Test Push Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleTestImmediate}
          disabled={loading}
        >
          <Send size={20} color="white" />
          <Text style={styles.buttonText}>Test Immediate Send</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleTestDispatch}
          disabled={loading}
        >
          <Send size={20} color="white" />
          <Text style={styles.buttonText}>Test Dispatch Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleTestRoutine}
          disabled={loading}
        >
          <Clock size={20} color="white" />
          <Text style={styles.buttonText}>Test Routine Send</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          1. First, request notification permissions
        </Text>
        <Text style={styles.instructionText}>
          2. Test local notification (immediate)
        </Text>
        <Text style={styles.instructionText}>
          3. Test push notification (requires backend)
        </Text>
        <Text style={styles.instructionText}>
          4. Test immediate send (processes unsent notifications)
        </Text>
        <Text style={styles.instructionText}>
          5. Test dispatch pending (dispatches all pending notifications)
        </Text>
        <Text style={styles.instructionText}>
          6. Test routine send (system-wide processing with reminders)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  statusContainer: {
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#4b5563',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  warningButton: {
    backgroundColor: '#F59E0B',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
});
