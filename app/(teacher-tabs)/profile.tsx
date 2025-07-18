import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Users,
  Settings,
  LogOut,
} from 'lucide-react-native';

export default function TeacherProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login-selection');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const profileStats = [
    { label: 'Courses Teaching', value: '8', icon: BookOpen },
    { label: 'Total Students', value: '156', icon: Users },
    { label: 'Years Experience', value: '12', icon: Award },
    { label: 'Department Rating', value: '4.8', icon: Calendar },
  ];

  const profileSections = [
    {
      title: 'Contact Information',
      items: [
        {
          icon: Mail,
          label: 'Email',
          value: user?.email || 'teacher@brainstormers.edu',
        },
        { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
        { icon: MapPin, label: 'Office', value: 'Room 204, Science Building' },
      ],
    },
    {
      title: 'Teaching Schedule',
      items: [
        {
          icon: Calendar,
          label: 'Office Hours',
          value: 'Mon-Fri, 2:00-4:00 PM',
        },
        { icon: BookOpen, label: 'Department', value: 'Computer Science' },
        {
          icon: Users,
          label: 'Current Load',
          value: '8 courses, 156 students',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Teacher Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <User size={48} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.profileName}>Dr. Sarah Johnson</Text>
          <Text style={styles.profileRole}>Computer Science Teacher</Text>
          <Text style={styles.profileDepartment}>
            Department of Computer Science
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {profileStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <stat.icon size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <item.icon size={20} color="#6B7280" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionItem}>
              <Settings size={24} color="#6B7280" />
              <Text style={styles.actionText}>Account Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Calendar size={24} color="#6B7280" />
              <Text style={styles.actionText}>Schedule Management</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
  },
  settingsButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  profileDepartment: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Medium',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionText: {
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Medium',
    marginLeft: 16,
  },
  logoutSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
});
