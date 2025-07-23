import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Clock,
  BookOpen,
  FileText,
  User,
  Bell,
  TrendingUp,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { supabase } from '../../lib/supabase';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

interface LectureBatch {
  id: string;
  lecture_id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  end_time: string | null;
  lecture: {
    id: string;
    subject: string;
    topic: string;
    chapter: string;
    course: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface ExamBatch {
  id: string;
  exam_id: string;
  scheduled_start: string;
  scheduled_end: string | null;
  status: string;
  notes: string | null;
  exam: {
    id: string;
    name: string;
    subject: string;
    topic: string;
    chapter: string;
    total_marks: number;
    course: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface TodayStats {
  lecturesCount: number;
  examsCount: number;
  completedLectures: number;
  completedExams: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();

  // Debug logging for unread count
  useEffect(() => {
    console.log(
      `📱 Student Dashboard: Unread count is ${unreadCount} for user ${user?.id}`
    );
  }, [unreadCount, user?.id]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState<TodayStats>({
    lecturesCount: 0,
    examsCount: 0,
    completedLectures: 0,
    completedExams: 0,
  });
  const [upcomingLectures, setUpcomingLectures] = useState<LectureBatch[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<ExamBatch[]>([]);

  const fetchTodayStats = useCallback(async () => {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toISOString();
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    ).toISOString();

    try {
      if (!user?.id) {
        console.error('User ID not available');
        return;
      }

      // Get today's lecture batches with lecture_id to count unique lectures
      const { data: lectureBatches, error: lectureError } = await supabase
        .from('lecture_batches')
        .select('id, status, scheduled_at, lecture_id')
        .gte('scheduled_at', todayStart)
        .lt('scheduled_at', todayEnd);

      if (lectureError) throw lectureError;

      // Count unique lectures (not batches) - include completed ones only if completed today
      const uniqueLectureIds = new Set(
        lectureBatches?.map((batch) => batch.lecture_id) || []
      );

      // Get student's attendance records for ANY batch of these lectures
      const { data: allLectureAttendances, error: allLectureAttendanceError } =
        await supabase
          .from('attendances')
          .select(
            'batch_id, status, recorded_at, lecture_batches!inner(lecture_id)'
          )
          .eq('student_id', user.id)
          .in('status', ['present', 'late', 'excused']) // Count any attendance as completed
          .in('lecture_batches.lecture_id', Array.from(uniqueLectureIds));

      if (allLectureAttendanceError) throw allLectureAttendanceError;

      // Get lecture IDs that student has attended, but only if attended today
      const todayAttendedLectureIds = new Set();
      const allAttendedLectureIds = new Set();

      allLectureAttendances?.forEach((att) => {
        const lectureId = (att as any).lecture_batches.lecture_id;
        const attendanceDate = new Date(att.recorded_at);

        allAttendedLectureIds.add(lectureId);

        // Check if attendance was recorded today
        if (
          attendanceDate >= new Date(todayStart) &&
          attendanceDate < new Date(todayEnd)
        ) {
          todayAttendedLectureIds.add(lectureId);
        }
      });

      // Only count lectures that haven't been attended yet OR were completed today
      const relevantLectureIds = new Set(
        Array.from(uniqueLectureIds).filter(
          (lectureId) =>
            !allAttendedLectureIds.has(lectureId) || // Not attended yet
            todayAttendedLectureIds.has(lectureId) // Or attended today
        )
      );
      const uniqueLecturesCount = relevantLectureIds.size;

      // Get today's exam batches with exam_id to count unique exams
      const { data: examBatches, error: examError } = await supabase
        .from('exam_batches')
        .select('id, status, scheduled_start, exam_id')
        .gte('scheduled_start', todayStart)
        .lt('scheduled_start', todayEnd);

      if (examError) throw examError;

      // Count unique exams (not batches) - include completed ones only if completed today
      const uniqueExamIds = new Set(
        examBatches?.map((batch) => batch.exam_id) || []
      );

      // Get student's attendance records for ANY batch of these exams
      const { data: allExamAttendances, error: allExamAttendanceError } =
        await supabase
          .from('exam_attendances')
          .select('batch_id, status, recorded_at, exam_batches!inner(exam_id)')
          .eq('student_id', user.id)
          .in('status', ['present', 'late', 'excused']) // Count any attendance as completed
          .in('exam_batches.exam_id', Array.from(uniqueExamIds));

      if (allExamAttendanceError) throw allExamAttendanceError;

      // Get exam IDs that student has attended, but only if attended today
      const todayAttendedExamIds = new Set();
      const allAttendedExamIds = new Set();

      allExamAttendances?.forEach((att) => {
        const examId = (att as any).exam_batches.exam_id;
        const attendanceDate = new Date(att.recorded_at);

        allAttendedExamIds.add(examId);

        // Check if attendance was recorded today
        if (
          attendanceDate >= new Date(todayStart) &&
          attendanceDate < new Date(todayEnd)
        ) {
          todayAttendedExamIds.add(examId);
        }
      });

      // Only count exams that haven't been attended yet OR were completed today
      const relevantExamIds = new Set(
        Array.from(uniqueExamIds).filter(
          (examId) =>
            !allAttendedExamIds.has(examId) || // Not attended yet
            todayAttendedExamIds.has(examId) // Or attended today
        )
      );
      const uniqueExamsCount = relevantExamIds.size;

      // Get student's attendance records for today's lecture batches
      let completedLectures = 0;
      if (lectureBatches && lectureBatches.length > 0) {
        // Count lectures that were attended today specifically (including those completed today from any batch)
        const todayLectureBatchIds = lectureBatches.map((batch) => batch.id);

        // Get today's batch attendances
        const {
          data: todayLectureAttendances,
          error: todayLectureAttendanceError,
        } = await supabase
          .from('attendances')
          .select('batch_id, status')
          .eq('student_id', user.id)
          .in('status', ['present', 'late', 'excused']) // Count any attendance as completed
          .in('batch_id', todayLectureBatchIds);

        if (todayLectureAttendanceError) throw todayLectureAttendanceError;

        // Count today's batch attendances
        const todayBatchAttendances = todayLectureAttendances?.length || 0;

        // Add lectures that were completed today (from attendance created_at)
        const todayCompletedFromPreviousBatches = Array.from(
          todayAttendedLectureIds
        ).filter((lectureId) =>
          Array.from(uniqueLectureIds).includes(lectureId)
        ).length;

        // Use the higher count (either today's batches or today's completions)
        completedLectures = Math.max(
          todayBatchAttendances,
          todayCompletedFromPreviousBatches
        );
      }

      // Get student's attendance records for today's exam batches
      let completedExams = 0;
      if (examBatches && examBatches.length > 0) {
        // Count exams that were attended today specifically (including those completed today from any batch)
        const todayExamBatchIds = examBatches.map((batch) => batch.id);

        // Get today's batch attendances
        const { data: todayExamAttendances, error: todayExamAttendanceError } =
          await supabase
            .from('exam_attendances')
            .select('batch_id, status')
            .eq('student_id', user.id)
            .in('status', ['present', 'late', 'excused']) // Count any attendance as completed
            .in('batch_id', todayExamBatchIds);

        if (todayExamAttendanceError) throw todayExamAttendanceError;

        // Count today's batch attendances
        const todayBatchAttendances = todayExamAttendances?.length || 0;

        // Add exams that were completed today (from attendance created_at)
        const todayCompletedFromPreviousBatches = Array.from(
          todayAttendedExamIds
        ).filter((examId) => Array.from(uniqueExamIds).includes(examId)).length;

        // Use the higher count (either today's batches or today's completions)
        completedExams = Math.max(
          todayBatchAttendances,
          todayCompletedFromPreviousBatches
        );
      }

      console.log('Today Stats:', {
        lecturesCount: uniqueLecturesCount,
        examsCount: uniqueExamsCount,
        completedLectures,
        completedExams,
      });

      setTodayStats({
        lecturesCount: uniqueLecturesCount,
        examsCount: uniqueExamsCount,
        completedLectures,
        completedExams,
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  }, [user]);

  const fetchUpcomingLectures = useCallback(async () => {
    try {
      if (!user?.id) {
        console.error('User ID not available');
        return;
      }

      const now = new Date().toISOString();
      const nextWeek = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      // First, get all upcoming lecture batches
      const { data: allBatches, error: batchError } = await supabase
        .from('lecture_batches')
        .select(
          `
          id,
          lecture_id,
          scheduled_at,
          status,
          notes,
          end_time,
          lecture:lectures(
            id,
            subject,
            topic,
            chapter,
            course:courses(
              id,
              name,
              code
            )
          )
        `
        )
        .gte('scheduled_at', now)
        .lte('scheduled_at', nextWeek)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

      if (batchError) throw batchError;

      if (!allBatches || allBatches.length === 0) {
        setUpcomingLectures([]);
        return;
      }

      // Get student's attendance records for ALL lectures (not just upcoming ones)
      const { data: attendances, error: attendanceError } = await supabase
        .from('attendances')
        .select(
          `
          batch_id,
          status,
          lecture_batches!inner(lecture_id)
        `
        )
        .eq('student_id', user.id)
        .in('status', ['present', 'late']); // Only count present/late as attended

      if (attendanceError) throw attendanceError;

      // Extract lecture IDs that the student has already attended
      const attendedLectureIds = new Set(
        attendances?.map((att) => (att as any).lecture_batches.lecture_id) || []
      );

      console.log('Attended lecture IDs:', Array.from(attendedLectureIds));

      // Filter out lectures that the student has already attended
      const filteredBatches = allBatches.filter(
        (batch) => !attendedLectureIds.has(batch.lecture_id)
      );

      console.log(
        'Filtered batches count:',
        filteredBatches.length,
        'from',
        allBatches.length
      );

      // Group by lecture_id and take only the earliest batch for each lecture
      const lectureMap = new Map();
      filteredBatches.forEach((batch) => {
        if (
          !lectureMap.has(batch.lecture_id) ||
          new Date(batch.scheduled_at) <
            new Date(lectureMap.get(batch.lecture_id).scheduled_at)
        ) {
          lectureMap.set(batch.lecture_id, batch);
        }
      });

      // Convert back to array and limit to 5
      const uniqueLectures = Array.from(lectureMap.values())
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime()
        )
        .slice(0, 5);

      setUpcomingLectures((uniqueLectures as unknown as LectureBatch[]) || []);
    } catch (error) {
      console.error('Error fetching upcoming lectures:', error);
    }
  }, [user]);

  const fetchUpcomingExams = useCallback(async () => {
    try {
      if (!user?.id) {
        console.error('User ID not available');
        return;
      }

      const now = new Date().toISOString();
      const nextWeek = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      // First, get all upcoming exam batches
      const { data: allBatches, error: batchError } = await supabase
        .from('exam_batches')
        .select(
          `
          id,
          exam_id,
          scheduled_start,
          scheduled_end,
          status,
          notes,
          exam:exams(
            id,
            name,
            subject,
            topic,
            chapter,
            total_marks,
            course:courses(
              id,
              name,
              code
            )
          )
        `
        )
        .gte('scheduled_start', now)
        .lte('scheduled_start', nextWeek)
        .eq('status', 'scheduled')
        .order('scheduled_start', { ascending: true });

      if (batchError) throw batchError;

      if (!allBatches || allBatches.length === 0) {
        setUpcomingExams([]);
        return;
      }

      // Get student's attendance records for ALL exams (not just upcoming ones)
      const { data: attendances, error: attendanceError } = await supabase
        .from('exam_attendances')
        .select(
          `
          batch_id,
          status,
          exam_batches!inner(exam_id)
        `
        )
        .eq('student_id', user.id)
        .in('status', ['present', 'late']); // Only count present/late as attended

      if (attendanceError) throw attendanceError;

      // Extract exam IDs that the student has already attended
      const attendedExamIds = new Set(
        attendances?.map((att) => (att as any).exam_batches.exam_id) || []
      );

      console.log('Attended exam IDs:', Array.from(attendedExamIds));

      // Filter out exams that the student has already attended
      const filteredBatches = allBatches.filter(
        (batch) => !attendedExamIds.has(batch.exam_id)
      );

      console.log(
        'Filtered exam batches count:',
        filteredBatches.length,
        'from',
        allBatches.length
      );

      // Group by exam_id and take only the earliest batch for each exam
      const examMap = new Map();
      filteredBatches.forEach((batch) => {
        if (
          !examMap.has(batch.exam_id) ||
          new Date(batch.scheduled_start) <
            new Date(examMap.get(batch.exam_id).scheduled_start)
        ) {
          examMap.set(batch.exam_id, batch);
        }
      });

      // Convert back to array and limit to 5
      const uniqueExams = Array.from(examMap.values())
        .sort(
          (a, b) =>
            new Date(a.scheduled_start).getTime() -
            new Date(b.scheduled_start).getTime()
        )
        .slice(0, 5);

      setUpcomingExams((uniqueExams as unknown as ExamBatch[]) || []);
    } catch (error) {
      console.error('Error fetching upcoming exams:', error);
    }
  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTodayStats(),
        fetchUpcomingLectures(),
        fetchUpcomingExams(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchTodayStats, fetchUpcomingLectures, fetchUpcomingExams]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleLecturePress = (lectureId: string) => {
    router.push(`/lectures/${lectureId}`);
  };

  const handleExamPress = (examId: string) => {
    router.push(`/exams/${examId}`);
  };

  const handleViewAllLectures = () => {
    router.push('/lectures');
  };

  const handleViewAllExams = () => {
    router.push('/exams');
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleNotificationsPress = () => {
    router.push('/notifications');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome Back!</Text>
          <Text style={styles.headerSubtitle}>
            {user?.full_name || 'Student'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNotificationsPress}
          >
            <View style={styles.notificationIconContainer}>
              <Bell size={24} color="#64748B" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleProfilePress}
          >
            <User size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            progressBackgroundColor="#F8FAFC"
          />
        }
      >
        {/* Today's Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Progress</Text>
          <LinearGradient
            colors={['#2563EB', '#3B82F6']}
            style={styles.progressCard}
          >
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <BookOpen size={20} color="#ffffff" />
                <Text style={styles.progressNumber}>
                  {todayStats.completedLectures}/{todayStats.lecturesCount}
                </Text>
                <Text style={styles.progressLabel}>Lectures</Text>
              </View>
              <View style={styles.progressItem}>
                <FileText size={20} color="#ffffff" />
                <Text style={styles.progressNumber}>
                  {todayStats.completedExams}/{todayStats.examsCount}
                </Text>
                <Text style={styles.progressLabel}>Exams</Text>
              </View>
              <View style={styles.progressItem}>
                <TrendingUp size={20} color="#ffffff" />
                <Text style={styles.progressNumber}>
                  {todayStats.lecturesCount + todayStats.examsCount > 0
                    ? Math.round(
                        ((todayStats.completedLectures +
                          todayStats.completedExams) /
                          (todayStats.lecturesCount + todayStats.examsCount)) *
                          100
                      )
                    : 0}
                  %
                </Text>
                <Text style={styles.progressLabel}>Completion</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Upcoming Lectures */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Lectures</Text>
            <TouchableOpacity onPress={handleViewAllLectures}>
              <ChevronRight size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
          {upcomingLectures.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={48} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>No upcoming lectures</Text>
            </View>
          ) : (
            upcomingLectures.map((lectureBatch) => (
              <TouchableOpacity
                key={lectureBatch.id}
                style={styles.eventCard}
                onPress={() => handleLecturePress(lectureBatch.lecture_id)}
              >
                <View style={styles.eventHeader}>
                  <View
                    style={[styles.eventIcon, { backgroundColor: '#EBF4FF' }]}
                  >
                    <BookOpen size={20} color="#2563EB" />
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>
                      {lectureBatch.lecture.subject}
                    </Text>
                    <Text style={styles.eventSubtitle}>
                      {lectureBatch.lecture.topic}
                    </Text>
                    <Text style={styles.eventCourse}>
                      {lectureBatch.lecture.course.name}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#64748B" />
                </View>
                <View style={styles.eventTime}>
                  <Clock size={16} color="#64748B" />
                  <Text style={styles.eventTimeText}>
                    {formatDate(lectureBatch.scheduled_at)} at{' '}
                    {formatTime(lectureBatch.scheduled_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming Exams */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Exams</Text>
            <TouchableOpacity onPress={handleViewAllExams}>
              <ChevronRight size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
          {upcomingExams.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>No upcoming exams</Text>
            </View>
          ) : (
            upcomingExams.map((examBatch) => (
              <TouchableOpacity
                key={examBatch.id}
                style={styles.eventCard}
                onPress={() => handleExamPress(examBatch.exam_id)}
              >
                <View style={styles.eventHeader}>
                  <View
                    style={[styles.eventIcon, { backgroundColor: '#FEF2F2' }]}
                  >
                    <FileText size={20} color="#EF4444" />
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{examBatch.exam.name}</Text>
                    <Text style={styles.eventSubtitle}>
                      {examBatch.exam.subject} - {examBatch.exam.topic}
                    </Text>
                    <Text style={styles.eventCourse}>
                      {examBatch.exam.course.name} •{' '}
                      {examBatch.exam.total_marks} marks
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#64748B" />
                </View>
                <View style={styles.eventTime}>
                  <Clock size={16} color="#64748B" />
                  <Text style={styles.eventTimeText}>
                    {formatDate(examBatch.scheduled_start)} at{' '}
                    {formatTime(examBatch.scheduled_start)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
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
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  progressCard: {
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
    gap: 8,
  },
  progressNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  eventCourse: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  eventTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
