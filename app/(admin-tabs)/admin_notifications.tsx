import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  Send,
  Users,
  Search,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Target,
  BookOpen,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { studentService } from '@/services/students';
import { courseService } from '@/services/courses';
import { usePagination } from '@/hooks/usePagination';
import NotificationItem from '@/components/NotificationItem';
import { Pagination } from '@/components/Pagination';
import { SkeletonList, ListItemSkeleton } from '@/components/SkeletonLoader';

interface StudentProfile {
  id: string;
  roll: string;
  profile: {
    full_name: string | null;
  };
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Lecture {
  id: string;
  title: string; // This will be constructed from subject + chapter + topic
  subject: string;
  course: {
    name: string;
  };
}

interface Exam {
  id: string;
  name: string;
  course: {
    name: string;
  };
}

interface LectureBatch {
  id: string;
  title: string;
  scheduled_start: string;
  lecture: {
    title: string;
    subject: string;
  };
}

interface ExamBatch {
  id: string;
  scheduled_start: string;
  exam: {
    name: string;
  };
}

interface NotificationFormData {
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  link: string;
  expires_at: Date | null;
  targetType:
    | 'specific_student'
    | 'course_students'
    | 'lecture_absentees'
    | 'exam_absentees'
    | 'all_students';
  targetId: string;
  selectedLectureId: string;
  selectedExamId: string;
  category:
    | 'manual'
    | 'exam_reminder'
    | 'exam_absence_reminder'
    | 'exam_result_announcement'
    | 'lecture_reminder'
    | 'lecture_absence_alert';
}

interface SentNotification {
  id: string;
  title: string | null;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  recipient_count: number;
}

export default function AdminNotificationsScreen() {
  const router = useRouter();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  // Data state
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [lectureBatches, setLectureBatches] = useState<LectureBatch[]>([]);
  const [examBatches, setExamBatches] = useState<ExamBatch[]>([]);
  const [sentNotifications, setSentNotifications] = useState<
    SentNotification[]
  >([]);

  // Pagination for sent notifications
  const notificationsPagination = usePagination(sentNotifications, {
    itemsPerPage: 10,
  });

  // Form state
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    body: '',
    type: 'info',
    link: '',
    expires_at: null,
    targetType: 'all_students',
    targetId: '',
    selectedLectureId: '',
    selectedExamId: '',
    category: 'manual',
  });

  // UI state
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Only load essential data initially
      const [coursesData, sentNotificationsData] = await Promise.all([
        courseService.getAllCourses(),
        loadSentNotifications(),
      ]);

      setCourses(
        coursesData.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
        }))
      );

      setSentNotifications(sentNotificationsData);

      // Load initial lecture and exam lists
      await loadInitialData();
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Separate function to load students only when needed
  const loadStudentsIfNeeded = async () => {
    if (students.length === 0) {
      try {
        console.log('Loading students...');
        const studentsData = await studentService.getAllStudents();
        setStudents(
          studentsData.map((s) => ({
            id: s.id,
            roll: s.roll,
            profile: {
              full_name: s.profile?.full_name || null,
            },
          }))
        );
      } catch (error) {
        console.error('Error loading students:', error);
      }
    }
  };

  const loadSentNotifications = async (): Promise<SentNotification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, body, type, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Group by notification content to get recipient counts
    const grouped = data.reduce((acc, notification) => {
      const key = `${notification.title}-${notification.body}-${notification.created_at}`;
      if (!acc[key]) {
        acc[key] = {
          ...notification,
          recipient_count: 0,
        };
      }
      acc[key].recipient_count++;
      return acc;
    }, {} as Record<string, SentNotification>);

    return Object.values(grouped);
  };

  const loadInitialData = async () => {
    try {
      console.log('Loading initial data...');

      // First check if lectures table has any data
      const { count: lectureCount } = await supabase
        .from('lectures')
        .select('*', { count: 'exact', head: true });

      console.log('Total lectures in database:', lectureCount);

      // First try with relationship
      let { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select(
          `
          id,
          subject,
          chapter,
          topic,
          course_id,
          courses (
            id,
            name
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('Lectures query result:', { lecturesData, lecturesError });

      // If relationship fails, try without it
      if (lecturesError || !lecturesData || lecturesData.length === 0) {
        console.log('Trying lectures query without relationship...');
        const { data: simpleLecturesData, error: simpleLecturesError } =
          await supabase
            .from('lectures')
            .select('id, subject, chapter, topic, course_id')
            .order('created_at', { ascending: false })
            .limit(50);
        console.log('Simple lectures query result:', {
          simpleLecturesData,
          simpleLecturesError,
        });

        if (!simpleLecturesError && simpleLecturesData) {
          lecturesData = simpleLecturesData.map((lecture) => ({
            ...lecture,
            courses: [] as any,
          }));
          lecturesError = null;
        }
      }

      if (!lecturesError && lecturesData) {
        const processedLectures = lecturesData.map((lecture) => {
          const courseName = Array.isArray(lecture.courses)
            ? lecture.courses[0]?.name
            : (lecture.courses as any)?.name;

          // Create a display title from subject, chapter, and topic with proper truncation
          const titleParts = [lecture.subject];

          // Truncate chapter if too long (max 30 chars)
          if (lecture.chapter) {
            const chapter =
              lecture.chapter.length > 30
                ? lecture.chapter.substring(0, 30) + '...'
                : lecture.chapter;
            titleParts.push(chapter);
          }

          // Truncate topic if too long (max 25 chars)
          if (lecture.topic) {
            const topic =
              lecture.topic.length > 25
                ? lecture.topic.substring(0, 25) + '...'
                : lecture.topic;
            titleParts.push(topic);
          }

          const displayTitle = titleParts.join(' - ');

          return {
            id: lecture.id,
            title: displayTitle,
            subject: lecture.subject || '',
            course: {
              name: courseName || 'Unknown Course',
            },
          };
        });
        setLectures(processedLectures);
        console.log(
          'Loaded lectures:',
          processedLectures.length,
          processedLectures
        );
      } else {
        console.log('No lectures found or error:', lecturesError);
        setLectures([]);
      }

      // First check if exams table has any data
      const { count: examCount } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true });

      console.log('Total exams in database:', examCount);

      // Load exams list with correct relationships
      let { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select(
          `
          id,
          name,
          subject,
          chapter,
          topic,
          course_id,
          courses (
            id,
            name
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('Exams query result:', { examsData, examsError });

      // If relationship fails, try without it
      if (examsError || !examsData || examsData.length === 0) {
        console.log('Trying exams query without relationship...');
        const { data: simpleExamsData, error: simpleExamsError } =
          await supabase
            .from('exams')
            .select('id, name, subject, chapter, topic, course_id')
            .order('created_at', { ascending: false })
            .limit(50);

        console.log('Simple exams query result:', {
          simpleExamsData,
          simpleExamsError,
        });

        if (!simpleExamsError && simpleExamsData) {
          examsData = simpleExamsData.map((exam) => ({
            ...exam,
            courses: [] as any,
          }));
          examsError = null;
        }
      }

      if (!examsError && examsData) {
        const processedExams = examsData.map((exam) => {
          const courseName = Array.isArray(exam.courses)
            ? exam.courses[0]?.name
            : (exam.courses as any)?.name;

          return {
            id: exam.id,
            name: exam.name || 'Untitled Exam',
            course: {
              name: courseName || 'Unknown Course',
            },
          };
        });
        setExams(processedExams);
        console.log('Loaded exams:', processedExams.length, processedExams);
      } else {
        console.log('No exams found or error:', examsError);
        setExams([]);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadLectureBatches = async (lectureId: string) => {
    try {
      console.log('Loading lecture batches for:', lectureId);

      const { data: lectureBatches, error: lectureError } = await supabase
        .from('lecture_batches')
        .select(
          `
          id,
          scheduled_at
        `
        )
        .eq('lecture_id', lectureId)
        .order('scheduled_at', { ascending: false })
        .limit(20);

      if (!lectureError && lectureBatches) {
        // Get the lecture info from our already loaded lectures
        const lecture = lectures.find((l) => l.id === lectureId);
        // const lectureName = lecture?.subject || 'Lecture';

        const processedLectureBatches = lectureBatches.map((batch) => {
          const batchDate = new Date(batch.scheduled_at);
          const batchTime = batchDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          const batchDateStr = batchDate.toLocaleDateString();

          return {
            id: batch.id,
            title: `${batchDateStr} ${batchTime}`,
            scheduled_start: batch.scheduled_at,
            lecture: {
              title: lecture?.title || '',
              subject: lecture?.subject || '',
            },
          };
        });

        console.log('Processed lecture batches:', processedLectureBatches);
        setLectureBatches(processedLectureBatches);
        return processedLectureBatches;
      }

      setLectureBatches([]);
      return [];
    } catch (error) {
      console.error('Error loading lecture batches:', error);
      setLectureBatches([]);
      return [];
    }
  };

  const loadExamBatches = async (examId: string) => {
    try {
      console.log('Loading exam batches for:', examId);

      const { data: examBatches, error: examError } = await supabase
        .from('exam_batches')
        .select(
          `
          id,
          scheduled_start,
          scheduled_end
        `
        )
        .eq('exam_id', examId)
        .order('scheduled_start', { ascending: false })
        .limit(20);

      if (!examError && examBatches) {
        // Get the exam info from our already loaded exams
        const exam = exams.find((e) => e.id === examId);
        const examName = exam?.name || 'Exam';

        const processedExamBatches = examBatches.map((batch) => {
          const startDate = new Date(batch.scheduled_start);
          const startTime = startDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          const startDateStr = startDate.toLocaleDateString();

          let timeInfo = `${startDateStr} ${startTime}`;

          // Add end time if available
          if (batch.scheduled_end) {
            const endDate = new Date(batch.scheduled_end);
            const endTime = endDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            // If same day, just show end time, otherwise show full date/time
            if (startDate.toDateString() === endDate.toDateString()) {
              timeInfo += ` - ${endTime}`;
            } else {
              timeInfo += ` - ${endDate.toLocaleDateString()} ${endTime}`;
            }
          }

          return {
            id: batch.id,
            scheduled_start: batch.scheduled_start,
            exam: {
              name: `${examName} - ${timeInfo}`,
            },
          };
        });

        console.log('Processed exam batches:', processedExamBatches);
        setExamBatches(processedExamBatches);
        return processedExamBatches;
      }

      setExamBatches([]);
      return [];
    } catch (error) {
      console.error('Error loading exam batches:', error);
      setExamBatches([]);
      return [];
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getTargetRecipients = async (): Promise<string[]> => {
    switch (formData.targetType) {
      case 'specific_student':
        return formData.targetId ? [formData.targetId] : [];

      case 'course_students':
        if (!formData.targetId) return [];
        const { data: enrollments, error } = await supabase
          .from('course_enrollments')
          .select('student_id')
          .eq('course_id', formData.targetId)
          .eq('status', 'active');
        if (error) throw error;
        return enrollments.map((e) => e.student_id);

      case 'lecture_absentees':
        if (!formData.targetId) return [];
        const { data: absentees, error: absentError } = await supabase
          .from('attendances')
          .select('student_id')
          .eq('batch_id', formData.targetId)
          .eq('status', 'absent');
        if (absentError) throw absentError;
        return absentees.map((a) => a.student_id);

      case 'exam_absentees':
        if (!formData.targetId) return [];
        const { data: examAbsentees, error: examAbsentError } = await supabase
          .from('exam_attendances')
          .select('student_id')
          .eq('batch_id', formData.targetId)
          .eq('status', 'absent');
        if (examAbsentError) throw examAbsentError;
        return examAbsentees.map((a) => a.student_id);

      case 'all_students':
        return students.map((s) => s.id);

      default:
        return [];
    }
  };

  const handleSendNotification = async () => {
    if (!formData.body.trim()) {
      Alert.alert('Error', 'Notification body is required');
      return;
    }

    try {
      setSending(true);

      const recipients = await getTargetRecipients();
      if (recipients.length === 0) {
        Alert.alert('Error', 'No recipients found for the selected target');
        return;
      }

      const notifications = recipients.map((recipientId) => ({
        recipient_id: recipientId,
        title: formData.title || null,
        body: formData.body,
        type: formData.type,
        link: formData.link || null,
        expires_at: formData.expires_at?.toISOString() || null,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      Alert.alert(
        'Success',
        `Notification sent to ${recipients.length} recipient${
          recipients.length > 1 ? 's' : ''
        }`
      );

      // Reset form
      setFormData({
        title: '',
        body: '',
        type: 'info',
        link: '',
        expires_at: null,
        targetType: 'all_students',
        targetId: '',
        selectedLectureId: '',
        selectedExamId: '',
        category: 'manual',
      });

      // Refresh sent notifications
      const updatedNotifications = await loadSentNotifications();
      setSentNotifications(updatedNotifications);
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const size = 20;
    switch (type) {
      case 'info':
        return <Info size={size} color="#2563EB" />;
      case 'warning':
        return <AlertTriangle size={size} color="#EA580C" />;
      case 'success':
        return <CheckCircle size={size} color="#059669" />;
      case 'error':
        return <XCircle size={size} color="#EF4444" />;
      default:
        return <Info size={size} color="#64748B" />;
    }
  };

  const renderTargetSelector = () => {
    const getTargetDisplayText = () => {
      switch (formData.targetType) {
        case 'specific_student':
          const student = students.find((s) => s.id === formData.targetId);
          return student
            ? `${student.profile.full_name || 'Unknown'} (${student.roll})`
            : 'Select Student';
        case 'course_students':
          const course = courses.find((c) => c.id === formData.targetId);
          return course ? `${course.name} (${course.code})` : 'Select Course';
        case 'lecture_absentees':
          const lecture = lectureBatches.find(
            (l) => l.id === formData.targetId
          );
          return lecture ? lecture.title : 'Select Lecture Batch';
        case 'exam_absentees':
          const exam = examBatches.find((e) => e.id === formData.targetId);
          return exam ? exam.exam.name : 'Select Exam Batch';
        case 'all_students':
          return 'All Students';
        default:
          return 'Select Target';
      }
    };

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Recipients</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowTargetModal(true)}
        >
          <View style={styles.selectorContent}>
            <Users size={16} color="#64748B" />
            <Text style={styles.selectorText}>{getTargetDisplayText()}</Text>
          </View>
          <ChevronDown size={16} color="#64748B" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderLivePreview = () => {
    if (!formData.body.trim()) return null;

    const previewNotification = {
      id: 'preview',
      recipient_id: '',
      title: formData.title || null,
      body: formData.body,
      link: formData.link || null,
      expires_at: formData.expires_at?.toISOString() || null,
      type: formData.type,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const getTargetDisplayText = () => {
      switch (formData.targetType) {
        case 'specific_student':
          const student = students.find((s) => s.id === formData.targetId);
          return student
            ? `${student.profile.full_name || 'Unknown'} (${student.roll})`
            : 'Select Student';
        case 'course_students':
          const course = courses.find((c) => c.id === formData.targetId);
          return course ? `${course.name} students` : 'Course Students';
        case 'lecture_absentees':
          const lecture = lectureBatches.find(
            (l) => l.id === formData.targetId
          );
          return lecture ? `${lecture.title} absentees` : 'Lecture Absentees';
        case 'exam_absentees':
          const exam = examBatches.find((e) => e.id === formData.targetId);
          return exam ? `${exam.exam.name} absentees` : 'Exam Absentees';
        case 'all_students':
          return 'All Students';
        default:
          return 'Select Target';
      }
    };

    return (
      <View style={styles.previewSection}>
        <View style={styles.previewHeader}>
          <Text style={styles.sectionTitle}>Live Preview</Text>
          <View style={styles.previewInfo}>
            <View style={styles.previewBadge}>
              {getTypeIcon(formData.type)}
              <Text style={styles.previewBadgeText}>
                {formData.type.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.previewDetails}>
          <Text style={styles.previewDetailText}>
            <Text style={styles.previewDetailLabel}>Target: </Text>
            {getTargetDisplayText()}
          </Text>
          {formData.expires_at && (
            <Text style={styles.previewDetailText}>
              <Text style={styles.previewDetailLabel}>Expires: </Text>
              {formData.expires_at.toLocaleDateString()}{' '}
              {formData.expires_at.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>

        <View style={styles.previewCard}>
          <NotificationItem
            notification={previewNotification}
            onPress={() => {}}
          />
        </View>
      </View>
    );
  };

  const renderSentNotifications = () => {
    const filteredNotifications = notificationsPagination.paginatedData.filter(
      (notification) =>
        notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.body.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
      return (
        <View style={styles.historyContainer}>
          <View style={styles.searchContainer}>
            <Search size={16} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sent notifications..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
          </View>
          <SkeletonList
            count={6}
            renderItem={() => <ListItemSkeleton />}
            style={styles.historyList}
          />
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        <View style={styles.searchContainer}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sent notifications..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => `${item.id}-${item.created_at}`}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyTitleRow}>
                  {getTypeIcon(item.type)}
                  <Text style={styles.historyTitle}>
                    {item.title || 'Untitled Notification'}
                  </Text>
                </View>
                <Text style={styles.historyDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.historyBody} numberOfLines={2}>
                {item.body}
              </Text>
              <View style={styles.historyFooter}>
                <View style={styles.recipientBadge}>
                  <Users size={12} color="#64748B" />
                  <Text style={styles.recipientCount}>
                    {item.recipient_count} recipient
                    {item.recipient_count > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.historyList}
        />

        {/* Pagination */}
        <Pagination
          currentPage={notificationsPagination.currentPage}
          totalPages={notificationsPagination.totalPages}
          hasNextPage={notificationsPagination.hasNextPage}
          hasPreviousPage={notificationsPagination.hasPreviousPage}
          pageNumbers={notificationsPagination.pageNumbers}
          onNextPage={notificationsPagination.nextPage}
          onPreviousPage={notificationsPagination.previousPage}
          onGoToPage={notificationsPagination.goToPage}
          totalItems={sentNotifications.length}
          itemsPerPage={10}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Notifications</Text>
          <View style={styles.headerActions} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'compose' && styles.activeTab]}
            onPress={() => setActiveTab('compose')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'compose' && styles.activeTabText,
              ]}
            >
              Compose
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'history' && styles.activeTabText,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skeleton Content */}
        {activeTab === 'compose' ? (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <SkeletonList
                count={6}
                renderItem={() => <ListItemSkeleton />}
                style={{ padding: 20 }}
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.historyContainer}>
            <SkeletonList
              count={8}
              renderItem={() => <ListItemSkeleton />}
              style={styles.historyList}
            />
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Notifications</Text>
        <View style={styles.headerActions}>
          {/* Removed preview toggle button - now using live preview */}
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'compose' && styles.activeTab]}
          onPress={() => setActiveTab('compose')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'compose' && styles.activeTabText,
            ]}
          >
            Compose
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.activeTabText,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'compose' ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Notification Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Compose Notification</Text>

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter notification title..."
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Body Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter notification message..."
                value={formData.body}
                onChangeText={(text) =>
                  setFormData({ ...formData, body: text })
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowTypeModal(true)}
              >
                <View style={styles.selectorContent}>
                  {getTypeIcon(formData.type)}
                  <Text style={styles.selectorText}>
                    {formData.type.charAt(0).toUpperCase() +
                      formData.type.slice(1)}
                  </Text>
                </View>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Target Recipients */}
            {renderTargetSelector()}

            {/* Link Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Link (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter deep link or screen path..."
                value={formData.link}
                onChangeText={(text) =>
                  setFormData({ ...formData, link: text })
                }
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSendNotification}
              disabled={sending || !formData.body.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={18} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Send Notification</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Live Preview Section */}
          {renderLivePreview()}
        </ScrollView>
      ) : (
        renderSentNotifications()
      )}

      {/* Target Selection Modal */}
      <Modal
        visible={showTargetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTargetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Target</Text>
              <TouchableOpacity onPress={() => setShowTargetModal(false)}>
                <XCircle size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Target Type Options */}
              {[
                { value: 'all_students', label: 'All Students', icon: Users },
                {
                  value: 'specific_student',
                  label: 'Specific Student',
                  icon: Target,
                },
                {
                  value: 'course_students',
                  label: 'Course Students',
                  icon: BookOpen,
                },
                {
                  value: 'lecture_absentees',
                  label: 'Lecture Batch Absentees',
                  icon: Clock,
                },
                {
                  value: 'exam_absentees',
                  label: 'Exam Batch Absentees',
                  icon: AlertTriangle,
                },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    formData.targetType === option.value &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      targetType: option.value as any,
                      targetId: '',
                      selectedLectureId: '',
                      selectedExamId: '',
                    });
                  }}
                >
                  <option.icon size={20} color="#64748B" />
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                  {formData.targetType === option.value && (
                    <CheckCircle size={20} color="#2563EB" />
                  )}
                </TouchableOpacity>
              ))}

              {/* Specific Target Selection */}
              {formData.targetType === 'specific_student' && (
                <View style={styles.subOptions}>
                  <Text style={styles.subOptionsTitle}>Select Student:</Text>

                  {students.length === 0 ? (
                    <TouchableOpacity
                      style={styles.loadDataButton}
                      onPress={loadStudentsIfNeeded}
                    >
                      <Text style={styles.loadDataButtonText}>
                        Load Students
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      {/* Student Search */}
                      <View style={styles.searchContainer}>
                        <Search size={16} color="#64748B" />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search students by name or roll..."
                          value={studentSearchQuery}
                          onChangeText={setStudentSearchQuery}
                          placeholderTextColor="#94A3B8"
                        />
                      </View>

                      {students
                        .filter((student) => {
                          if (!studentSearchQuery) return true;
                          const query = studentSearchQuery.toLowerCase();
                          const fullName =
                            student.profile.full_name?.toLowerCase() || '';
                          const roll = student.roll.toLowerCase();
                          return (
                            fullName.includes(query) || roll.includes(query)
                          );
                        })
                        .slice(0, 20) // Limit to 20 results for performance
                        .map((student) => (
                          <TouchableOpacity
                            key={student.id}
                            style={[
                              styles.subOption,
                              formData.targetId === student.id &&
                                styles.subOptionSelected,
                            ]}
                            onPress={() => {
                              setFormData({
                                ...formData,
                                targetId: student.id,
                              });
                              setShowTargetModal(false);
                              setStudentSearchQuery(''); // Clear search after selection
                            }}
                          >
                            <Text style={styles.subOptionText}>
                              {student.profile.full_name || 'Unknown'} (
                              {student.roll})
                            </Text>
                          </TouchableOpacity>
                        ))}

                      {students.filter((student) => {
                        if (!studentSearchQuery) return true;
                        const query = studentSearchQuery.toLowerCase();
                        const fullName =
                          student.profile.full_name?.toLowerCase() || '';
                        const roll = student.roll.toLowerCase();
                        return fullName.includes(query) || roll.includes(query);
                      }).length === 0 &&
                        studentSearchQuery && (
                          <Text style={styles.emptyOptionsText}>
                            No students found matching &ldquo;
                            {studentSearchQuery}&rdquo;
                          </Text>
                        )}

                      {students.filter((student) => {
                        if (!studentSearchQuery) return true;
                        const query = studentSearchQuery.toLowerCase();
                        const fullName =
                          student.profile.full_name?.toLowerCase() || '';
                        const roll = student.roll.toLowerCase();
                        return fullName.includes(query) || roll.includes(query);
                      }).length > 20 && (
                        <Text style={styles.emptyOptionsText}>
                          Showing first 20 results. Please refine your search.
                        </Text>
                      )}
                    </>
                  )}
                </View>
              )}

              {formData.targetType === 'course_students' && (
                <View style={styles.subOptions}>
                  <Text style={styles.subOptionsTitle}>Select Course:</Text>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <TouchableOpacity
                        key={course.id}
                        style={[
                          styles.subOption,
                          formData.targetId === course.id &&
                            styles.subOptionSelected,
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, targetId: course.id });
                          setShowTargetModal(false);
                        }}
                      >
                        <Text style={styles.subOptionText}>
                          {course.name} ({course.code})
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyOptionsText}>
                      No courses available
                    </Text>
                  )}
                </View>
              )}

              {formData.targetType === 'lecture_absentees' && (
                <View style={styles.subOptions}>
                  <Text style={styles.subOptionsTitle}>Select Lecture:</Text>
                  {lectures.length > 0 ? (
                    lectures.map((lecture) => (
                      <TouchableOpacity
                        key={lecture.id}
                        style={[
                          styles.subOption,
                          formData.selectedLectureId === lecture.id &&
                            styles.subOptionSelected,
                        ]}
                        onPress={async () => {
                          setFormData({
                            ...formData,
                            selectedLectureId: lecture.id,
                            targetId: '', // Reset batch selection
                          });
                          // Load batches for this lecture
                          await loadLectureBatches(lecture.id);
                        }}
                      >
                        <Text style={styles.subOptionText}>
                          {lecture.title} - {lecture.course.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyOptionsText}>
                      No lectures available
                    </Text>
                  )}

                  {/* Show lecture batches if a lecture is selected */}
                  {formData.selectedLectureId && lectureBatches.length > 0 && (
                    <>
                      <Text style={[styles.subOptionsTitle, { marginTop: 16 }]}>
                        Select Lecture Batch:
                      </Text>
                      {lectureBatches.map((batch) => (
                        <TouchableOpacity
                          key={batch.id}
                          style={[
                            styles.subOption,
                            formData.targetId === batch.id &&
                              styles.subOptionSelected,
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, targetId: batch.id });
                            setShowTargetModal(false);
                          }}
                        >
                          <Text style={styles.subOptionText}>
                            {batch.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </View>
              )}

              {formData.targetType === 'exam_absentees' && (
                <View style={styles.subOptions}>
                  <Text style={styles.subOptionsTitle}>Select Exam:</Text>
                  {exams.length > 0 ? (
                    exams.map((exam) => (
                      <TouchableOpacity
                        key={exam.id}
                        style={[
                          styles.subOption,
                          formData.selectedExamId === exam.id &&
                            styles.subOptionSelected,
                        ]}
                        onPress={async () => {
                          setFormData({
                            ...formData,
                            selectedExamId: exam.id,
                            targetId: '', // Reset batch selection
                          });
                          // Load batches for this exam
                          await loadExamBatches(exam.id);
                        }}
                      >
                        <Text style={styles.subOptionText}>
                          {exam.name} - {exam.course.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyOptionsText}>
                      No exams available
                    </Text>
                  )}

                  {/* Show exam batches if an exam is selected */}
                  {formData.selectedExamId && examBatches.length > 0 && (
                    <>
                      <Text style={[styles.subOptionsTitle, { marginTop: 16 }]}>
                        Select Exam Batch:
                      </Text>
                      {examBatches.map((batch) => (
                        <TouchableOpacity
                          key={batch.id}
                          style={[
                            styles.subOption,
                            formData.targetId === batch.id &&
                              styles.subOptionSelected,
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, targetId: batch.id });
                            setShowTargetModal(false);
                          }}
                        >
                          <Text style={styles.subOptionText}>
                            {batch.exam.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Type</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <XCircle size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {['info', 'warning', 'success', 'error'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.modalOption,
                  formData.type === type && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setFormData({ ...formData, type: type as any });
                  setShowTypeModal(false);
                }}
              >
                {getTypeIcon(type)}
                <Text style={styles.modalOptionText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                {formData.type === type && (
                  <CheckCircle size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.expires_at || new Date()}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setFormData({ ...formData, expires_at: selectedDate });
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  previewButtonActive: {
    backgroundColor: '#2563EB',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  formSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 20,
    fontFamily: 'Inter-SemiBold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  previewSection: {
    padding: 20,
    paddingTop: 0,
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyContainer: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Inter-Regular',
  },
  historyList: {
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Inter-SemiBold',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  historyBody: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  recipientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recipientCount: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  subOptions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
  },
  subOptionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
    fontFamily: 'Inter-Medium',
  },
  subOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  subOptionText: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Inter-Regular',
  },
  subOptionDate: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  loadDataButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  loadDataButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  emptyOptionsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  previewBadgeText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  previewDetails: {
    marginBottom: 12,
  },
  previewDetailText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  previewDetailLabel: {
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'Inter-Medium',
  },
});
