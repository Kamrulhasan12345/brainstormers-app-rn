import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Clock, BookOpen, Calendar, TrendingUp, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const upcomingLectures = [
  { id: 1, subject: 'Physics', topic: 'Electromagnetic Induction', time: '10:00 AM', date: 'Today' },
  { id: 2, subject: 'Chemistry', topic: 'Organic Compounds', time: '2:00 PM', date: 'Today' },
  { id: 3, subject: 'Mathematics', topic: 'Calculus - Derivatives', time: '9:00 AM', date: 'Tomorrow' },
];

const recentNotifications = [
  { id: 1, title: 'Physics Test Tomorrow', message: 'Electromagnetic waves chapter test at 11 AM', time: '2h ago', type: 'exam' },
  { id: 2, title: 'New Study Material', message: 'Chemistry notes uploaded for Organic compounds', time: '4h ago', type: 'material' },
];

const todayStats = {
  lecturesAttended: 3,
  totalLectures: 4,
  assignmentsCompleted: 2,
  totalAssignments: 3,
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.userName}>Arjun Sharma</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={24} color="#64748B" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* BrainStormers Branding */}
        <LinearGradient
          colors={['#2563EB', '#1D4ED8']}
          style={styles.brandingCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Text style={styles.brandingTitle}>BrainStormers</Text>
          <Text style={styles.brandingSubtitle}>Excellence in HSC Education</Text>
          <View style={styles.brandingStats}>
            <View style={styles.statItem}>
              <Star size={16} color="#FFF" />
              <Text style={styles.statText}>4.9 Rating</Text>
            </View>
            <View style={styles.statItem}>
              <TrendingUp size={16} color="#FFF" />
              <Text style={styles.statText}>98% Success Rate</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Today's Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <View style={styles.progressCircle}>
                  <BookOpen size={20} color="#2563EB" />
                </View>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressValue}>{todayStats.lecturesAttended}/{todayStats.totalLectures}</Text>
                  <Text style={styles.progressLabel}>Lectures</Text>
                </View>
              </View>
              <View style={styles.progressItem}>
                <View style={styles.progressCircle}>
                  <Calendar size={20} color="#059669" />
                </View>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressValue}>{todayStats.assignmentsCompleted}/{todayStats.totalAssignments}</Text>
                  <Text style={styles.progressLabel}>Assignments</Text>
                </View>
              </View>
            </View>
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
              <Text style={styles.lectureDate}>{lecture.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {recentNotifications.map((notification) => (
            <TouchableOpacity key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationContent}>
                <View style={[styles.notificationDot, { backgroundColor: notification.type === 'exam' ? '#EF4444' : '#2563EB' }]} />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                </View>
              </View>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </TouchableOpacity>
          ))}
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
  welcomeTitle: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginTop: 2,
  },
  headerRight: {
    position: 'relative',
  },
  notificationButton: {
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  brandingCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  brandingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  brandingSubtitle: {
    fontSize: 16,
    color: '#BFDBFE',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  brandingStats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInfo: {
    alignItems: 'flex-start',
  },
  progressValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
  },
  progressLabel: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
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
    marginBottom: 4,
  },
  lectureDate: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
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
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
    alignSelf: 'flex-end',
  },
});