import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { examManagementService } from '../../services/exam-management';
import { lecturesManagementService } from '../../services/lectures-management';
import {
  User,
  Settings,
  Bell,
  BookOpen,
  Award,
  Calendar,
  LogOut,
  Target,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [academicStats, setAcademicStats] = useState({
    totalLectures: 0,
    attendedLectures: 0,
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    attendancePercentage: 0,
    examPerformance: 0,
  });
  const [studentInfo, setStudentInfo] = useState({
    full_name: '',
    email: '',
    roll: '',
  });
  const [error, setError] = useState<string | null>(null);

  const loadStudentInfo = useCallback(async () => {
    try {
      if (!user?.id) return;

      // Get profile information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Get student roll number
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('roll')
        .eq('id', user.id)
        .single();

      if (studentError) {
        console.error('Error fetching student roll:', studentError);
      }

      setStudentInfo({
        full_name: profileData?.full_name || '',
        email: user.email || '',
        roll: studentData?.roll || '',
      });
    } catch (err) {
      console.error('Error loading student info:', err);
    }
  }, [user?.id, user?.email]);

  const loadAcademicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Get enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', user.id)
        .eq('status', 'active');

      if (enrollError) {
        throw new Error(`Failed to fetch enrollments: ${enrollError.message}`);
      }

      const courseIds = enrollments?.map((e) => e.course_id) || [];

      if (courseIds.length === 0) {
        setAcademicStats({
          totalLectures: 0,
          attendedLectures: 0,
          totalExams: 0,
          completedExams: 0,
          averageScore: 0,
          attendancePercentage: 0,
          examPerformance: 0,
        });
        return;
      }

      // Get lecture stats
      const lectures = await lecturesManagementService.getAllLectures();
      const enrolledLectures = lectures.filter((lecture) =>
        courseIds.includes(lecture.course_id)
      );

      // Get attendance data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendances')
        .select('status, batch_id, lecture_batches(lecture_id)')
        .eq('student_id', user.id);

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
      }

      const attendedLectures =
        attendanceData?.filter(
          (att) => att.status === 'present' || att.status === 'late'
        ).length || 0;

      // Get exam stats
      const exams = await examManagementService.getExams();
      const enrolledExams = exams.filter((exam) =>
        courseIds.includes(exam.course_id)
      );

      // Get exam attendance data
      const { data: examAttendanceData, error: examAttendanceError } =
        await supabase
          .from('exam_attendances')
          .select('status, score, batch_id, exam_batches(exam_id)')
          .eq('student_id', user.id);

      if (examAttendanceError) {
        console.error('Error fetching exam attendance:', examAttendanceError);
      }

      const completedExams =
        examAttendanceData?.filter(
          (att) => att.status === 'present' || att.status === 'late'
        ).length || 0;

      const examMarks =
        examAttendanceData
          ?.filter((att) => att.score !== null)
          .map((att) => att.score) || [];

      const averageScore =
        examMarks.length > 0
          ? examMarks.reduce((sum, mark) => sum + mark, 0) / examMarks.length
          : 0;

      const attendancePercentage =
        enrolledLectures.length > 0
          ? Math.round((attendedLectures / enrolledLectures.length) * 100)
          : 0;

      const examPerformance =
        enrolledExams.length > 0
          ? Math.round((completedExams / enrolledExams.length) * 100)
          : 0;

      setAcademicStats({
        totalLectures: enrolledLectures.length,
        attendedLectures,
        totalExams: enrolledExams.length,
        completedExams,
        averageScore: Math.round(averageScore),
        attendancePercentage,
        examPerformance,
      });
    } catch (err) {
      console.error('Error loading academic data:', err);
      setError('Failed to load academic data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadStudentInfo();
      loadAcademicData();
    }
  }, [user?.id, loadStudentInfo, loadAcademicData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStudentInfo(), loadAcademicData()]);
    setRefreshing(false);
  };

  const menuItems = [
    { id: 1, title: 'Edit Profile', icon: User, color: '#2563EB' },
    { id: 2, title: 'Notifications', icon: Bell, color: '#EA580C' },
    { id: 3, title: 'Settings', icon: Settings, color: '#64748B' },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Student logout initiated');
            await logout();
            console.log('Student logout completed');
          } catch (error) {
            console.error('Logout error:', error);
            router.replace('/login-selection');
          }
        },
      },
    ]);
  };

  const handleMenuItemPress = (item: any) => {
    switch (item.id) {
      case 1: // Edit Profile
        router.push('/editprofile');
        break;
      case 2: // Notifications
        // Navigate to notifications
        console.log('Notifications pressed');
        break;
      case 3: // Settings
        // Navigate to settings
        console.log('Settings pressed');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <View style={styles.profilePicture}>
                <Text style={styles.profileInitials}>
                  {studentInfo.full_name
                    ? studentInfo.full_name
                        .split(' ')
                        .map((n: string) => n.charAt(0))
                        .join('')
                        .toUpperCase()
                    : user?.email?.split('@')[0].charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>
                  {studentInfo.full_name ||
                    user?.email?.split('@')[0] ||
                    'User'}
                </Text>
                <Text style={styles.studentEmail}>
                  {studentInfo.email || user?.email || 'N/A'}
                </Text>
                <Text style={styles.studentRole}>
                  {studentInfo.roll ? `Roll: ${studentInfo.roll}` : 'Student'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Academic Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <BookOpen size={24} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>
                {academicStats.attendancePercentage}%
              </Text>
              <Text style={styles.statLabel}>Attendance</Text>
              <Text style={styles.statDetail}>
                {academicStats.attendedLectures}/{academicStats.totalLectures}{' '}
                lectures
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Target size={24} color="#059669" />
              </View>
              <Text style={styles.statValue}>
                {academicStats.examPerformance}%
              </Text>
              <Text style={styles.statLabel}>Exam Performance</Text>
              <Text style={styles.statDetail}>
                {academicStats.completedExams}/{academicStats.totalExams}{' '}
                completed
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Award size={24} color="#EA580C" />
              </View>
              <Text style={styles.statValue}>
                {academicStats.averageScore}%
              </Text>
              <Text style={styles.statLabel}>Average Score</Text>
              <Text style={styles.statDetail}>Overall performance</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Calendar size={24} color="#7C3AED" />
              </View>
              <Text style={styles.statValue}>
                {academicStats.totalLectures + academicStats.totalExams}
              </Text>
              <Text style={styles.statLabel}>Total Activities</Text>
              <Text style={styles.statDetail}>Lectures & Exams</Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item)}
              >
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: `${item.color}15` },
                  ]}
                >
                  <item.icon size={20} color={item.color} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#FEF2F2' }]}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text style={[styles.menuTitle, { color: '#EF4444' }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
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
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  studentRole: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  statDetail: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutItem: {
    marginTop: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
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
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
});
