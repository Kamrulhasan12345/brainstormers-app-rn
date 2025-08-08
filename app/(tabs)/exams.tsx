import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { examManagementService } from '../../services/exam-management';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/Pagination';
import { CardSkeleton, SkeletonList } from '../../components/SkeletonLoader';
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
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadExams();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateOverallAttendanceStatus = (exam: any, userId: string) => {
    if (!exam.batches || exam.batches.length === 0) {
      return null; // No batches, no attendance status
    }

    // Check if any batch has been completed (past its end time or marked as completed)
    const now = new Date();
    const hasCompletedBatch = exam.batches.some((batch: any) => {
      if (batch.status === 'completed') return true;
      if (batch.status === 'cancelled' || batch.status === 'postponed')
        return false;

      // Check if batch is past its end time
      if (batch.scheduled_end) {
        const endTime = new Date(batch.scheduled_end);
        return now > endTime;
      }
      return false;
    });

    // Only show attendance status if at least one batch is completed
    if (!hasCompletedBatch) {
      return null;
    }

    // Check if student attended any batch
    let hasAnyAttendance = false;
    let bestAttendanceStatus = 'absent';

    for (const batch of exam.batches) {
      if (batch.attendances) {
        const userAttendance = batch.attendances.find(
          (att: any) => att.student_id === userId
        );
        if (userAttendance) {
          hasAnyAttendance = true;
          // Priority: present > late > excused > absent
          if (userAttendance.status === 'present') {
            bestAttendanceStatus = 'present';
            break; // Present is the best, no need to check further
          } else if (
            userAttendance.status === 'late' &&
            bestAttendanceStatus !== 'present'
          ) {
            bestAttendanceStatus = 'late';
          } else if (
            userAttendance.status === 'excused' &&
            !['present', 'late'].includes(bestAttendanceStatus)
          ) {
            bestAttendanceStatus = 'excused';
          } else if (userAttendance.status === 'absent') {
            // Keep absent as the status if no better status is found
            bestAttendanceStatus = 'absent';
          }
        }
      }
    }

    // Return the best status found, or 'absent' if no attendance records but exam is completed
    return hasAnyAttendance ? bestAttendanceStatus : 'absent';
  };

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

            // Get attendance data for each batch
            const batchesWithAttendance = await Promise.all(
              batches.map(async (batch: any) => {
                try {
                  const attendances =
                    await examManagementService.getExamAttendances(batch.id);
                  return {
                    ...batch,
                    attendances: attendances || [],
                  };
                } catch (err) {
                  console.error(
                    `Error loading attendance for batch ${batch.id}:`,
                    err
                  );
                  return {
                    ...batch,
                    attendances: [],
                  };
                }
              })
            );

            const firstBatch = batchesWithAttendance[0];

            // Calculate overall attendance status for this user
            const overallAttendanceStatus = user?.id
              ? calculateOverallAttendanceStatus(
                  {
                    ...exam,
                    batches: batchesWithAttendance,
                  },
                  user.id
                )
              : null;

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

              // Format date in a more readable way
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);

              if (startDateTime.toDateString() === today.toDateString()) {
                examDate = 'Today';
              } else if (
                startDateTime.toDateString() === tomorrow.toDateString()
              ) {
                examDate = 'Tomorrow';
              } else if (
                startDateTime.toDateString() === yesterday.toDateString()
              ) {
                examDate = 'Yesterday';
              } else {
                examDate = startDateTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
              }

              // Format time with AM/PM for better readability
              examTime = startDateTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              if (firstBatch.scheduled_end) {
                const endDateTime = new Date(firstBatch.scheduled_end);
                examTime += ` - ${endDateTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}`;
              }
            }

            // Determine exam status
            let status = 'scheduled';
            const now = new Date();

            if (firstBatch?.scheduled_start) {
              const startTime = new Date(firstBatch.scheduled_start);

              // First check the batch status from database
              if (firstBatch.status === 'completed') {
                status = 'completed';
              } else if (firstBatch.status === 'cancelled') {
                status = 'cancelled';
              } else if (firstBatch.status === 'postponed') {
                status = 'postponed';
              } else {
                // If batch is scheduled, determine status based on time
                if (firstBatch.scheduled_end) {
                  const endTime = new Date(firstBatch.scheduled_end);

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
              ...exam,
              batches: batchesWithAttendance,
              duration,
              nextBatch: firstBatch,
              status,
              testType: exam.subject || 'General',
              date: examDate,
              time: examTime,
              totalMarks: exam.total_marks,
              overallAttendanceStatus,
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
              overallAttendanceStatus: null,
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

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#059669';
      case 'late':
        return '#EA580C';
      case 'absent':
        return '#EF4444';
      case 'excused':
        return '#6366F1';
      default:
        return '#64748B';
    }
  };

  const getAttendanceStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'late':
        return 'Late';
      case 'absent':
        return 'Absent';
      case 'excused':
        return 'Excused';
      default:
        return 'Unknown';
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

  const getFilteredExams = useCallback(() => {
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

    // Apply attendance filter
    if (attendanceFilter !== 'all') {
      filtered = filtered.filter((exam) => {
        if (attendanceFilter === 'none') {
          return !exam.overallAttendanceStatus;
        }
        return exam.overallAttendanceStatus === attendanceFilter;
      });
    }

    return filtered;
  }, [exams, searchQuery, timeFilter, subjectFilter, attendanceFilter]);

  const handleExamPress = (exam: any) => {
    router.push(`/exams/${exam.id}`);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Temporary fix function - you can call this to update the exam batch dates
  const fixExamDate = async (
    examId: string,
    newDate: string,
    startTime: string,
    endTime: string
  ) => {
    try {
      // Find the exam and its batch
      const exam = exams.find((e) => e.id === examId);
      if (!exam || !exam.nextBatch) {
        console.error('Exam or batch not found');
        return;
      }

      const batchId = exam.nextBatch.id;

      // Create new datetime strings
      const startDateTime = `${newDate}T${startTime}:00.000Z`;
      const endDateTime = `${newDate}T${endTime}:00.000Z`;

      console.log(
        `Updating batch ${batchId} to: ${startDateTime} - ${endDateTime}`
      );

      await examManagementService.updateExamBatch(batchId, {
        scheduled_start: startDateTime,
        scheduled_end: endDateTime,
      });

      console.log('Batch updated successfully');

      // Refresh the exams list
      await loadExams();
    } catch (error) {
      console.error('Error updating exam batch:', error);
    }
  };

  // Example usage (you can call this from the console or add a button):
  // fixExamDate('947469f2-f925-4f4b-9eed-a95384c7d4f1', '2025-07-18', '14:00', '17:00');
  // This would set the exam to July 18th, 2025 from 2:00 PM to 5:00 PM UTC

  // Make the function available globally for debugging
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    (global as any).fixExamDate = fixExamDate;
  }

  // Memoized filtered exams
  const filteredExams = useMemo(() => getFilteredExams(), [getFilteredExams]);

  // Pagination for filtered exams
  const pagination = usePagination(filteredExams, { itemsPerPage: 6 });

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

  const renderAttendanceFilter = () => {
    const attendanceOptions = [
      { value: 'all', label: 'All' },
      { value: 'present', label: 'Present' },
      { value: 'late', label: 'Late' },
      { value: 'absent', label: 'Absent' },
      { value: 'excused', label: 'Excused' },
      { value: 'none', label: 'No Status' },
    ];

    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Attendance Filter:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {attendanceOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                attendanceFilter === option.value && styles.filterButtonActive,
              ]}
              onPress={() => setAttendanceFilter(option.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  attendanceFilter === option.value &&
                    styles.filterButtonTextActive,
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

  const renderExamCard = (exam: any) => {
    return (
      <TouchableOpacity
        key={exam.id}
        style={styles.examCard}
        onPress={() => handleExamPress(exam)}
      >
        <View style={styles.examHeader}>
          <Text style={styles.examName}>{exam.name}</Text>
          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(exam.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusText(exam.status)}
              </Text>
            </View>
            {exam.overallAttendanceStatus && (
              <View
                style={[
                  styles.attendanceBadge,
                  {
                    backgroundColor: getAttendanceStatusColor(
                      exam.overallAttendanceStatus
                    ),
                  },
                ]}
              >
                <Text style={styles.attendanceText}>
                  {getAttendanceStatusText(exam.overallAttendanceStatus)}
                </Text>
              </View>
            )}
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
          <Text style={styles.courseText}>
            {exam.course?.name || 'General'}
          </Text>
          <ChevronRight size={20} color="#64748B" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exams</Text>
          <TouchableOpacity style={styles.filterIcon} onPress={toggleFilters}>
            <Filter size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.searchContainer}>
            <Search size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exams..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#64748B"
            />
          </View>

          <SkeletonList
            count={6}
            renderItem={() => <CardSkeleton />}
            style={styles.examsList}
          />
        </ScrollView>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exams</Text>
        <TouchableOpacity
          style={[styles.filterIcon, showFilters && styles.filterIconActive]}
          onPress={toggleFilters}
        >
          <Filter size={24} color={showFilters ? '#FFFFFF' : '#2563EB'} />
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
        {showFilters && (
          <>
            {renderTimeFilter()}
            {renderSubjectFilter()}
            {renderAttendanceFilter()}
          </>
        )}

        <View style={styles.examsList}>
          {filteredExams.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No exams found for the selected filters
              </Text>
            </View>
          ) : (
            <>
              {pagination.paginatedData.map(renderExamCard)}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  hasNextPage={pagination.hasNextPage}
                  hasPreviousPage={pagination.hasPreviousPage}
                  pageNumbers={pagination.pageNumbers}
                  onNextPage={pagination.nextPage}
                  onPreviousPage={pagination.previousPage}
                  onGoToPage={pagination.goToPage}
                  totalItems={filteredExams.length}
                  itemsPerPage={6}
                  isFooter={true}
                />
              )}
            </>
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
  filterIconActive: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
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
  badgeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
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
  attendanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendanceText: {
    fontSize: 10,
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
