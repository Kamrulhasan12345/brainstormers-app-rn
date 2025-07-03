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
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  FileText,
  Play,
  Pause,
  CheckCircle,
} from 'lucide-react-native';

interface Lecture {
  id: string;
  title: string;
  subject: string;
  class: string;
  date: string;
  time: string;
  duration: number; // in minutes
  location: string;
  type: 'in-person' | 'online';
  status: 'upcoming' | 'ongoing' | 'completed';
  attendanceCount: number;
  totalStudents: number;
  description: string;
  materials?: string[];
}

export default function TeacherLecturesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockLectures: Lecture[] = [
      {
        id: '1',
        title: 'Organic Chemistry - Alcohols & Phenols',
        subject: 'Chemistry',
        class: 'HSC Science - Batch 2027',
        date: '2025-07-04',
        time: '10:00 AM',
        duration: 90,
        location: 'Room 101',
        type: 'in-person',
        status: 'upcoming',
        attendanceCount: 0,
        totalStudents: 45,
        description:
          'Introduction to alcohols, phenols, and their properties. We will cover nomenclature, preparation methods, and reactions.',
        materials: ['Chapter 11 Notes', 'Practice Problems', 'Lab Manual'],
      },
      {
        id: '2',
        title: 'Calculus - Limits and Continuity',
        subject: 'Mathematics',
        class: 'HSC Science - Batch 2027',
        date: '2025-07-03',
        time: '02:00 PM',
        duration: 75,
        location: 'Online',
        type: 'online',
        status: 'ongoing',
        attendanceCount: 42,
        totalStudents: 45,
        description:
          'Understanding limits, continuity, and their applications in calculus.',
      },
      {
        id: '3',
        title: 'Physics - Electromagnetic Induction',
        subject: 'Physics',
        class: 'HSC Science - Batch 2027',
        date: '2025-07-02',
        time: '11:00 AM',
        duration: 80,
        location: 'Physics Lab',
        type: 'in-person',
        status: 'completed',
        attendanceCount: 43,
        totalStudents: 45,
        description:
          "Faraday's law, Lenz's law, and practical applications of electromagnetic induction.",
        materials: ['Lab Report Template', 'Reference Videos'],
      },
      {
        id: '4',
        title: 'Business Studies - Marketing Management',
        subject: 'Business Studies',
        class: 'HSC Commerce - Batch 2027',
        date: '2025-07-05',
        time: '09:00 AM',
        duration: 60,
        location: 'Room 205',
        type: 'in-person',
        status: 'upcoming',
        attendanceCount: 0,
        totalStudents: 35,
        description:
          'Marketing mix, consumer behavior, and market segmentation strategies.',
      },
    ];
    setLectures(mockLectures);
  }, []);

  const filters = ['All', 'Upcoming', 'Ongoing', 'Completed'];

  const filteredLectures =
    selectedFilter === 'All'
      ? lectures
      : lectures.filter(
          (lecture) => lecture.status === selectedFilter.toLowerCase()
        );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#F59E0B';
      case 'ongoing':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock size={16} color="#F59E0B" />;
      case 'ongoing':
        return <Play size={16} color="#10B981" />;
      case 'completed':
        return <CheckCircle size={16} color="#6B7280" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const handleLectureAction = (lecture: Lecture) => {
    if (lecture.status === 'upcoming') {
      Alert.alert('Start Lecture', `Start "${lecture.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => console.log('Starting lecture:', lecture.id),
        },
      ]);
    } else if (lecture.status === 'ongoing') {
      Alert.alert('Lecture Actions', 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Attendance',
          onPress: () => console.log('Taking attendance'),
        },
        { text: 'End Lecture', onPress: () => console.log('Ending lecture') },
      ]);
    } else {
      router.push(`/lectures/${lecture.id}`);
    }
  };

  const renderLecture = ({ item }: { item: Lecture }) => (
    <TouchableOpacity
      style={styles.lectureCard}
      onPress={() => handleLectureAction(item)}
    >
      <View style={styles.lectureHeader}>
        <View style={styles.lectureInfo}>
          <Text style={styles.lectureTitle}>{item.title}</Text>
          <Text style={styles.lectureSubject}>
            {item.subject} • {item.class}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          {getStatusIcon(item.status)}
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.lectureDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.detailText}>
            {item.date} at {item.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color="#64748B" />
          <Text style={styles.detailText}>{item.duration} minutes</Text>
        </View>
        <View style={styles.detailRow}>
          {item.type === 'online' ? (
            <Video size={16} color="#64748B" />
          ) : (
            <MapPin size={16} color="#64748B" />
          )}
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Users size={16} color="#64748B" />
          <Text style={styles.detailText}>
            {item.attendanceCount}/{item.totalStudents} students
          </Text>
        </View>
      </View>

      <Text style={styles.lectureDescription}>{item.description}</Text>

      {item.materials && item.materials.length > 0 && (
        <View style={styles.materialsContainer}>
          <FileText size={16} color="#7C3AED" />
          <Text style={styles.materialsText}>
            {item.materials.length} material
            {item.materials.length > 1 ? 's' : ''} attached
          </Text>
        </View>
      )}

      <View style={styles.lectureActions}>
        {item.status === 'upcoming' && (
          <Text style={styles.actionHint}>Tap to start lecture</Text>
        )}
        {item.status === 'ongoing' && (
          <Text style={[styles.actionHint, { color: '#10B981' }]}>
            Tap to manage lecture
          </Text>
        )}
        {item.status === 'completed' && (
          <Text style={styles.actionHint}>Tap to view details</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!user || user.role !== 'teacher') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Lectures</Text>
        <Text style={styles.subtitle}>Manage your teaching schedule</Text>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.statusFilter,
                selectedFilter === filter && styles.statusFilterActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  selectedFilter === filter && styles.statusFilterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Clock size={20} color="#F59E0B" />
          <Text style={styles.statNumber}>
            {lectures.filter((l) => l.status === 'upcoming').length}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Play size={20} color="#10B981" />
          <Text style={styles.statNumber}>
            {lectures.filter((l) => l.status === 'ongoing').length}
          </Text>
          <Text style={styles.statLabel}>Ongoing</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={20} color="#6B7280" />
          <Text style={styles.statNumber}>
            {lectures.filter((l) => l.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Lectures List */}
      <FlatList
        data={filteredLectures}
        renderItem={renderLecture}
        keyExtractor={(item) => item.id}
        style={styles.lecturesList}
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
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusFilterActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  statusFilterText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  statusFilterTextActive: {
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  lecturesList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  lectureCard: {
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
  lectureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lectureInfo: {
    flex: 1,
    marginRight: 12,
  },
  lectureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  lectureSubject: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  lectureDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  lectureDescription: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  materialsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  materialsText: {
    fontSize: 14,
    color: '#7C3AED',
    fontFamily: 'Inter-Medium',
  },
  lectureActions: {
    alignItems: 'center',
  },
  actionHint: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
});
