import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { lecturesManagementService } from '../../services/lectures-management';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar,
  Clock,
  Users,
  Filter,
  ChevronRight,
  Search,
  BookOpen,
} from 'lucide-react-native';

export default function LecturesScreen() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<
    'all' | 'today' | 'tomorrow' | 'this_week'
  >('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const { user } = useAuth();
  const router = useRouter();

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
        setSubjects([]);
        return;
      }

      // Get lectures for enrolled courses
      const data = await lecturesManagementService.getAllLectures();
      const enrolledLectures = data.filter((lecture) =>
        enrolledCourseIds.includes(lecture.course_id)
      );

      // Format lectures similar to exams
      const formattedLectures = await Promise.all(
        enrolledLectures.map(async (lecture: any) => {
          try {
            const batches = await lecturesManagementService.getLectureBatches(
              lecture.id
            );
            const firstBatch = batches[0];

            // Calculate duration from first batch times
            let duration = 'N/A';
            if (firstBatch?.scheduled_at && firstBatch?.end_time) {
              const startTime = new Date(firstBatch.scheduled_at);
              const endTime = new Date(firstBatch.end_time);
              const durationMinutes =
                (endTime.getTime() - startTime.getTime()) / (1000 * 60);
              const hours = Math.floor(durationMinutes / 60);
              const minutes = durationMinutes % 60;
              duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            }

            // Format date and time from first batch
            let lectureDate = 'TBD';
            let lectureTime = 'TBD';
            if (firstBatch?.scheduled_at) {
              const startDateTime = new Date(firstBatch.scheduled_at);

              // Format date in a more readable way
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);

              if (startDateTime.toDateString() === today.toDateString()) {
                lectureDate = 'Today';
              } else if (
                startDateTime.toDateString() === tomorrow.toDateString()
              ) {
                lectureDate = 'Tomorrow';
              } else if (
                startDateTime.toDateString() === yesterday.toDateString()
              ) {
                lectureDate = 'Yesterday';
              } else {
                lectureDate = startDateTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
              }

              // Format time with AM/PM for better readability
              lectureTime = startDateTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              if (firstBatch.end_time) {
                const endDateTime = new Date(firstBatch.end_time);
                lectureTime += ` - ${endDateTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}`;
              }
            }

            // Determine lecture status
            let status = 'scheduled';
            const now = new Date();

            if (firstBatch?.scheduled_at) {
              const startTime = new Date(firstBatch.scheduled_at);

              // First check the batch status from database
              if (firstBatch.status === 'completed') {
                status = 'completed';
              } else if (firstBatch.status === 'cancelled') {
                status = 'cancelled';
              } else if (firstBatch.status === 'postponed') {
                status = 'postponed';
              } else {
                // If batch is scheduled, determine status based on time
                if (firstBatch.end_time) {
                  const endTime = new Date(firstBatch.end_time);

                  if (now > endTime) {
                    status = 'completed';
                  } else if (now >= startTime && now <= endTime) {
                    status = 'ongoing';
                  } else if (now < startTime) {
                    status = 'upcoming';
                  }
                } else {
                  // If no end time, only mark as upcoming if before start time
                  if (now < startTime) {
                    status = 'upcoming';
                  } else {
                    // If no end time and past start time, keep it as scheduled
                    status = 'scheduled';
                  }
                }
              }
            }

            return {
              ...lecture,
              batches,
              duration,
              nextBatch: firstBatch,
              status,
              lectureType: lecture.subject || 'General',
              date: lectureDate,
              time: lectureTime,
              attendees: firstBatch?.attendance_count || 0,
            };
          } catch (err) {
            console.error(
              `Error loading batches for lecture ${lecture.id}:`,
              err
            );
            return {
              ...lecture,
              batches: [],
              duration: 'N/A',
              nextBatch: null,
              status: 'scheduled',
              lectureType: lecture.subject || 'General',
              date: lecture.created_at,
              time: 'N/A',
              attendees: 0,
            };
          }
        })
      );

      setLectures(formattedLectures);

      // Extract unique subjects
      const uniqueSubjects = Array.from(
        new Set(
          formattedLectures.map((lecture) => lecture.subject).filter(Boolean)
        )
      );
      setSubjects(['All', ...uniqueSubjects]);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLectures();
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
      case 'cancelled':
        return '#EF4444';
      case 'postponed':
        return '#F59E0B';
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
      case 'cancelled':
        return 'Cancelled';
      case 'postponed':
        return 'Postponed';
      default:
        return 'Scheduled';
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const lectureDate = new Date(dateString);
    return lectureDate.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const lectureDate = new Date(dateString);
    return lectureDate.toDateString() === tomorrow.toDateString();
  };

  const isThisWeek = (dateString: string) => {
    const today = new Date();
    const lectureDate = new Date(dateString);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return lectureDate >= startOfWeek && lectureDate <= endOfWeek;
  };

  const getFilteredLectures = () => {
    let filtered = lectures;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lecture) =>
          lecture.topic?.toLowerCase().includes(query) ||
          lecture.subject?.toLowerCase().includes(query) ||
          lecture.chapter?.toLowerCase().includes(query) ||
          lecture.course?.name?.toLowerCase().includes(query)
      );
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      filtered = filtered.filter((lecture) => {
        const lectureDate = lecture.nextBatch?.scheduled_at || lecture.date;
        switch (timeFilter) {
          case 'today':
            return isToday(lectureDate);
          case 'tomorrow':
            return isTomorrow(lectureDate);
          case 'this_week':
            return isThisWeek(lectureDate);
          default:
            return true;
        }
      });
    }

    // Apply subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(
        (lecture) => lecture.subject === subjectFilter
      );
    }

    return filtered;
  };

  const handleLecturePress = (lecture: any) => {
    router.push(`/lectures/${lecture.id}`);
  };

  const renderSearchBar = () => {
    return (
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lectures by topic, subject, or chapter..."
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

  const renderLectureCard = (lecture: any) => {
    return (
      <TouchableOpacity
        key={lecture.id}
        style={styles.lectureCard}
        onPress={() => handleLecturePress(lecture)}
      >
        <View style={styles.lectureHeader}>
          <Text style={styles.lectureName}>
            {lecture.topic || lecture.subject}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(lecture.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(lecture.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.lectureSubject}>{lecture.subject}</Text>
        {lecture.chapter && (
          <Text style={styles.lectureChapter}>Chapter: {lecture.chapter}</Text>
        )}

        <View style={styles.lectureDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#64748B" />
            <Text style={styles.detailText}>{lecture.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color="#64748B" />
            <Text style={styles.detailText}>{lecture.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Users size={16} color="#64748B" />
            <Text style={styles.detailText}>{lecture.attendees} attendees</Text>
          </View>
          <View style={styles.detailRow}>
            <BookOpen size={16} color="#64748B" />
            <Text style={styles.detailText}>{lecture.duration}</Text>
          </View>
        </View>

        <View style={styles.lectureFooter}>
          <Text style={styles.courseText}>
            {lecture.course?.name || 'General'}
          </Text>
          <ChevronRight size={20} color="#64748B" />
        </View>
      </TouchableOpacity>
    );
  };

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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLectures}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredLectures = getFilteredLectures();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lectures</Text>
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

        <View style={styles.lecturesList}>
          {filteredLectures.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No lectures found for the selected filters
              </Text>
            </View>
          ) : (
            filteredLectures.map(renderLectureCard)
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
  lecturesList: {
    padding: 20,
  },
  lectureCard: {
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
  lectureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lectureName: {
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
  lectureSubject: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563EB',
    marginBottom: 4,
  },
  lectureChapter: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  lectureDetails: {
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
  lectureFooter: {
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
