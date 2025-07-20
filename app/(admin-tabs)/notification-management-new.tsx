import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  Send,
  Bell,
  Users,
  Calendar,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
  Filter,
  Search,
  ChevronDown,
  X,
  Clock,
  Target,
  UserCheck,
  MessageSquare,
} from 'lucide-react-native';
import { databaseNotificationService } from '../../services/database-notifications';
import { studentService } from '../../services/students';
import { courseService } from '../../services/courses';
import { examManagementService } from '../../services/exam-management';
import { lecturesManagementService } from '../../services/lectures-management';

const notificationTypes = [
  { id: 'general', label: 'General Notice', icon: Bell, color: '#059669' },
  {
    id: 'exam_reminder',
    label: 'Exam Reminder',
    icon: Calendar,
    color: '#2563EB',
  },
  {
    id: 'lecture_reminder',
    label: 'Lecture Reminder',
    icon: Clock,
    color: '#6366F1',
  },
  {
    id: 'exam_missed',
    label: 'Exam Absence Alert',
    icon: AlertTriangle,
    color: '#EF4444',
  },
  {
    id: 'lecture_missed',
    label: 'Lecture Absence Alert',
    icon: UserCheck,
    color: '#F59E0B',
  },
  {
    id: 'course_enrollment',
    label: 'Course Notice',
    icon: CheckCircle,
    color: '#EA580C',
  },
];

interface Student {
  id: string;
  full_name?: string;
  roll?: string;
  email?: string;
  profile?: { full_name?: string };
  enrollments?: Array<{ course?: { id: string; name: string; code: string } }>;
}

interface Course {
  id: string;
  name: string;
  code: string;
  enrollment_count?: number;
}

interface Exam {
  id: string;
  name: string;
  subject: string;
  course?: { id: string; name: string; code: string };
}

interface Lecture {
  id: string;
  title?: string;
  course?: { id: string; name: string; code: string };
}

interface RecipientGroup {
  id: string;
  label: string;
  count: number;
  type:
    | 'all'
    | 'course'
    | 'individual'
    | 'absentees_exam'
    | 'absentees_lecture';
  data?: any;
}

export default function NotificationManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Form state
  const [selectedType, setSelectedType] = useState('general');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search state
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedLecture, setSelectedLecture] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [studentsData, coursesData, examsData, lecturesData] =
        await Promise.all([
          studentService.getAllStudents(),
          courseService.getAllCourses(),
          examManagementService.getExams(),
          lecturesManagementService.getAllLectures(),
        ]);

      setStudents(studentsData as Student[]);
      setCourses(coursesData);
      setExams(examsData);
      setLectures(lecturesData as Lecture[]);

      // Generate recipient groups
      await generateRecipientGroups(
        studentsData as Student[],
        coursesData,
        examsData,
        lecturesData as Lecture[]
      );
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateRecipientGroups = async (
    studentsData: Student[],
    coursesData: Course[],
    examsData: Exam[],
    lecturesData: Lecture[]
  ) => {
    const groups: RecipientGroup[] = [
      {
        id: 'all_students',
        label: 'All Students',
        count: studentsData.length,
        type: 'all',
      },
    ];

    // Add course-based groups
    for (const course of coursesData) {
      const courseStudents = studentsData.filter((student) =>
        student.enrollments?.some(
          (enrollment) => enrollment.course?.id === course.id
        )
      );
      if (courseStudents.length > 0) {
        groups.push({
          id: `course_${course.id}`,
          label: `${course.code} Students`,
          count: courseStudents.length,
          type: 'course',
          data: { courseId: course.id, students: courseStudents },
        });
      }
    }

    // Add exam absentees groups
    for (const exam of examsData) {
      try {
        const batches = await examManagementService.getExamBatches(exam.id);
        for (const batch of batches) {
          const attendances = await examManagementService.getExamAttendances(
            batch.id
          );
          const absentees = attendances.filter(
            (att: any) => att.status === 'absent'
          );
          if (absentees.length > 0) {
            groups.push({
              id: `exam_absentees_${exam.id}_${batch.id}`,
              label: `${exam.name} Absentees`,
              count: absentees.length,
              type: 'absentees_exam',
              data: { examId: exam.id, batchId: batch.id, students: absentees },
            });
          }
        }
      } catch (error) {
        console.error(`Error loading exam ${exam.id} attendance:`, error);
      }
    }

    // Add lecture absentees groups
    for (const lecture of lecturesData) {
      try {
        const batches = await lecturesManagementService.getLectureBatches(
          lecture.id
        );
        for (const batch of batches) {
          const attendances =
            await lecturesManagementService.getAttendanceForBatch(batch.id);
          const absentees = attendances.filter(
            (att: any) => att.status === 'absent'
          );
          if (absentees.length > 0) {
            groups.push({
              id: `lecture_absentees_${lecture.id}_${batch.id}`,
              label: `${lecture.title || 'Lecture'} Absentees`,
              count: absentees.length,
              type: 'absentees_lecture',
              data: {
                lectureId: lecture.id,
                batchId: batch.id,
                students: absentees,
              },
            });
          }
        }
      } catch (error) {
        console.error(`Error loading lecture ${lecture.id} attendance:`, error);
      }
    }

    setRecipientGroups(groups);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSendNotification = async () => {
    if (!title || !message) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    if (selectedRecipients.length === 0) {
      Alert.alert('Error', 'Please select at least one recipient group');
      return;
    }

    setIsSending(true);
    try {
      let scheduledFor = new Date();

      if (scheduleDate && scheduleTime) {
        scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`);
      }

      // Get all recipient user IDs
      const recipientIds = new Set<string>();

      for (const recipientId of selectedRecipients) {
        const group = recipientGroups.find((g) => g.id === recipientId);
        if (!group) continue;

        switch (group.type) {
          case 'all':
            students.forEach((student) => recipientIds.add(student.id));
            break;
          case 'course':
            if (group.data?.students) {
              group.data.students.forEach((student: Student) =>
                recipientIds.add(student.id)
              );
            }
            break;
          case 'absentees_exam':
          case 'absentees_lecture':
            if (group.data?.students) {
              group.data.students.forEach((attendance: any) => {
                recipientIds.add(
                  attendance.student_id || attendance.student?.id
                );
              });
            }
            break;
        }
      }

      // Create notification data for each recipient
      const notifications = Array.from(recipientIds).map((recipientId) => ({
        recipient_id: recipientId,
        sender_id: user?.id,
        title,
        message,
        type: selectedType as any,
        scheduled_for:
          scheduleDate && scheduleTime ? scheduledFor.toISOString() : undefined,
      }));

      // Send notifications
      await databaseNotificationService.createBulkNotifications(notifications);

      Alert.alert(
        'Notification Scheduled',
        scheduleDate && scheduleTime
          ? `Notification will be sent on ${scheduledFor.toLocaleString()} to ${
              recipientIds.size
            } recipients`
          : `Notification sent immediately to ${recipientIds.size} recipients`,
        [{ text: 'OK' }]
      );

      // Reset form
      setTitle('');
      setMessage('');
      setScheduleDate('');
      setScheduleTime('');
      setSelectedRecipients([]);
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = notificationTypes.find((t) => t.id === type);
    return typeConfig ? typeConfig.icon : Bell;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = notificationTypes.find((t) => t.id === type);
    return typeConfig ? typeConfig.color : '#64748B';
  };

  const toggleRecipientSelection = (recipientId: string) => {
    setSelectedRecipients((prev) => {
      if (prev.includes(recipientId)) {
        return prev.filter((id) => id !== recipientId);
      } else {
        return [...prev, recipientId];
      }
    });
  };

  const getFilteredRecipientGroups = () => {
    let filtered = recipientGroups;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((group) =>
        group.label.toLowerCase().includes(query)
      );
    }

    if (selectedCourse !== 'all') {
      filtered = filtered.filter((group) => {
        if (group.type === 'course') {
          return group.data?.courseId === selectedCourse;
        }
        return group.type === 'all';
      });
    }

    return filtered;
  };

  const renderSearchBar = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipient groups..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
      </View>
    </View>
  );

  const renderTypeSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>Notification Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.typeContainer}>
          {notificationTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeChip,
                selectedType === type.id && styles.typeChipActive,
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <type.icon
                size={16}
                color={selectedType === type.id ? '#FFFFFF' : type.color}
              />
              <Text
                style={[
                  styles.typeText,
                  selectedType === type.id && styles.typeTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderRecipientSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>
        Recipients ({selectedRecipients.length} selected)
      </Text>
      <TouchableOpacity
        style={styles.recipientSelectorButton}
        onPress={() => setShowRecipientModal(true)}
      >
        <Users size={16} color="#64748B" />
        <Text style={styles.recipientSelectorText}>
          {selectedRecipients.length === 0
            ? 'Select recipients'
            : `${selectedRecipients.length} group(s) selected`}
        </Text>
        <ChevronDown size={16} color="#64748B" />
      </TouchableOpacity>

      {/* Show selected recipients */}
      {selectedRecipients.length > 0 && (
        <View style={styles.selectedRecipientsContainer}>
          {selectedRecipients.map((recipientId) => {
            const group = recipientGroups.find((g) => g.id === recipientId);
            if (!group) return null;
            return (
              <View key={recipientId} style={styles.selectedRecipientChip}>
                <Text style={styles.selectedRecipientText}>
                  {group.label} ({group.count})
                </Text>
                <TouchableOpacity
                  onPress={() => toggleRecipientSelection(recipientId)}
                >
                  <X size={14} color="#64748B" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderRecipientModal = () => (
    <Modal
      visible={showRecipientModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowRecipientModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowRecipientModal(false)}>
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Recipients</Text>
          <TouchableOpacity
            style={styles.modalDoneButton}
            onPress={() => setShowRecipientModal(false)}
          >
            <Text style={styles.modalDoneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderSearchBar()}

          <View style={styles.recipientsList}>
            {getFilteredRecipientGroups().map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.recipientOption,
                  selectedRecipients.includes(group.id) &&
                    styles.recipientOptionSelected,
                ]}
                onPress={() => toggleRecipientSelection(group.id)}
              >
                <View style={styles.recipientOptionContent}>
                  <View style={styles.recipientInfo}>
                    <Text style={styles.recipientLabel}>{group.label}</Text>
                    <Text style={styles.recipientCount}>
                      {group.count} recipients
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      selectedRecipients.includes(group.id) &&
                        styles.checkboxSelected,
                    ]}
                  >
                    {selectedRecipients.includes(group.id) && (
                      <CheckCircle size={16} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading notification data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Management</Text>
        <TouchableOpacity
          style={[styles.filterIcon, showFilters && styles.filterIconActive]}
          onPress={() => setShowFilters(!showFilters)}
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
        {/* Send New Notification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send New Notification</Text>

          <View style={styles.formCard}>
            {renderTypeSelector()}
            {renderRecipientSelector()}

            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter notification title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Message */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter notification message"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Schedule (Optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Schedule (Optional)</Text>
              <View style={styles.scheduleContainer}>
                <TextInput
                  style={[styles.textInput, styles.scheduleInput]}
                  placeholder="YYYY-MM-DD"
                  value={scheduleDate}
                  onChangeText={setScheduleDate}
                  placeholderTextColor="#94A3B8"
                />
                <TextInput
                  style={[styles.textInput, styles.scheduleInput]}
                  placeholder="HH:MM"
                  value={scheduleTime}
                  onChangeText={setScheduleTime}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (isSending || selectedRecipients.length === 0) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendNotification}
              disabled={isSending || selectedRecipients.length === 0}
            >
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>
                {isSending ? 'Sending...' : 'Send Notification'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Users size={20} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>{students.length}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Target size={20} color="#059669" />
              </View>
              <Text style={styles.statValue}>{courses.length}</Text>
              <Text style={styles.statLabel}>Active Courses</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <MessageSquare size={20} color="#EA580C" />
              </View>
              <Text style={styles.statValue}>{recipientGroups.length}</Text>
              <Text style={styles.statLabel}>Recipient Groups</Text>
            </View>
          </View>
        </View>

        {/* Available Recipients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Recipient Groups</Text>
          {recipientGroups.slice(0, 5).map((group) => (
            <View key={group.id} style={styles.recipientCard}>
              <View style={styles.recipientCardContent}>
                <View style={styles.recipientCardIcon}>
                  <Users size={16} color="#2563EB" />
                </View>
                <View style={styles.recipientCardInfo}>
                  <Text style={styles.recipientCardTitle}>{group.label}</Text>
                  <Text style={styles.recipientCardSubtitle}>
                    {group.count} recipients • {group.type}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {recipientGroups.length > 5 && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => setShowRecipientModal(true)}
            >
              <Text style={styles.viewMoreText}>
                View All Groups ({recipientGroups.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Notification Settings</Text>
            <Text style={styles.settingsDescription}>
              • Notifications can be sent immediately or scheduled for later
            </Text>
            <Text style={styles.settingsDescription}>
              • Bulk notifications are supported for multiple recipient groups
            </Text>
            <Text style={styles.settingsDescription}>
              • Individual students, course groups, and absentee lists are
              available
            </Text>
            <Text style={styles.settingsDescription}>
              • All notifications are logged for tracking and compliance
            </Text>
          </View>
        </View>
      </ScrollView>

      {renderRecipientModal()}
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
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  filterIcon: {
    padding: 8,
    borderRadius: 8,
  },
  filterIconActive: {
    backgroundColor: '#2563EB',
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
    marginTop: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  recipientSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  recipientSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#64748B',
  },
  selectedRecipientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  selectedRecipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  selectedRecipientText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  scheduleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleInput: {
    flex: 1,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  modalDoneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  modalDoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
  },
  recipientsList: {
    padding: 20,
  },
  recipientOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recipientOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  recipientOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  recipientCount: {
    fontSize: 14,
    color: '#64748B',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  recipientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recipientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recipientCardInfo: {
    flex: 1,
  },
  recipientCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  recipientCardSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  viewMoreButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  settingsDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 4,
  },
});
