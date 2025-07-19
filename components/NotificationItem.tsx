import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
} from 'lucide-react-native';

interface Notification {
  id: string;
  recipient_id: string;
  title: string | null;
  body: string;
  link: string | null;
  expires_at: string | null;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

export default function NotificationItem({
  notification,
  onPress,
}: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    const size = 20;
    const color = getTypeColor(type);

    switch (type) {
      case 'info':
        return <Info size={size} color={color} />;
      case 'warning':
        return <AlertTriangle size={size} color={color} />;
      case 'success':
        return <CheckCircle size={size} color={color} />;
      case 'error':
        return <XCircle size={size} color={color} />;
      default:
        return <Info size={size} color={color} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return '#2563EB';
      case 'warning':
        return '#F59E0B';
      case 'success':
        return '#059669';
      case 'error':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const getTypeBackgroundColor = (type: string) => {
    switch (type) {
      case 'info':
        return '#EBF4FF';
      case 'warning':
        return '#FEF3C7';
      case 'success':
        return '#D1FAE5';
      case 'error':
        return '#FEE2E2';
      default:
        return '#F1F5F9';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.is_read && styles.notificationCardUnread,
      ]}
      onPress={() => onPress(notification)}
    >
      <View style={styles.notificationHeader}>
        <View
          style={[
            styles.notificationIcon,
            { backgroundColor: getTypeBackgroundColor(notification.type) },
          ]}
        >
          {getNotificationIcon(notification.type)}
        </View>
        <View style={styles.notificationContent}>
          {notification.title && (
            <Text
              style={[
                styles.notificationTitle,
                !notification.is_read && styles.notificationTitleUnread,
              ]}
            >
              {notification.title}
            </Text>
          )}
          <Text
            style={[
              styles.notificationBody,
              !notification.is_read && styles.notificationBodyUnread,
            ]}
          >
            {notification.body}
          </Text>
          <View style={styles.notificationMeta}>
            <Clock size={12} color="#94A3B8" />
            <Text style={styles.notificationTime}>
              {formatTime(notification.created_at)}
            </Text>
          </View>
        </View>
        {notification.link && <ChevronRight size={16} color="#64748B" />}
        {!notification.is_read && <View style={styles.unreadIndicator} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  notificationCardUnread: {
    borderLeftColor: '#2563EB',
    backgroundColor: '#FEFEFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  notificationTitleUnread: {
    color: '#1E293B',
    fontWeight: '700',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationBodyUnread: {
    color: '#374151',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginLeft: 8,
    marginTop: 4,
  },
});
