import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NotificationItem from './NotificationItem';

interface PreviewCardProps {
  show: boolean;
  formData: {
    title: string;
    body: string;
    type: 'info' | 'warning' | 'success' | 'error';
    link: string;
    expires_at: Date | null;
  };
}

export default function PreviewCard({ show, formData }: PreviewCardProps) {
  if (!show || !formData.body) return null;

  const mockNotification = {
    id: 'preview',
    recipient_id: '',
    title: formData.title || null,
    body: formData.body,
    link: formData.link || null,
    expires_at: formData.expires_at?.toISOString() || null,
    type: formData.type,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  return (
    <View style={styles.previewSection}>
      <Text style={styles.sectionTitle}>Preview</Text>
      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>
          How this notification will appear:
        </Text>
        <View style={styles.notificationContainer}>
          <NotificationItem
            notification={mockNotification}
            onPress={() => {}}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  previewSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
