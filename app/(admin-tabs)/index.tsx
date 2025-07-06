import React, { useState, useEffect } from 'react';
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
  Calendar,
  Users,
  Bell,
  Upload,
  Download,
  ChartBar as BarChart3,
  Settings,
  LogOut,
  FileSpreadsheet,
  TriangleAlert as AlertTriangle,
  Zap,
} from 'lucide-react-native';
import { excelService } from '@/services/excel';
import { notificationService } from '@/services/notifications';

const adminStats = {
  totalStudents: 120,
  totalLectures: 45,
  upcomingExams: 8,
  pendingNotifications: 12,
};

const quickActions = [
  {
    id: 'lectures',
    title: 'Manage Lectures',
    description: 'Add, edit, and schedule lectures',
    icon: BookOpen,
    color: '#2563EB',
    route: '/admin/lectures',
  },
  {
    id: 'exams',
    title: 'Manage Exams',
    description: 'Schedule and track examinations',
    icon: Calendar,
    color: '#059669',
    route: '/admin/exams',
  },
  {
    id: 'students',
    title: 'Student Management',
    description: 'View and manage student records',
    icon: Users,
    color: '#EA580C',
    route: '/admin/students',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Send alerts to students and guardians',
    icon: Bell,
    color: '#7C3AED',
    route: '/admin/notifications',
  },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log(user);
    if (!user || user.role !== 'admin') {
      console.log('Admin dashboard: User not admin, redirecting to login');
      router.replace('/login-selection');
    }
  }, [user, router]);

  const handleQuickImport = async () => {
    try {
      setIsLoading(true);
      const fileUri = await excelService.pickExcelFile();

      if (fileUri) {
        const data = await excelService.parseExcelFile(fileUri);

        let importSummary = 'Import Summary:\n';
        if (data.lectures)
          importSummary += `• ${data.lectures.length} lectures\n`;
        if (data.exams) importSummary += `• ${data.exams.length} exams\n`;
        if (data.students)
          importSummary += `• ${data.students.length} students\n`;

        Alert.alert('Import Successful', importSummary, [{ text: 'OK' }]);

        // Schedule notifications for new exams
        if (data.exams) {
          for (const exam of data.exams) {
            if (exam.date) {
              await notificationService.scheduleExamReminder(
                `${exam.subject} - ${exam.topic}`,
                new Date(exam.date)
              );
            }
          }
        }
      }
    } catch (error) {
      Alert.alert(
        'Import Failed',
        error instanceof Error ? error.message : 'Failed to import Excel file'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSample = () => {
    try {
      excelService.generateSampleExcel();
      Alert.alert(
        'Sample Downloaded',
        'Sample Excel file has been generated. Use this format for importing your data.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Download Failed', 'Failed to generate sample Excel file');
    }
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#2563EB', '#1D4ED8']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.adminName}>{user.full_name || "Mr. Admin"}</Text>
              <Text style={styles.roleText}>Administrator</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LogOut size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Import Section */}
        <View style={styles.quickImportSection}>
          <View style={styles.quickImportCard}>
            <View style={styles.quickImportHeader}>
              <Zap size={24} color="#059669" />
              <Text style={styles.quickImportTitle}>Quick Excel Import</Text>
            </View>
            <Text style={styles.quickImportDescription}>
              Instantly upload lectures, exams, and student data from Excel
              files
            </Text>
            <View style={styles.quickImportButtons}>
              <TouchableOpacity
                style={styles.sampleButton}
                onPress={handleDownloadSample}
              >
                <Download size={16} color="#2563EB" />
                <Text style={styles.sampleButtonText}>Get Sample</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importButton,
                  isLoading && styles.importButtonDisabled,
                ]}
                onPress={handleQuickImport}
                disabled={isLoading}
              >
                <Upload size={16} color="#FFFFFF" />
                <Text style={styles.importButtonText}>
                  {isLoading ? 'Importing...' : 'Quick Import'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                <Users size={24} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>{adminStats.totalStudents}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                <BookOpen size={24} color="#059669" />
              </View>
              <Text style={styles.statValue}>{adminStats.totalLectures}</Text>
              <Text style={styles.statLabel}>Total Lectures</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Calendar size={24} color="#EA580C" />
              </View>
              <Text style={styles.statValue}>{adminStats.upcomingExams}</Text>
              <Text style={styles.statLabel}>Upcoming Exams</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                <Bell size={24} color="#7C3AED" />
              </View>
              <Text style={styles.statValue}>
                {adminStats.pendingNotifications}
              </Text>
              <Text style={styles.statLabel}>Pending Alerts</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
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

        {/* Advanced Excel Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Data Management</Text>
          <View style={styles.excelSection}>
            <View style={styles.excelCard}>
              <View style={styles.excelHeader}>
                <FileSpreadsheet size={24} color="#059669" />
                <Text style={styles.excelTitle}>Bulk Data Operations</Text>
              </View>
              <Text style={styles.excelDescription}>
                Advanced Excel import/export with validation, error handling,
                and batch processing
              </Text>
              <View style={styles.excelFeatures}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>
                    Automatic data validation
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>
                    Error reporting and correction
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>
                    Batch notification scheduling
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Notification Alert */}
        <View style={styles.section}>
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={20} color="#EA580C" />
              <Text style={styles.alertTitle}>Notification System Active</Text>
            </View>
            <Text style={styles.alertText}>
              Automatic notifications are enabled for exam reminders and absence
              alerts. Guardians will receive SMS and email notifications as
              configured.
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
  adminName: {
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
  quickImportSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  quickImportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  quickImportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  quickImportTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
  },
  quickImportDescription: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  quickImportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sampleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  sampleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
  importButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  importButtonDisabled: {
    opacity: 0.7,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
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
  excelSection: {
    marginBottom: 8,
  },
  excelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  excelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  excelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  excelDescription: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  excelFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureBullet: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
  },
  alertCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  alertText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});
