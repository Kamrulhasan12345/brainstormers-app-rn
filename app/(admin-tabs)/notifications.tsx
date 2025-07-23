import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SectionList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from '../../components/NotificationItem';
import { BellOff, Calendar, FileText, Send } from 'lucide-react-native';

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

interface GroupedNotifications {
  title: string;
  data: Notification[];
}

export default function AdminNotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [groupBy, setGroupBy] = useState<'type' | 'date'>('date');
  const router = useRouter();
  const {
    notifications,
    loading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
  } = useNotifications();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Don't navigate, just mark as read and stay on the same page
    // The visual feedback (card appearance change) will show it's been read
  };

  const handleManageNotifications = () => {
    router.push('./admin_notifications');
  };

  const getGroupedNotifications = (): GroupedNotifications[] => {
    if (groupBy === 'type') {
      const types = ['error', 'warning', 'info', 'success'];
      return types
        .map((type) => ({
          title: type.charAt(0).toUpperCase() + type.slice(1),
          data: notifications.filter((n) => n.type === type),
        }))
        .filter((group) => group.data.length > 0);
    }

    // Group by date
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);

    const groups: GroupedNotifications[] = [];

    const todayNotifications = notifications.filter((n) => {
      const notificationDate = new Date(n.created_at);
      return notificationDate.toDateString() === today.toDateString();
    });

    const yesterdayNotifications = notifications.filter((n) => {
      const notificationDate = new Date(n.created_at);
      return notificationDate.toDateString() === yesterday.toDateString();
    });

    const thisWeekNotifications = notifications.filter((n) => {
      const notificationDate = new Date(n.created_at);
      return (
        notificationDate > thisWeek &&
        notificationDate.toDateString() !== today.toDateString() &&
        notificationDate.toDateString() !== yesterday.toDateString()
      );
    });

    const olderNotifications = notifications.filter((n) => {
      const notificationDate = new Date(n.created_at);
      return notificationDate <= thisWeek;
    });

    if (todayNotifications.length > 0) {
      groups.push({ title: 'Today', data: todayNotifications });
    }
    if (yesterdayNotifications.length > 0) {
      groups.push({ title: 'Yesterday', data: yesterdayNotifications });
    }
    if (thisWeekNotifications.length > 0) {
      groups.push({ title: 'This Week', data: thisWeekNotifications });
    }
    if (olderNotifications.length > 0) {
      groups.push({ title: 'Earlier', data: olderNotifications });
    }

    return groups;
  };

  const renderNotificationItem = ({
    item: notification,
  }: {
    item: Notification;
  }) => (
    <NotificationItem
      notification={notification}
      onPress={handleNotificationPress}
    />
  );

  const renderSectionHeader = ({
    section,
  }: {
    section: GroupedNotifications;
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadNotifications}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const groupedNotifications = getGroupedNotifications();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleManageNotifications}
          >
            <Send size={16} color="#DC2626" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.groupButton,
              groupBy === 'date' && styles.groupButtonActive,
            ]}
            onPress={() => setGroupBy('date')}
          >
            <Calendar
              size={16}
              color={groupBy === 'date' ? '#FFFFFF' : '#DC2626'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.groupButton,
              groupBy === 'type' && styles.groupButtonActive,
            ]}
            onPress={() => setGroupBy('type')}
          >
            <FileText
              size={16}
              color={groupBy === 'type' ? '#FFFFFF' : '#DC2626'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <BellOff size={48} color="#CBD5E1" />
          <Text style={styles.emptyStateTitle}>No notifications</Text>
          <Text style={styles.emptyStateText}>
            You&apos;re all caught up! Check back later for updates.
          </Text>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={handleManageNotifications}
          >
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.manageButtonText}>Send Notification</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={groupedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#DC2626']}
              progressBackgroundColor="#F8FAFC"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  unreadBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  groupButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  groupButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  sectionHeader: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
