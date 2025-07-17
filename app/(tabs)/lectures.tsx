import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Clock, FileText, Users } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { lecturesManagementService } from '@/services/lectures-management';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const filterOptions = [
  'All',
  'Today',
  'Tomorrow',
  'This Week',
  'Upcoming',
  'Ongoing',
  'Completed',
  'Postponed',
];

export default function LecturesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [lectures, setLectures] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Calculate the actual status of a batch based on its scheduled time
  const calculateBatchStatus = (
    batch: any
  ):
    | 'upcoming'
    | 'ongoing'
    | 'completed'
    | 'postponed'
    | 'cancelled'
    | 'not_held' => {
    if (!batch) return 'upcoming';

    const now = new Date();
    const scheduledTime = new Date(batch.scheduled_at);

    // If manually set to completed, postponed, cancelled, or not_held, respect that
    if (
      batch.status === 'completed' ||
      batch.status === 'postponed' ||
      batch.status === 'cancelled' ||
      batch.status === 'not_held'
    ) {
      return batch.status;
    }

    // Calculate time difference
    const timeDiff = now.getTime() - scheduledTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // If the lecture hasn't started yet (more than 15 minutes before)
    if (hoursDiff < -0.25) {
      return 'upcoming';
    }

    // If the lecture has started but not been marked as complete (within 4 hours of start time)
    if (hoursDiff >= -0.25 && hoursDiff < 4) {
      return 'ongoing';
    }

    // If it's been more than 4 hours and not marked complete, consider it not held
    return 'not_held';
  };

  const loadLectures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Get enrolled courses first
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select(
          `
          course:courses(
            id,
            name,
            code
          )
        `
        )
        .eq('student_id', user.id)
        .eq('status', 'active');

      if (enrollError) {
        throw new Error(`Failed to fetch enrollments: ${enrollError.message}`);
      }

      const enrolledCourseIds =
        enrollments?.map((e: any) => e.course?.id).filter(Boolean) || [];
      if (enrolledCourseIds.length === 0) {
        setLectures([]);
        setAvailableSubjects([]);
        return;
      }

      // Get lectures for enrolled courses
      const data = await lecturesManagementService.getAllLectures();
      const enrolledLectures = data.filter((lecture) =>
        enrolledCourseIds.includes(lecture.course_id)
      );

      // Transform the data to match the expected format
      const formattedLectures = await Promise.all(
        enrolledLectures.map(async (lecture: any) => {
          // Get batches for this lecture
          const batches = await lecturesManagementService.getLectureBatches(
            lecture.id
          );

          // Find the next scheduled batch or most recent one
          const nextBatch =
            batches.find(
              (batch) =>
                batch.status === 'scheduled' || batch.status === 'completed'
            ) || batches[0];

          // Get attendance status for completed lectures
          let attendanceStatus = null;
          if (nextBatch && nextBatch.status === 'completed') {
            try {
              const attendanceRecords =
                await lecturesManagementService.getAttendanceForBatch(
                  nextBatch.id
                );
              const userAttendance = attendanceRecords.find(
                (att) => att.student_id === user.id
              );
              attendanceStatus = userAttendance?.status || 'absent';
            } catch (error) {
              console.warn('Failed to fetch attendance:', error);
              attendanceStatus = null;
            }
          }

          return {
            id: lecture.id,
            subject: lecture.subject,
            topic: lecture.topic || lecture.subject,
            date: nextBatch?.scheduled_at
              ? new Date(nextBatch.scheduled_at).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            time: nextBatch?.scheduled_at
              ? `${new Date(nextBatch.scheduled_at).toLocaleTimeString(
                  'en-US',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }
                )}${
                  nextBatch.end_time
                    ? ` - ${new Date(nextBatch.end_time).toLocaleTimeString(
                        'en-US',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        }
                      )}`
                    : ''
                }`
              : '',
            status: nextBatch ? calculateBatchStatus(nextBatch) : 'upcoming',
            attendees: nextBatch?.attendance_count || 0,
            description: lecture.chapter
              ? `Chapter: ${lecture.chapter}`
              : 'Lecture content',
            notesCount: batches.reduce(
              (sum, batch) => sum + (batch.lecture_notes?.length || 0),
              0
            ),
            batchId: nextBatch?.id,
            courseId: lecture.course_id,
            courseName: lecture.course?.name || 'Unknown Course',
            attendanceStatus, // Add attendance status
          };
        })
      );

      setLectures(formattedLectures);

      // Extract unique subjects for filtering
      const subjects = [
        ...new Set(formattedLectures.map((lecture) => lecture.subject)),
      ];
      setAvailableSubjects(subjects);
    } catch (err) {
      console.error('Error loading lectures:', err);
      setError('Failed to load lectures. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadLectures();
  }, [loadLectures]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLectures();
    setRefreshing(false);
  }, [loadLectures]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#2563EB';
      case 'ongoing':
        return '#F59E0B';
      case 'scheduled':
        return '#2563EB';
      case 'completed':
        return '#059669';
      case 'postponed':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      case 'not_held':
        return '#64748B';
      default:
        return '#64748B';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#EFF6FF';
      case 'ongoing':
        return '#FEF3C7';
      case 'scheduled':
        return '#EFF6FF';
      case 'completed':
        return '#ECFDF5';
      case 'postponed':
        return '#FEF3C7';
      case 'cancelled':
        return '#FEF2F2';
      case 'not_held':
        return '#F1F5F9';
      default:
        return '#F1F5F9';
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#059669';
      case 'late':
        return '#F59E0B';
      case 'absent':
        return '#EF4444';
      case 'excused':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const handleLecturePress = (lecture: any) => {
    // Navigate to the lecture details page with the lecture ID and batch ID
    router.push(`/(tabs)/lectures/${lecture.id}` as any);
  };

  const filteredLectures = lectures.filter((lecture) => {
    const matchesSearch =
      lecture.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === 'All' || lecture.subject === selectedSubject;

    // Date filtering
    const lectureDate = new Date(lecture.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    let matchesFilter = true;
    switch (selectedFilter) {
      case 'Today':
        lectureDate.setHours(0, 0, 0, 0);
        matchesFilter = lectureDate.getTime() === today.getTime();
        break;
      case 'Tomorrow':
        lectureDate.setHours(0, 0, 0, 0);
        matchesFilter = lectureDate.getTime() === tomorrow.getTime();
        break;
      case 'This Week':
        lectureDate.setHours(0, 0, 0, 0);
        matchesFilter = lectureDate >= today && lectureDate <= nextWeek;
        break;
      case 'Upcoming':
        matchesFilter = lecture.status === 'upcoming';
        break;
      case 'Ongoing':
        matchesFilter = lecture.status === 'ongoing';
        break;
      case 'Scheduled':
        matchesFilter = lecture.status === 'scheduled';
        break;
      case 'Completed':
        matchesFilter = lecture.status === 'completed';
        break;
      case 'Postponed':
        matchesFilter = lecture.status === 'postponed';
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesSubject && matchesFilter;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading lectures...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lecture Plan</Text>
        <Text style={styles.headerSubtitle}>HSC 2027 Batch</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLectures}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search lectures, topics, or subjects..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
          </View>
          <TouchableOpacity style={styles.filterButton} disabled={true}>
            <Filter size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <View style={styles.filterContainer}>
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Subject Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.subjectContainer}>
              <TouchableOpacity
                style={[
                  styles.subjectChip,
                  selectedSubject === 'All' && styles.subjectChipActive,
                ]}
                onPress={() => setSelectedSubject('All')}
              >
                <Text
                  style={[
                    styles.subjectText,
                    selectedSubject === 'All' && styles.subjectTextActive,
                  ]}
                >
                  All Subjects
                </Text>
              </TouchableOpacity>
              {availableSubjects.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.subjectChip,
                    selectedSubject === subject && styles.subjectChipActive,
                  ]}
                  onPress={() => setSelectedSubject(subject)}
                >
                  <Text
                    style={[
                      styles.subjectText,
                      selectedSubject === subject && styles.subjectTextActive,
                    ]}
                  >
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lecture Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lectures</Text>
          {filteredLectures.map((lecture) => (
            <TouchableOpacity
              key={lecture.id}
              style={styles.lectureCard}
              onPress={() => handleLecturePress(lecture)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{lecture.subject}</Text>
                </View>
                <View style={styles.cardActions}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBgColor(lecture.status) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(lecture.status) },
                      ]}
                    >
                      {lecture.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.lectureTopic}>{lecture.topic}</Text>
              <Text style={styles.lectureDescription}>
                {lecture.description}
              </Text>

              <View style={styles.lectureDetails}>
                {lecture.time && (
                  <View style={styles.detailItem}>
                    <Clock size={16} color="#64748B" />
                    <Text style={styles.detailText}>{lecture.time}</Text>
                  </View>
                )}
                {lecture.status === 'completed' && lecture.attendanceStatus && (
                  <View style={styles.detailItem}>
                    <View
                      style={[
                        styles.attendanceIndicator,
                        {
                          backgroundColor: getAttendanceColor(
                            lecture.attendanceStatus
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.attendanceText}>
                        {lecture.attendanceStatus.charAt(0).toUpperCase() +
                          lecture.attendanceStatus.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <FileText size={14} color="#64748B" />
                    <Text style={styles.statText}>
                      {lecture.notesCount} Notes
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Users size={14} color="#64748B" />
                    <Text style={styles.statText}>
                      {lecture.attendees} Students
                    </Text>
                  </View>
                </View>
                <Text style={styles.lectureDate}>
                  {new Date(lecture.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
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
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Regular',
  },
  filterButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterScroll: {
    paddingLeft: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  filterTextActive: {
    color: '#FFFFFF',
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
  subjectContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  subjectChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subjectChipActive: {
    backgroundColor: '#059669',
  },
  subjectText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Medium',
  },
  subjectTextActive: {
    color: '#FFFFFF',
  },
  lectureCard: {
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
    marginBottom: 12,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lectureTopic: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  lectureDescription: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  lectureDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
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
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  lectureDate: {
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  attendanceIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
});
