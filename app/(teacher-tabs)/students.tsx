import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  UserCheck,
  UserX,
  Phone,
  Mail,
} from 'lucide-react-native';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  email: string;
  phone?: string;
  attendancePercentage: number;
  lastSeen: string;
  status: 'active' | 'inactive';
}

export default function TeacherStudentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('All Classes');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockStudents: Student[] = [
      {
        id: '1',
        name: 'Arjun Sharma',
        rollNumber: 'BS2027001',
        class: 'HSC Science - Batch 2027',
        email: 'arjun.sharma@student.brainstormers.edu',
        phone: '+91 98765 43210',
        attendancePercentage: 92,
        lastSeen: '2 hours ago',
        status: 'active',
      },
      {
        id: '2',
        name: 'Priya Patel',
        rollNumber: 'BS2027002',
        class: 'HSC Science - Batch 2027',
        email: 'priya.patel@student.brainstormers.edu',
        phone: '+91 98765 43211',
        attendancePercentage: 88,
        lastSeen: '1 day ago',
        status: 'active',
      },
      {
        id: '3',
        name: 'Rahul Kumar',
        rollNumber: 'BS2027003',
        class: 'HSC Commerce - Batch 2027',
        email: 'rahul.kumar@student.brainstormers.edu',
        phone: '+91 98765 43212',
        attendancePercentage: 75,
        lastSeen: '3 days ago',
        status: 'inactive',
      },
      {
        id: '4',
        name: 'Sneha Desai',
        rollNumber: 'BS2027004',
        class: 'HSC Science - Batch 2027',
        email: 'sneha.desai@student.brainstormers.edu',
        phone: '+91 98765 43213',
        attendancePercentage: 95,
        lastSeen: '30 minutes ago',
        status: 'active',
      },
    ];
    setStudents(mockStudents);
  }, []);

  const classes = [
    'All Classes',
    'HSC Science - Batch 2027',
    'HSC Commerce - Batch 2027',
  ];

  const filteredStudents =
    selectedClass === 'All Classes'
      ? students
      : students.filter((student) => student.class === selectedClass);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return '#10B981';
    if (percentage >= 75) return '#F59E0B';
    return '#EF4444';
  };

  const handleContactStudent = (student: Student) => {
    Alert.alert('Contact Student', `Contact ${student.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => console.log(`Calling ${student.phone}`) },
      {
        text: 'Email',
        onPress: () => console.log(`Emailing ${student.email}`),
      },
    ]);
  };

  const renderStudent = ({ item }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentDetails}>
            {item.rollNumber} • {item.class}
          </Text>
          <Text style={styles.lastSeen}>Last seen: {item.lastSeen}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === 'active' ? '#10B981' : '#6B7280',
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.studentStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Attendance</Text>
          <View style={styles.attendanceContainer}>
            <View
              style={[
                styles.attendanceBar,
                {
                  backgroundColor: getAttendanceColor(
                    item.attendancePercentage
                  ),
                },
              ]}
            />
            <Text
              style={[
                styles.attendanceText,
                { color: getAttendanceColor(item.attendancePercentage) },
              ]}
            >
              {item.attendancePercentage}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.studentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleContactStudent(item)}
        >
          <Phone size={16} color="#7C3AED" />
          <Text style={styles.actionText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => console.log('View progress for', item.name)}
        >
          <TrendingUp size={16} color="#7C3AED" />
          <Text style={styles.actionText}>Progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!user || user.role !== 'teacher') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Students</Text>
        <Text style={styles.subtitle}>Manage and track student progress</Text>
      </View>

      {/* Class Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {classes.map((className) => (
            <TouchableOpacity
              key={className}
              style={[
                styles.classFilter,
                selectedClass === className && styles.classFilterActive,
              ]}
              onPress={() => setSelectedClass(className)}
            >
              <Text
                style={[
                  styles.classFilterText,
                  selectedClass === className && styles.classFilterTextActive,
                ]}
              >
                {className}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Users size={24} color="#7C3AED" />
          <Text style={styles.statNumber}>{filteredStudents.length}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statCard}>
          <UserCheck size={24} color="#10B981" />
          <Text style={styles.statNumber}>
            {filteredStudents.filter((s) => s.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>
            {Math.round(
              filteredStudents.reduce(
                (acc, s) => acc + s.attendancePercentage,
                0
              ) / filteredStudents.length
            )}
            %
          </Text>
          <Text style={styles.statLabel}>Avg Attendance</Text>
        </View>
      </View>

      {/* Students List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        style={styles.studentsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  filterContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  classFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  classFilterActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  classFilterText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  classFilterTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  studentsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  studentStats: {
    marginBottom: 16,
  },
  statItem: {
    marginBottom: 8,
  },
  attendanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendanceBar: {
    width: 40,
    height: 6,
    borderRadius: 3,
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  studentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#7C3AED',
    fontFamily: 'Inter-Medium',
  },
});
