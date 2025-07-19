import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Send,
  Bell,
  Users,
  Calendar,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
} from 'lucide-react-native';
//import { notificationService } from '@/services/notifications';

const notificationTypes = [
  { id: 'exam', label: 'Exam Reminder', icon: Calendar, color: '#2563EB' },
  {
    id: 'absence',
    label: 'Absence Alert',
    icon: AlertTriangle,
    color: '#EF4444',
  },
  { id: 'general', label: 'General Notice', icon: Bell, color: '#059669' },
  {
    id: 'assignment',
    label: 'Assignment',
    icon: CheckCircle,
    color: '#EA580C',
  },
];

const recipientGroups = [
  { id: 'all_students', label: 'All Students', count: 120 },
  { id: 'hsc_science', label: 'HSC Science Batch', count: 85 },
  { id: 'hsc_commerce', label: 'HSC Commerce Batch', count: 35 },
  { id: 'guardians', label: 'All Guardians', count: 120 },
];

const recentNotifications = [
  {
    id: 1,
    title: 'Physics Unit Test Tomorrow',
    message: 'Electromagnetic waves chapter test at 11 AM in Hall A',
    type: 'exam',
    recipients: 'HSC Science Batch',
    sentAt: '2 hours ago',
    status: 'sent',
  },
  {
    id: 2,
    title: 'Student Absence Alert',
    message: 'Arjun Sharma was absent from Chemistry lecture',
    type: 'absence',
    recipients: 'Guardian',
    sentAt: '4 hours ago',
    status: 'sent',
  },
  {
    id: 3,
    title: 'Holiday Notice',
    message: 'Institute will remain closed on Republic Day',
    type: 'general',
    recipients: 'All Students',
    sentAt: '1 day ago',
    status: 'sent',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('general');
  const [selectedRecipients, setSelectedRecipients] = useState('all_students');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!title || !message) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    setIsSending(true);
    try {
      let scheduledFor = new Date();

      if (scheduleDate && scheduleTime) {
        scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`);
      }

      await notificationService.scheduleNotification(
        title,
        message,
        scheduledFor,
        { type: selectedType, recipients: selectedRecipients }
      );

      Alert.alert(
        'Notification Scheduled',
        scheduleDate && scheduleTime
          ? `Notification will be sent on ${scheduledFor.toLocaleString()}`
          : 'Notification sent immediately',
        [{ text: 'OK' }]
      );

      // Reset form
      setTitle('');
      setMessage('');
      setScheduleDate('');
      setScheduleTime('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = notificationTypes.find((t) => t.id === type);
    return typeConfig ? typeConfig.icon : Bell;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = notificationTypes.find((t) => t.id === type);
    return typeConfig ? typeConfig.color : '#64748B';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Send New Notification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send New Notification</Text>

          <View style={styles.formCard}>
            {/* Notification Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notification Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeContainer}>
                  {notificationTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeChip,
                        selectedType === type.id && styles.typeChipActive,
                      ]}
                      onPress={() => setSelectedType(type.id)}
                    >
                      <type.icon
                        size={16}
                        color={
                          selectedType === type.id ? '#FFFFFF' : type.color
                        }
                      />
                      <Text
                        style={[
                          styles.typeText,
                          selectedType === type.id && styles.typeTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Recipients */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Recipients</Text>
              <View style={styles.recipientsContainer}>
                {recipientGroups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.recipientChip,
                      selectedRecipients === group.id &&
                        styles.recipientChipActive,
                    ]}
                    onPress={() => setSelectedRecipients(group.id)}
                  >
                    <Users
                      size={14}
                      color={
                        selectedRecipients === group.id ? '#FFFFFF' : '#64748B'
                      }
                    />
                    <Text
                      style={[
                        styles.recipientText,
                        selectedRecipients === group.id &&
                          styles.recipientTextActive,
                      ]}
                    >
                      {group.label} ({group.count})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter notification title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Message */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter notification message"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Schedule (Optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Schedule (Optional)</Text>
              <View style={styles.scheduleContainer}>
                <TextInput
                  style={[styles.textInput, styles.scheduleInput]}
                  placeholder="YYYY-MM-DD"
                  value={scheduleDate}
                  onChangeText={setScheduleDate}
                  placeholderTextColor="#94A3B8"
                />
                <TextInput
                  style={[styles.textInput, styles.scheduleInput]}
                  placeholder="HH:MM"
                  value={scheduleTime}
                  onChangeText={setScheduleTime}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                isSending && styles.sendButtonDisabled,
              ]}
              onPress={handleSendNotification}
              disabled={isSending}
            >
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>
                {isSending ? 'Sending...' : 'Send Notification'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {recentNotifications.map((notification) => {
            const TypeIcon = getTypeIcon(notification.type);
            const typeColor = getTypeColor(notification.type);

            return (
              <View key={notification.id} style={styles.notificationCard}>
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIcon}>
                    <TypeIcon size={16} color={typeColor} />
                  </View>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationMeta}>
                      To: {notification.recipients} • {notification.sentAt}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>SENT</Text>
                  </View>
                </View>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Notification Settings</Text>
            <Text style={styles.settingsDescription}>
              • Exam reminders are sent 24 hours, 2 hours, and 30 minutes before
              exams
            </Text>
            <Text style={styles.settingsDescription}>
              • Absence alerts are sent immediately to guardians via SMS and
              email
            </Text>
            <Text style={styles.settingsDescription}>
              • All notifications are logged for tracking and compliance
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  typeChipActive: {
    backgroundColor: '#2563EB',
  },
  typeText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'Inter-Medium',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  recipientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  recipientChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  recipientText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  recipientTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  scheduleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleInput: {
    flex: 1,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  notificationMeta: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#059669',
    fontFamily: 'Inter-SemiBold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  settingsDescription: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 4,
  },
});
