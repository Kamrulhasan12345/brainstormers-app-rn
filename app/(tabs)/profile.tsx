import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Bell, BookOpen, Award, TrendingUp, Calendar, LogOut, CreditCard as Edit3, Mail, Phone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

const studentData = {
  name: 'Arjun Sharma',
  rollNumber: 'BS2027001',
  class: 'HSC Science - Batch 2027',
  email: 'arjun.sharma@brainstormers.edu',
  phone: '+91 98765 43210',
  joinDate: 'August 2024',
  profilePicture: 'AS',
};

const academicStats = {
  totalLectures: 156,
  attendedLectures: 142,
  assignmentsCompleted: 89,
  totalAssignments: 95,
  averageScore: 87.5,
  rank: 5,
  totalStudents: 120,
};

const recentActivity = [
  { id: 1, type: 'exam', title: 'Biology Unit Test', score: '78/90', date: '2 days ago' },
  { id: 2, type: 'assignment', title: 'Chemistry Lab Report', score: '92/100', date: '5 days ago' },
  { id: 3, type: 'lecture', title: 'Physics - Electromagnetic Induction', status: 'Attended', date: '1 week ago' },
  { id: 4, type: 'qna', title: 'Asked question in Mathematics', status: 'Answered', date: '1 week ago' },
];

const subjects = [
  { name: 'Physics', score: 85, color: '#2563EB' },
  { name: 'Chemistry', score: 92, color: '#059669' },
  { name: 'Mathematics', score: 88, color: '#EA580C' },
  { name: 'Biology', score: 84, color: '#7C3AED' },
];

const menuItems = [
  { id: 1, title: 'Edit Profile', icon: Edit3, color: '#2563EB' },
  { id: 2, title: 'Notifications', icon: Bell, color: '#EA580C' },
  { id: 3, title: 'Settings', icon: Settings, color: '#64748B' },
  { id: 4, title: 'Help & Support', icon: Mail, color: '#059669' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const attendancePercentage = Math.round((academicStats.attendedLectures / academicStats.totalLectures) * 100);
  const assignmentPercentage = Math.round((academicStats.assignmentsCompleted / academicStats.totalAssignments) * 100);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#2563EB', '#1D4ED8']}
          style={styles.profileHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <View style={styles.profileInfo}>
            <View style={styles.profilePicture}>
              <Text style={styles.profileInitials}>{user?.name?.split(' ').map(n => n[0]).join('') || 'U'}</Text>
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{user?.name || 'User'}</Text>
              <Text style={styles.rollNumber}>Roll No: {user?.rollNumber || 'N/A'}</Text>
              <Text style={styles.className}>{user?.class || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Mail size={14} color="#BFDBFE" />
              <Text style={styles.contactText}>{user?.email || 'N/A'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={14} color="#BFDBFE" />
              <Text style={styles.contactText}>{user?.phone || 'N/A'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Academic Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <BookOpen size={24} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>{attendancePercentage}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
              <Text style={styles.statDetail}>
                {academicStats.attendedLectures}/{academicStats.totalLectures} lectures
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Award size={24} color="#059669" />
              </View>
              <Text style={styles.statValue}>{assignmentPercentage}%</Text>
              <Text style={styles.statLabel}>Assignments</Text>
              <Text style={styles.statDetail}>
                {academicStats.assignmentsCompleted}/{academicStats.totalAssignments} completed
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <TrendingUp size={24} color="#EA580C" />
              </View>
              <Text style={styles.statValue}>{academicStats.averageScore}%</Text>
              <Text style={styles.statLabel}>Average Score</Text>
              <Text style={styles.statDetail}>Overall performance</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Award size={24} color="#7C3AED" />
              </View>
              <Text style={styles.statValue}>#{academicStats.rank}</Text>
              <Text style={styles.statLabel}>Class Rank</Text>
              <Text style={styles.statDetail}>
                Out of {academicStats.totalStudents} students
              </Text>
            </View>
          </View>
        </View>

        {/* Subject Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Performance</Text>
          <View style={styles.subjectsContainer}>
            {subjects.map((subject, index) => (
              <View key={index} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={[styles.subjectScore, { color: subject.color }]}>
                    {subject.score}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${subject.score}%`, backgroundColor: subject.color }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                {activity.type === 'exam' && <Award size={20} color="#EA580C" />}
                {activity.type === 'assignment' && <BookOpen size={20} color="#059669" />}
                {activity.type === 'lecture' && <Calendar size={20} color="#2563EB" />}
                {activity.type === 'qna' && <User size={20} color="#7C3AED" />}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDetail}>
                  {activity.score || activity.status} • {activity.date}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Menu Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <item.icon size={20} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: '#FEF2F2' }]}>
              <LogOut size={20} color="#EF4444" />
            </View>
            <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* BrainStormers Info */}
        <View style={styles.section}>
          <View style={styles.brandingFooter}>
            <Text style={styles.brandingText}>
              Member since {studentData.joinDate}
            </Text>
            <Text style={styles.brandingSubtext}>
              BrainStormers - Excellence in Education
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
  profileHeader: {
    padding: 24,
    paddingTop: 40,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  rollNumber: {
    fontSize: 16,
    color: '#BFDBFE',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  className: {
    fontSize: 14,
    color: '#BFDBFE',
    fontFamily: 'Inter-Regular',
  },
  contactInfo: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#BFDBFE',
    fontFamily: 'Inter-Regular',
  },
  section: {
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
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
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
    backgroundColor: '#F8FAFC',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  statDetail: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  subjectsContainer: {
    gap: 12,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  subjectScore: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  activityDetail: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontFamily: 'Inter-Medium',
  },
  brandingFooter: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  brandingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  brandingSubtext: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
});