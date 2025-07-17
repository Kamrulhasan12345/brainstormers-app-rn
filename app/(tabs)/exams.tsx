import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { examManagementService } from '../../services/exam-management';
import {
  Calendar,
  Clock,
  Target,
  Users,
  Filter,
  ChevronRight,
  Search,
} from 'lucide-react-native';

export default function ExamsScreen() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<
    'all' | 'today' | 'tomorrow' | 'this_week'
  >('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load from database
      const data = await examManagementService.getExams();

      // Get batches for each exam and format the data
      const formattedExams = await Promise.all(
        data.map(async (exam: any) => {
          try {
            const batches = await examManagementService.getExamBatches(exam.id);
            const firstBatch = batches[0];

            // Calculate duration from first batch times
            let duration = 'N/A';
            if (firstBatch?.scheduled_start && firstBatch?.scheduled_end) {
              const startTime = new Date(firstBatch.scheduled_start);
              const endTime = new Date(firstBatch.scheduled_end);
              const durationMinutes =
                (endTime.getTime() - startTime.getTime()) / (1000 * 60);
              const hours = Math.floor(durationMinutes / 60);
              const minutes = durationMinutes % 60;
              duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            }

            // Format date and time from first batch
            let examDate = 'TBD';
            let examTime = 'TBD';
            if (firstBatch?.scheduled_start) {
              const startDateTime = new Date(firstBatch.scheduled_start);
              examDate = startDateTime.toISOString().split('T')[0];
              examTime = startDateTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });

              if (firstBatch.scheduled_end) {
                const endDateTime = new Date(firstBatch.scheduled_end);
                examTime += ` - ${endDateTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}`;
              }
            }

            // Determine exam status
            let status = 'scheduled';
            const now = new Date();
            if (firstBatch?.scheduled_start) {
              const startTime = new Date(firstBatch.scheduled_start);
              const endTime = firstBatch.scheduled_end
                ? new Date(firstBatch.scheduled_end)
                : startTime;

              if (now > endTime) {
                status = 'completed';
              } else if (now < startTime) {
                status = 'upcoming';
              } else {
                status = 'ongoing';
              }
            }

            return {
              ...exam,
              batches,
              duration,
              nextBatch: firstBatch,
              status,
              testType: exam.subject || 'General',
              date: examDate,
              time: examTime,
              totalMarks: exam.total_marks,
            };
          } catch (err) {
            console.error(`Error loading batches for exam ${exam.id}:`, err);
            return {
              ...exam,
              batches: [],
              duration: 'N/A',
              nextBatch: null,
              status: 'scheduled',
              testType: exam.subject || 'General',
              date: exam.created_at,
              time: 'N/A',
              totalMarks: exam.total_marks,
            };
          }
        })
      );

      setExams(formattedExams);

      // Extract unique subjects
      const uniqueSubjects = Array.from(
        new Set(formattedExams.map((exam) => exam.subject).filter(Boolean))
      );
      setSubjects(['All', ...uniqueSubjects]);
    } catch (err) {
      console.error('Error loading exams:', err);
      setError('Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExams();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#2563EB';
      case 'ongoing':
        return '#EA580C';
      case 'completed':
        return '#059669';
      default:
        return '#64748B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      default:
        return 'Scheduled';
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const examDate = new Date(dateString);
    return examDate.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const examDate = new Date(dateString);
    return examDate.toDateString() === tomorrow.toDateString();
  };

  const isThisWeek = (dateString: string) => {
    const today = new Date();
    const examDate = new Date(dateString);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return examDate >= startOfWeek && examDate <= endOfWeek;
  };

  const getFilteredExams = () => {
    let filtered = exams;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (exam) =>
          exam.name?.toLowerCase().includes(query) ||
          exam.subject?.toLowerCase().includes(query) ||
          exam.topic?.toLowerCase().includes(query) ||
          exam.course?.name?.toLowerCase().includes(query)
      );
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      filtered = filtered.filter((exam) => {
        const examDate = exam.nextBatch?.scheduled_start || exam.date;
        switch (timeFilter) {
          case 'today':
            return isToday(examDate);
          case 'tomorrow':
            return isTomorrow(examDate);
          case 'this_week':
            return isThisWeek(examDate);
          default:
            return true;
        }
      });
    }

    // Apply subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.subject === subjectFilter);
    }

    return filtered;
  };

  const handleExamPress = (exam: any) => {
    router.push(`/exams/${exam.id}`);
  };

  const renderSearchBar = () => {
    return (
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exams by name, subject, or topic..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>
    );
  };

  const renderTimeFilter = () => {
    const timeOptions = [
      { value: 'all', label: 'All' },
      { value: 'today', label: 'Today' },
      { value: 'tomorrow', label: 'Tomorrow' },
      { value: 'this_week', label: 'This Week' },
    ];

    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Time Filter:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {timeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                timeFilter === option.value && styles.filterButtonActive,
              ]}
              onPress={() => setTimeFilter(option.value as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  timeFilter === option.value && styles.filterButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSubjectFilter = () => {
    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Subject Filter:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.filterButton,
                (subjectFilter === 'all' && subject === 'All') ||
                subjectFilter === subject
                  ? styles.filterButtonActive
                  : null,
              ]}
              onPress={() =>
                setSubjectFilter(subject === 'All' ? 'all' : subject)
              }
            >
              <Text
                style={[
                  styles.filterButtonText,
                  (subjectFilter === 'all' && subject === 'All') ||
                  subjectFilter === subject
                    ? styles.filterButtonTextActive
                    : null,
                ]}
              >
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderExamCard = (exam: any) => (
    <TouchableOpacity
      key={exam.id}
      style={styles.examCard}
      onPress={() => handleExamPress(exam)}
    >
      <View style={styles.examHeader}>
        <Text style={styles.examName}>{exam.name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(exam.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(exam.status)}</Text>
        </View>
      </View>

      <Text style={styles.examSubject}>{exam.subject}</Text>
      {exam.topic && <Text style={styles.examTopic}>{exam.topic}</Text>}

      <View style={styles.examDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.detailText}>{exam.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color="#64748B" />
          <Text style={styles.detailText}>{exam.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Target size={16} color="#64748B" />
          <Text style={styles.detailText}>{exam.totalMarks} marks</Text>
        </View>
        <View style={styles.detailRow}>
          <Users size={16} color="#64748B" />
          <Text style={styles.detailText}>{exam.duration}</Text>
        </View>
      </View>

      <View style={styles.examFooter}>
        <Text style={styles.courseText}>{exam.course?.name || 'General'}</Text>
        <ChevronRight size={20} color="#64748B" />
      </View>
    </TouchableOpacity>
  );

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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadExams}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredExams = getFilteredExams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exams</Text>
        <TouchableOpacity style={styles.filterIcon}>
          <Filter size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderSearchBar()}
        {renderTimeFilter()}
        {renderSubjectFilter()}

        <View style={styles.examsList}>
          {filteredExams.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No exams found for the selected filters
              </Text>
            </View>
          ) : (
            filteredExams.map(renderExamCard)
          )}
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
  filterIcon: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
    paddingVertical: 4,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  examsList: {
    padding: 20,
  },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  examName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  examSubject: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563EB',
    marginBottom: 4,
  },
  examTopic: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  examDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  examFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  courseText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});
