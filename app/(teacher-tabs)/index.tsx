import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  Users,
  ClipboardCheck,
  GraduationCap,
  Calendar,
  Bell,
  TrendingUp,
  LogOut,
  Award,
  Clock,
} from 'lucide-react-native';

const teacherStats = {
  totalLectures: 24,
  totalStudents: 85,
  attendanceRate: 92,
  averageGrade: 87,
  upcomingLectures: 3,
  pendingGrades: 12,
};

const quickActions = [
  {
    id: 'lectures',
    title: 'My Lectures',
    description: 'View and manage your lectures',
    icon: BookOpen,
    color: '#2563EB',
    route: '/teacher/lectures',
  },
  {
    id: 'students',
    title: 'My Students',
    description: 'View student progress and details',
    icon: Users,
    color: '#059669',
    route: '/teacher/students',
  },
  {
    id: 'attendance',
    title: 'Mark Attendance',
    description: 'Take attendance for lectures',
    icon: ClipboardCheck,
    color: '#EA580C',
    route: '/teacher/attendance',
  },
  {
    id: 'grades',
    title: 'Grade Management',
    description: 'Enter and manage exam grades',
    icon: GraduationCap,
    color: '#7C3AED',
    route: '/teacher/grades',
  },
];

const upcomingLectures = [
  {
    id: '1',
    subject: 'Physics',
    topic: 'Quantum Mechanics',
    time: '10:00 AM',
    date: 'Today',
    location: 'Room A-101',
    students: 42,
  },
  {
    id: '2',
    subject: 'Physics',
    topic: 'Thermodynamics',
    time: '2:00 PM',
    date: 'Tomorrow',
    location: 'Room A-203',
    students: 38,
  },
];

const recentActivity = [
  {
    id: '1',
    type: 'attendance',
    title: 'Attendance marked for Physics lecture',
    description: '42 students present out of 45',
    time: '2 hours ago',
    icon: ClipboardCheck,
    color: '#059669',
  },
  {
    id: '2',
    type: 'grade',
    title: 'Grades entered for Unit Test',
    description: 'Physics - Electromagnetic Waves',
    time: '1 day ago',
    icon: Award,
    color: '#2563EB',
  },
];

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Teacher logout initiated');
            await logout();
            console.log('Teacher logout completed');
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#059669', '#047857']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.teacherName}>{user?.name || 'Teacher'}</Text>
              <Text style={styles.roleText}>Physics Teacher</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LogOut size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                <BookOpen size={20} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>{teacherStats.totalLectures}</Text>
              <Text style={styles.statLabel}>Total Lectures</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                <Users size={20} color="#059669" />
              </View>
              <Text style={styles.statValue}>{teacherStats.totalStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <TrendingUp size={20} color="#EA580C" />
              </View>
              <Text style={styles.statValue}>
                {teacherStats.attendanceRate}%
              </Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                <Award size={20} color="#7C3AED" />
              </View>
              <Text style={styles.statValue}>{teacherStats.averageGrade}%</Text>
              <Text style={styles.statLabel}>Avg Grade</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: `${action.color}15` },
                  ]}
                >
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>
                  {action.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Lectures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Lectures</Text>
          {upcomingLectures.map((lecture) => (
            <TouchableOpacity key={lecture.id} style={styles.lectureCard}>
              <View style={styles.lectureHeader}>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectText}>{lecture.subject}</Text>
                </View>
                <View style={styles.timeInfo}>
                  <Clock size={14} color="#64748B" />
                  <Text style={styles.timeText}>{lecture.time}</Text>
                </View>
              </View>
              <Text style={styles.lectureTopic}>{lecture.topic}</Text>
              <View style={styles.lectureDetails}>
                <Text style={styles.lectureDate}>{lecture.date}</Text>
                <Text style={styles.lectureLocation}>{lecture.location}</Text>
                <Text style={styles.lectureStudents}>
                  {lecture.students} students
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View
                style={[
                  styles.activityIcon,
                  { backgroundColor: `${activity.color}15` },
                ]}
              >
                <activity.icon size={20} color={activity.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>
                  {activity.description}
                </Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pending Tasks */}
        <View style={styles.section}>
          <View style={styles.pendingCard}>
            <View style={styles.pendingHeader}>
              <Bell size={20} color="#EA580C" />
              <Text style={styles.pendingTitle}>Pending Tasks</Text>
            </View>
            <Text style={styles.pendingText}>
              You have {teacherStats.pendingGrades} grades to enter and{' '}
              {teacherStats.upcomingLectures} lectures scheduled for this week.
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#BFDBFE',
    fontFamily: 'Inter-Regular',
  },
  teacherName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#BFDBFE',
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  lectureCard: {
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
  lectureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  subjectText: {
    fontSize: 12,
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  lectureTopic: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  lectureDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lectureDate: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  lectureLocation: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  lectureStudents: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  activityCard: {
    flexDirection: 'row',
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
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
  },
  pendingCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
    marginBottom: 24,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  pendingText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});
