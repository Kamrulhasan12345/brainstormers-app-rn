import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Calendar, Bell, Award, Target } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { examsService } from '@/services/exams';
import { isDemoMode } from '@/lib/supabase';

// Mock data for demo mode
const mockExamData = [
  {
    id: 1,
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    date: '2025-01-22',
    time: '10:00 AM - 12:00 PM',
    duration: '2 hours',
    totalMarks: 100,
    status: 'upcoming',
    type: 'Unit Test',
    location: 'Hall A',
    reminders: true,
    syllabus: ['Wave equation', 'EM spectrum', 'Properties of EM waves'],
    hasResult: false,
  },
  {
    id: 2,
    subject: 'Chemistry',
    topic: 'Organic Chemistry - Aldehydes & Ketones',
    date: '2025-01-24',
    time: '2:00 PM - 4:00 PM',
    duration: '2 hours',
    totalMarks: 80,
    status: 'upcoming',
    type: 'Chapter Test',
    location: 'Hall B',
    reminders: true,
    syllabus: ['Preparation methods', 'Chemical reactions', 'Identification tests'],
    hasResult: false,
  },
  {
    id: 3,
    subject: 'Mathematics',
    topic: 'Calculus - Integration',
    date: '2025-01-20',
    time: '9:00 AM - 11:00 AM',
    duration: '2 hours',
    totalMarks: 100,
    status: 'missed',
    type: 'Monthly Test',
    location: 'Hall C',
    reminders: false,
    syllabus: ['Indefinite integration', 'Definite integration', 'Applications'],
    hasResult: false,
  },
  {
    id: 4,
    subject: 'Biology',
    topic: 'Reproductive Health',
    date: '2025-01-18',
    time: '11:00 AM - 1:00 PM',
    duration: '2 hours',
    totalMarks: 90,
    status: 'completed',
    type: 'Unit Test',
    location: 'Hall A',
    reminders: false,
    marksObtained: 78,
    grade: 'A',
    syllabus: ['Reproductive health issues', 'Population control', 'Medical termination'],
    hasResult: true,
  },
];

const examTypes = ['All', 'Unit Test', 'Chapter Test', 'Monthly Test', 'Prelims', 'Board Exam'];

export default function ExamsScreen() {
  const [selectedType, setSelectedType] = useState('All');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemoMode()) {
        // Use mock data in demo mode
        setExams(mockExamData);
      } else {
        // Load from database
        const data = await examsService.getExams();
        const formattedExams = data.map((exam: any) => ({
          id: exam.id,
          subject: exam.subjects?.name || 'Unknown Subject',
          topic: exam.title,
          date: exam.exam_date,
          time: `${exam.start_time} - ${exam.end_time}`,
          duration: `${Math.floor(exam.duration_minutes / 60)} hours`,
          totalMarks: exam.total_marks,
          status: exam.status,
          type: exam.exam_type,
          location: exam.location || 'TBD',
          reminders: true,
          syllabus: exam.exam_syllabus?.map((s: any) => s.topic) || [],
          hasResult: exam.exam_results && exam.exam_results.length > 0,
          marksObtained: exam.exam_results?.[0]?.marks_obtained,
          grade: exam.exam_results?.[0]?.grade,
        }));
        setExams(formattedExams);
      }
    } catch (err) {
      console.error('Error loading exams:', err);
      setError('Failed to load exams. Please try again.');
      // Fallback to mock data on error
      setExams(mockExamData);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#2563EB';
      case 'missed':
        return '#EF4444';
      case 'completed':
        return '#059669';
      default:
        return '#64748B';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#EFF6FF';
      case 'missed':
        return '#FEF2F2';
      case 'completed':
        return '#ECFDF5';
      default:
        return '#F1F5F9';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return Clock;
      case 'missed':
        return AlertCircle;
      case 'completed':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const handleExamPress = (examId: number) => {
    router.push(`/(tabs)/exams/${examId}`);
  };

  const upcomingExams = exams.filter(exam => exam.status === 'upcoming');
  const missedExams = exams.filter(exam => exam.status === 'missed');

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading exams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exam Schedule</Text>
        <Text style={styles.headerSubtitle}>Track your assessments</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadExams}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <View style={styles.notificationsSection}>
          {upcomingExams.length > 0 && (
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Bell size={20} color="#EA580C" />
                <Text style={styles.alertTitle}>Upcoming Exams</Text>
              </View>
              <Text style={styles.alertText}>
                You have {upcomingExams.length} exam{upcomingExams.length > 1 ? 's' : ''} coming up this week.
              </Text>
            </View>
          )}
          
          {missedExams.length > 0 && (
            <View style={[styles.alertCard, styles.missedAlert]}>
              <View style={styles.alertHeader}>
                <AlertCircle size={20} color="#EF4444" />
                <Text style={styles.alertTitle}>Missed Exams</Text>
              </View>
              <Text style={styles.alertText}>
                You have {missedExams.length} missed exam{missedExams.length > 1 ? 's' : ''}. Contact administration for makeup dates.
              </Text>
            </View>
          )}
        </View>

        {/* Exam Type Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.typeContainer}>
              {examTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    selectedType === type && styles.typeChipActive
                  ]}
                  onPress={() => setSelectedType(type)}>
                  <Text style={[
                    styles.typeText,
                    selectedType === type && styles.typeTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Exam Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Exams</Text>
          {exams.map((exam) => {
            const StatusIcon = getStatusIcon(exam.status);
            return (
              <TouchableOpacity 
                key={exam.id} 
                style={styles.examCard}
                onPress={() => handleExamPress(exam.id)}>
                <View style={styles.cardHeader}>
                  <View style={styles.examInfo}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBgColor(exam.status) }
                    ]}>
                      <StatusIcon size={12} color={getStatusColor(exam.status)} />
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(exam.status) }
                      ]}>
                        {exam.status.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.typeTag}>
                      <Text style={styles.typeTagText}>{exam.type}</Text>
                    </View>
                  </View>
                  {exam.reminders && (
                    <TouchableOpacity style={styles.reminderButton}>
                      <Bell size={16} color="#2563EB" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.examSubject}>{exam.subject}</Text>
                <Text style={styles.examTopic}>{exam.topic}</Text>

                <View style={styles.examDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#64748B" />
                    <Text style={styles.detailText}>
                      {new Date(exam.date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color="#64748B" />
                    <Text style={styles.detailText}>{exam.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Target size={16} color="#64748B" />
                    <Text style={styles.detailText}>Total Marks: {exam.totalMarks}</Text>
                  </View>
                </View>

                {exam.status === 'completed' && exam.marksObtained && (
                  <View style={styles.resultSection}>
                    <View style={styles.scoreCard}>
                      <Award size={20} color="#059669" />
                      <View style={styles.scoreInfo}>
                        <Text style={styles.scoreText}>
                          {exam.marksObtained}/{exam.totalMarks}
                        </Text>
                        <Text style={styles.gradeText}>Grade: {exam.grade}</Text>
                      </View>
                      <View style={styles.percentageCircle}>
                        <Text style={styles.percentageText}>
                          {Math.round((exam.marksObtained / exam.totalMarks) * 100)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.syllabusSection}>
                  <Text style={styles.syllabusTitle}>Syllabus Coverage:</Text>
                  <View style={styles.syllabusTopics}>
                    {exam.syllabus.map((topic: string, index: number) => (
                      <View key={index} style={styles.topicChip}>
                        <Text style={styles.topicText}>{topic}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.locationText}>📍 {exam.location}</Text>
                  <Text style={styles.durationText}>⏱️ {exam.duration}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  notificationsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
  },
  missedAlert: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#EF4444',
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
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  typeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeChipActive: {
    backgroundColor: '#2563EB',
  },
  typeText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Medium',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  examInfo: {
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  typeTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeTagText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  reminderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  examSubject: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  examTopic: {
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  examDetails: {
    gap: 8,
    marginBottom: 16,
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
  resultSection: {
    marginBottom: 16,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    fontFamily: 'Inter-Bold',
  },
  gradeText: {
    fontSize: 14,
    color: '#065F46',
    fontFamily: 'Inter-Medium',
  },
  percentageCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  syllabusSection: {
    marginBottom: 16,
  },
  syllabusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  syllabusTopics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  topicText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'Inter-Regular',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  locationText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  durationText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
});