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
  FileText,
  Clock,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react-native';

interface Exam {
  id: string;
  title: string;
  subject: string;
  class: string;
  date: string;
  time: string;
  duration: number; // in minutes
  totalMarks: number;
  type:
    | 'Unit Test'
    | 'Chapter Test'
    | 'Monthly Test'
    | 'Prelims'
    | 'Board Exam';
  status: 'upcoming' | 'ongoing' | 'completed' | 'grading';
  studentsEnrolled: number;
  studentsCompleted: number;
  averageScore?: number;
  syllabus: string[];
}

export default function TeacherExamsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockExams: Exam[] = [
      {
        id: '1',
        title: 'Organic Chemistry Unit Test',
        subject: 'Chemistry',
        class: 'HSC Science - Batch 2027',
        date: '2025-07-10',
        time: '10:00 AM',
        duration: 90,
        totalMarks: 50,
        type: 'Unit Test',
        status: 'upcoming',
        studentsEnrolled: 45,
        studentsCompleted: 0,
        syllabus: ['Alcohols', 'Phenols', 'Ethers', 'Aldehydes', 'Ketones'],
      },
      {
        id: '2',
        title: 'Calculus Chapter Test',
        subject: 'Mathematics',
        class: 'HSC Science - Batch 2027',
        date: '2025-07-05',
        time: '02:00 PM',
        duration: 120,
        totalMarks: 80,
        type: 'Chapter Test',
        status: 'grading',
        studentsEnrolled: 45,
        studentsCompleted: 43,
        averageScore: 72,
        syllabus: ['Limits', 'Continuity', 'Differentiation'],
      },
      {
        id: '3',
        title: 'Physics Monthly Assessment',
        subject: 'Physics',
        class: 'HSC Science - Batch 2027',
        date: '2025-06-28',
        time: '09:00 AM',
        duration: 180,
        totalMarks: 100,
        type: 'Monthly Test',
        status: 'completed',
        studentsEnrolled: 45,
        studentsCompleted: 44,
        averageScore: 78,
        syllabus: ['Electromagnetic Induction', 'AC Circuits', 'Wave Optics'],
      },
      {
        id: '4',
        title: 'Business Studies Prelims',
        subject: 'Business Studies',
        class: 'HSC Commerce - Batch 2027',
        date: '2025-07-15',
        time: '10:00 AM',
        duration: 180,
        totalMarks: 80,
        type: 'Prelims',
        status: 'upcoming',
        studentsEnrolled: 35,
        studentsCompleted: 0,
        syllabus: [
          'Marketing',
          'Human Resource Management',
          'Financial Management',
        ],
      },
    ];
    setExams(mockExams);
  }, []);

  const filters = ['All', 'Upcoming', 'Ongoing', 'Grading', 'Completed'];

  const filteredExams =
    selectedFilter === 'All'
      ? exams
      : exams.filter((exam) => exam.status === selectedFilter.toLowerCase());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#F59E0B';
      case 'ongoing':
        return '#10B981';
      case 'grading':
        return '#8B5CF6';
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
        return <AlertCircle size={16} color="#10B981" />;
      case 'grading':
        return <FileText size={16} color="#8B5CF6" />;
      case 'completed':
        return <CheckCircle size={16} color="#6B7280" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Unit Test':
        return '#10B981';
      case 'Chapter Test':
        return '#3B82F6';
      case 'Monthly Test':
        return '#F59E0B';
      case 'Prelims':
        return '#EF4444';
      case 'Board Exam':
        return '#7C3AED';
      default:
        return '#6B7280';
    }
  };

  const handleExamAction = (exam: Exam) => {
    if (exam.status === 'upcoming') {
      Alert.alert('Exam Actions', `"${exam.title}"`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit Exam',
          onPress: () => console.log('Edit exam:', exam.id),
        },
        {
          text: 'Start Exam',
          onPress: () => console.log('Start exam:', exam.id),
        },
      ]);
    } else if (exam.status === 'grading') {
      router.push(`/exams/${exam.id}/grading`);
    } else if (exam.status === 'completed') {
      router.push(`/exams/${exam.id}/results`);
    }
  };

  const handleCreateExam = () => {
    Alert.alert(
      'Create New Exam',
      'What type of exam would you like to create?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unit Test', onPress: () => console.log('Create Unit Test') },
        {
          text: 'Chapter Test',
          onPress: () => console.log('Create Chapter Test'),
        },
        {
          text: 'Monthly Test',
          onPress: () => console.log('Create Monthly Test'),
        },
      ]
    );
  };

  const renderExam = ({ item }: { item: Exam }) => (
    <TouchableOpacity
      style={styles.examCard}
      onPress={() => handleExamAction(item)}
    >
      <View style={styles.examHeader}>
        <View style={styles.examInfo}>
          <Text style={styles.examTitle}>{item.title}</Text>
          <Text style={styles.examSubject}>
            {item.subject} • {item.class}
          </Text>
        </View>
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: getTypeColor(item.type) },
            ]}
          >
            <Text style={styles.typeBadgeText}>{item.type}</Text>
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
      </View>

      <View style={styles.examDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.detailText}>
            {item.date} at {item.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color="#64748B" />
          <Text style={styles.detailText}>
            {item.duration} minutes • {item.totalMarks} marks
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Users size={16} color="#64748B" />
          <Text style={styles.detailText}>
            {item.studentsCompleted}/{item.studentsEnrolled} students completed
          </Text>
        </View>
        {item.averageScore && (
          <View style={styles.detailRow}>
            <TrendingUp size={16} color="#64748B" />
            <Text style={styles.detailText}>
              Average Score: {item.averageScore}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.syllabusContainer}>
        <Text style={styles.syllabusTitle}>Syllabus:</Text>
        <Text style={styles.syllabusText}>{item.syllabus.join(', ')}</Text>
      </View>

      <View style={styles.examActions}>
        {item.status === 'upcoming' && (
          <Text style={styles.actionHint}>Tap to edit or start exam</Text>
        )}
        {item.status === 'grading' && (
          <Text style={[styles.actionHint, { color: '#8B5CF6' }]}>
            Tap to grade papers
          </Text>
        )}
        {item.status === 'completed' && (
          <Text style={styles.actionHint}>Tap to view results</Text>
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
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>My Exams</Text>
            <Text style={styles.subtitle}>Create and manage examinations</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateExam}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
            {exams.filter((e) => e.status === 'upcoming').length}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <FileText size={20} color="#8B5CF6" />
          <Text style={styles.statNumber}>
            {exams.filter((e) => e.status === 'grading').length}
          </Text>
          <Text style={styles.statLabel}>To Grade</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={20} color="#6B7280" />
          <Text style={styles.statNumber}>
            {exams.filter((e) => e.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Exams List */}
      <FlatList
        data={filteredExams}
        renderItem={renderExam}
        keyExtractor={(item) => item.id}
        style={styles.examsList}
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createButton: {
    width: 44,
    height: 44,
    backgroundColor: '#7C3AED',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  examsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  examCard: {
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
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  examInfo: {
    flex: 1,
    marginRight: 12,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  examSubject: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  badgeContainer: {
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  typeBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  examDetails: {
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
  syllabusContainer: {
    marginBottom: 12,
  },
  syllabusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  syllabusText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  examActions: {
    alignItems: 'center',
  },
  actionHint: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
});
