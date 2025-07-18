import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Calendar, Users, Bell, LogOut } from 'lucide-react-native';
import { adminStatsService } from '@/services/admin-stats';

interface AdminStats {
  totalStudents: number;
  totalLectures: number;
  upcomingExams: number;
  completedLectures: number;
  scheduledLectures: number;
  totalExams: number;
  completedExams: number;
  averageAttendanceRate: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalStudents: 0,
    totalLectures: 0,
    upcomingExams: 0,
    completedLectures: 0,
    scheduledLectures: 0,
    totalExams: 0,
    completedExams: 0,
    averageAttendanceRate: 0,
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      console.log('Admin dashboard: User not admin, redirecting to login');
      router.replace('/login-selection');
      return;
    }

    loadAdminStats();
  }, [user, router]);

  const loadAdminStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await adminStatsService.getAdminStatistics();
      setAdminStats(stats);
    } catch (error) {
      console.error('Error loading admin statistics:', error);
      Alert.alert('Error', 'Failed to load dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminStats();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Admin logout initiated');
            await logout();
            console.log('Admin logout completed');
            // Navigation will be handled automatically by the auth context
          } catch (error) {
            console.error('Logout error:', error);
            // Force navigation even if logout fails
            router.replace('/login-selection');
          }
        },
      },
    ]);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            progressBackgroundColor="#F8FAFC"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Welcome Back!</Text>
            <Text style={styles.headerSubtitle}>
              {user?.full_name || 'Admin'}
            </Text>
            <Text style={styles.roleText}>Administrator</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={24} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <LogOut size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                <Users size={24} color="#2563EB" />
              </View>
              {statsLoading ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <Text style={styles.statValue}>{adminStats.totalStudents}</Text>
              )}
              <Text style={styles.statLabel}>Total Students</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                <BookOpen size={24} color="#059669" />
              </View>
              {statsLoading ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <Text style={styles.statValue}>{adminStats.totalLectures}</Text>
              )}
              <Text style={styles.statLabel}>Total Lectures</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Calendar size={24} color="#EA580C" />
              </View>
              {statsLoading ? (
                <ActivityIndicator size="small" color="#EA580C" />
              ) : (
                <Text style={styles.statValue}>{adminStats.upcomingExams}</Text>
              )}
              <Text style={styles.statLabel}>Upcoming Exams</Text>
            </View>
          </View>
        </View>

        {/* Today's Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <BookOpen size={20} color="#2563EB" />
                <Text style={styles.progressNumber}>
                  {Math.min(
                    adminStats.completedLectures,
                    adminStats.scheduledLectures
                  )}
                  /{adminStats.scheduledLectures}
                </Text>
                <Text style={styles.progressLabel}>Lectures</Text>
              </View>
              <View style={styles.progressItem}>
                <Calendar size={20} color="#059669" />
                <Text style={styles.progressNumber}>
                  {Math.min(
                    adminStats.completedExams,
                    adminStats.upcomingExams
                  )}
                  /{adminStats.upcomingExams}
                </Text>
                <Text style={styles.progressLabel}>Exams</Text>
              </View>
              <View style={styles.progressItem}>
                <Users size={20} color="#EA580C" />
                <Text style={styles.progressNumber}>
                  {Math.round(adminStats.averageAttendanceRate)}%
                </Text>
                <Text style={styles.progressLabel}>Attendance</Text>
              </View>
            </View>
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
  scrollView: {
    flex: 1,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  roleText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
    gap: 8,
  },
  progressNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
