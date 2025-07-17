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
  Switch,
  Platform,
  BackHandler,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Search,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MessageCircle,
} from 'lucide-react-native';
import {
  examManagementService,
  Exam,
  ExamBatch,
  ExamAttendance,
  ExamReview,
  Student,
} from '@/services/exam-management';

export default function ExamsManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ExamBatch | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [examBatches, setExamBatches] = useState<ExamBatch[]>([]);
  const [attendances, setAttendances] = useState<ExamAttendance[]>([]);
  const [examReviews, setExamReviews] = useState<ExamReview[]>([]);
  const [studentsForAttendance, setStudentsForAttendance] = useState<Student[]>(
    []
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showBatchAttendanceModal, setShowBatchAttendanceModal] =
    useState(false);
  const [selectedBatchForAttendance, setSelectedBatchForAttendance] =
    useState<ExamBatch | null>(null);
  const [attendanceData, setAttendanceData] = useState<{
    [key: string]: {
      status: 'present' | 'absent' | 'late' | 'excused';
      score: string;
    };
  }>({});
  const [reviewComment, setReviewComment] = useState('');
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ExamBatch | null>(null);

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingBatchId, setLoadingBatchId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    subject: '',
    chapter: '',
    topic: '',
    total_marks: '100',
  });

  // Batch form state
  const [batchFormData, setBatchFormData] = useState({
    startDate: new Date(),
    startTime: new Date(),
    endDate: new Date(),
    endTime: new Date(),
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (showAddBatchModal) {
          setShowAddBatchModal(false);
          setEditingBatch(null);
          return true;
        }
        if (showBatchAttendanceModal) {
          setShowBatchAttendanceModal(false);
          return true;
        }
        if (showReviewModal) {
          setShowReviewModal(false);
          return true;
        }
        if (showAttendanceModal) {
          setShowAttendanceModal(false);
          return true;
        }
        if (showBatchModal) {
          setShowBatchModal(false);
          return true;
        }
        if (showAddModal || editingExam) {
          setShowAddModal(false);
          setEditingExam(null);
          return true;
        }
        if (selectedExam) {
          setSelectedExam(null);
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [
    showAddBatchModal,
    showBatchAttendanceModal,
    showReviewModal,
    showAttendanceModal,
    showBatchModal,
    showAddModal,
    editingExam,
    selectedExam,
    editingBatch,
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [examsData, coursesData] = await Promise.all([
        examManagementService.getExams(),
        examManagementService.getCourses(),
      ]);
      setExams(examsData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getBatchStatus = (batch: ExamBatch) => {
    const now = new Date();
    const start = new Date(batch.scheduled_start);
    const end = new Date(batch.scheduled_end);

    if (batch.status === 'cancelled' || batch.status === 'postponed') {
      return batch.status;
    }

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'completed';
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
        return '#7C3AED';
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
      case 'completed':
        return '#ECFDF5';
      case 'cancelled':
        return '#FEF2F2';
      case 'postponed':
        return '#F3E8FF';
      default:
        return '#F1F5F9';
    }
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === 'All' || exam.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      course_id: '',
      subject: '',
      chapter: '',
      topic: '',
      total_marks: '',
    });
  };

  const handleAddExam = async () => {
    if (!formData.name || !formData.course_id || !formData.subject) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const examData = {
        ...formData,
        total_marks: parseInt(formData.total_marks) || 100,
      };
      const newExam = await examManagementService.createExam(examData);
      setExams([newExam, ...exams]);
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', 'Exam created successfully');
    } catch (error) {
      console.error('Error creating exam:', error);
      Alert.alert('Error', 'Failed to create exam');
    }
  };

  const handleEditExam = async () => {
    if (
      !editingExam ||
      !formData.name ||
      !formData.course_id ||
      !formData.subject
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const examData = {
        ...formData,
        total_marks: parseInt(formData.total_marks) || 100,
      };
      const updatedExam = await examManagementService.updateExam(
        editingExam.id,
        examData
      );
      setExams(exams.map((e) => (e.id === editingExam.id ? updatedExam : e)));
      setEditingExam(null);
      resetForm();
      Alert.alert('Success', 'Exam updated successfully');
    } catch (error) {
      console.error('Error updating exam:', error);
      Alert.alert('Error', 'Failed to update exam');
    }
  };

  const handleDeleteExam = (examId: string) => {
    Alert.alert(
      'Delete Exam',
      'Are you sure you want to delete this exam? This will also delete all associated batches and attendance records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await examManagementService.deleteExam(examId);
              setExams(exams.filter((e) => e.id !== examId));
              Alert.alert('Success', 'Exam deleted successfully');
            } catch (error) {
              console.error('Error deleting exam:', error);
              Alert.alert('Error', 'Failed to delete exam');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      course_id: exam.course_id,
      subject: exam.subject,
      chapter: exam.chapter || '',
      topic: exam.topic || '',
      total_marks: exam.total_marks?.toString() || '100',
    });
  };

  const handleViewBatches = async (exam: Exam) => {
    try {
      const batches = await examManagementService.getExamBatches(exam.id);
      setExamBatches(batches);
      setSelectedExam(exam);
      setShowBatchModal(true);
    } catch (error) {
      console.error('Error fetching batches:', error);
      Alert.alert('Error', 'Failed to load exam batches');
    }
  };

  const handleViewAttendance = async (batch: ExamBatch) => {
    try {
      const attendanceData = await examManagementService.getExamAttendances(
        batch.id
      );
      setAttendances(attendanceData);
      setSelectedBatch(batch);
      setShowAttendanceModal(true);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      Alert.alert('Error', 'Failed to load attendance data');
    }
  };

  const handleOpenBatchAttendance = async (batch: ExamBatch) => {
    setLoadingBatchId(batch.id);
    try {
      // Get existing attendance
      const existingAttendance = await examManagementService.getExamAttendances(
        batch.id
      );

      // Get all students for this course
      const examBatches = await examManagementService.getExamBatches(
        batch.exam_id
      );
      const exam = examBatches.find((b) => b.id === batch.id)?.exam;

      if (!exam) {
        throw new Error('Exam not found');
      }

      // Get all students for this course
      const allCourseStudents =
        await examManagementService.getStudentsForCourse(exam.course_id);

      setStudentsForAttendance(allCourseStudents);
      setSelectedBatchForAttendance(batch);

      // Initialize attendance data for all students
      const initialAttendanceData: {
        [key: string]: {
          status: 'present' | 'absent' | 'late' | 'excused';
          score: string;
        };
      } = {};

      // Set existing attendance data or default values
      allCourseStudents.forEach((student: any) => {
        const existingRecord = existingAttendance.find(
          (att: any) => att.student_id === student.id
        );
        if (existingRecord) {
          initialAttendanceData[student.id] = {
            status: existingRecord.status,
            score: existingRecord.score?.toString() || '0',
          };
        } else {
          initialAttendanceData[student.id] = { status: 'present', score: '0' };
        }
      });

      setAttendanceData(initialAttendanceData);
      setShowBatchAttendanceModal(true);
    } catch (error) {
      console.error('Error loading students for attendance:', error);
      Alert.alert('Error', 'Failed to load students for attendance');
    } finally {
      setLoadingBatchId(null);
    }
  };

  const handleMarkBatchAttendance = async () => {
    if (!selectedBatchForAttendance) return;

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoadingAttendance(true);
      const attendances = Object.entries(attendanceData).map(
        ([studentId, data]) => ({
          student_id: studentId,
          status: data.status,
          score: parseFloat(data.score) || 0,
        })
      );

      await examManagementService.markBatchAttendance({
        batch_id: selectedBatchForAttendance.id,
        attendances,
        recorded_by: user.id,
      });

      setShowBatchAttendanceModal(false);
      setSelectedBatchForAttendance(null);
      setAttendanceData({});

      // Refresh the batches list to show updated attendance
      if (selectedExam) {
        const batches = await examManagementService.getExamBatches(
          selectedExam.id
        );
        setExamBatches(batches);
      }

      Alert.alert('Success', 'Attendance marked successfully');
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleOpenReviews = async (exam: Exam) => {
    try {
      const reviews = await examManagementService.getExamReviews(exam.id);
      setExamReviews(reviews);
      setSelectedExam(exam);
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    }
  };

  const handleAddReview = async () => {
    if (!selectedExam || !reviewComment.trim()) {
      Alert.alert('Error', 'Please enter a review comment');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      await examManagementService.createExamReview({
        exam_id: selectedExam.id,
        reviewer_id: user.id,
        role: user.role === 'admin' ? 'staff' : user.role || 'staff',
        comment: reviewComment.trim(),
      });

      // Refresh reviews
      const reviews = await examManagementService.getExamReviews(
        selectedExam.id
      );
      setExamReviews(reviews);
      setReviewComment('');
      Alert.alert('Success', 'Review added successfully');
    } catch (error) {
      console.error('Error adding review:', error);
      Alert.alert('Error', 'Failed to add review');
    }
  };

  const handleCreateBatch = async () => {
    if (
      !selectedExam ||
      !batchFormData.startDate ||
      !batchFormData.startTime ||
      !batchFormData.endDate ||
      !batchFormData.endTime
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Combine start date and time
      const startDate = new Date(batchFormData.startDate);
      const startTime = new Date(batchFormData.startTime);
      const startDateTime = new Date(startDate);
      startDateTime.setHours(
        startTime.getHours(),
        startTime.getMinutes(),
        0,
        0
      );

      // Combine end date and time
      const endDate = new Date(batchFormData.endDate);
      const endTime = new Date(batchFormData.endTime);
      const endDateTime = new Date(endDate);
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

      if (editingBatch) {
        // Update existing batch
        const updatedBatch = await examManagementService.updateExamBatch(
          editingBatch.id,
          {
            scheduled_start: startDateTime.toISOString(),
            scheduled_end: endDateTime.toISOString(),
            notes: batchFormData.notes,
          }
        );
        setExamBatches(
          examBatches.map((b) => (b.id === editingBatch.id ? updatedBatch : b))
        );
        Alert.alert('Success', 'Batch updated successfully');
      } else {
        // Create new batch
        const newBatch = await examManagementService.createExamBatch({
          exam_id: selectedExam.id,
          scheduled_start: startDateTime.toISOString(),
          scheduled_end: endDateTime.toISOString(),
          notes: batchFormData.notes,
        });
        setExamBatches([...examBatches, newBatch]);
        Alert.alert('Success', 'Batch created successfully');
      }

      setShowAddBatchModal(false);
      setEditingBatch(null);
      setBatchFormData({
        startDate: new Date(),
        startTime: new Date(),
        endDate: new Date(),
        endTime: new Date(),
        notes: '',
      });
    } catch (error) {
      console.error('Error creating/updating batch:', error);
      Alert.alert('Error', 'Failed to create/update batch');
    }
  };

  const handleOpenAddBatch = () => {
    setShowAddBatchModal(true);
  };

  const handleDeleteBatch = (batchId: string) => {
    Alert.alert(
      'Delete Batch',
      'Are you sure you want to delete this batch? This will also delete all associated attendance records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await examManagementService.deleteExamBatch(batchId);
              setExamBatches(examBatches.filter((b) => b.id !== batchId));
              Alert.alert('Success', 'Batch deleted successfully');
            } catch (error) {
              console.error('Error deleting batch:', error);
              Alert.alert('Error', 'Failed to delete batch');
            }
          },
        },
      ]
    );
  };

  const handleEditBatch = (batch: ExamBatch) => {
    setEditingBatch(batch);
    setBatchFormData({
      startDate: new Date(batch.scheduled_start),
      startTime: new Date(batch.scheduled_start),
      endDate: new Date(batch.scheduled_end),
      endTime: new Date(batch.scheduled_end),
      notes: batch.notes || '',
    });
    setShowAddBatchModal(true);
  };

  const ExamForm = () => (
    <ScrollView style={styles.formContainer}>
      <Text style={styles.formTitle}>
        {editingExam ? 'Edit Exam' : 'Create New Exam'}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Course *</Text>
        <View style={styles.pickerContainer}>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.pickerOption,
                formData.course_id === course.id && styles.pickerOptionActive,
              ]}
              onPress={() => setFormData({ ...formData, course_id: course.id })}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  formData.course_id === course.id &&
                    styles.pickerOptionTextActive,
                ]}
              >
                {course.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter exam name"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Subject *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.subject}
          onChangeText={(text) => setFormData({ ...formData, subject: text })}
          placeholder="Enter subject"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Total Marks *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.total_marks}
          onChangeText={(text) =>
            setFormData({ ...formData, total_marks: text })
          }
          placeholder="Enter total marks"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Chapter</Text>
        <TextInput
          style={styles.textInput}
          value={formData.chapter}
          onChangeText={(text) => setFormData({ ...formData, chapter: text })}
          placeholder="Enter chapter"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Topic</Text>
        <TextInput
          style={styles.textInput}
          value={formData.topic}
          onChangeText={(text) => setFormData({ ...formData, topic: text })}
          placeholder="Enter topic"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setShowAddModal(false);
            setEditingExam(null);
            resetForm();
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={editingExam ? handleEditExam : handleAddExam}
        >
          <Text style={styles.saveButtonText}>
            {editingExam ? 'Update' : 'Create'} Exam
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const ExamDetails = ({ exam }: { exam: Exam }) => (
    <ScrollView style={styles.detailsContainer}>
      <View style={styles.detailsHeader}>
        <Text style={styles.detailsTitle}>{exam.name}</Text>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsSectionTitle}>Exam Information</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Subject</Text>
            <Text style={styles.detailValue}>{exam.subject}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Course</Text>
            <Text style={styles.detailValue}>{exam.course?.name}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total Marks</Text>
            <Text style={styles.detailValue}>{exam.total_marks}</Text>
          </View>
          {exam.chapter && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Chapter</Text>
              <Text style={styles.detailValue}>{exam.chapter}</Text>
            </View>
          )}
          {exam.topic && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Topic</Text>
              <Text style={styles.detailValue}>{exam.topic}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {new Date(exam.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            openEditModal(exam);
          }}
        >
          <Edit size={16} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Exam</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            handleDeleteExam(exam.id);
          }}
        >
          <Trash2 size={16} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exams Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exams..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Subject:</Text>
            {[
              'All',
              ...Array.from(new Set(exams.map((exam) => exam.subject))),
            ].map((subject) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.filterChip,
                  selectedSubject === subject && styles.filterChipActive,
                ]}
                onPress={() => setSelectedSubject(subject)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedSubject === subject && styles.filterTextActive,
                  ]}
                >
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

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
        <View style={styles.examsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading exams...</Text>
            </View>
          ) : filteredExams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No exams found</Text>
            </View>
          ) : (
            filteredExams.map((exam) => (
              <TouchableOpacity
                key={exam.id}
                style={styles.examCard}
                onPress={() => setSelectedExam(exam)}
              >
                <View style={styles.examHeader}>
                  <View style={styles.examInfo}>
                    <Text style={styles.examSubject}>{exam.subject}</Text>
                  </View>
                  <View style={styles.examActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        openEditModal(exam);
                      }}
                    >
                      <Edit size={16} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteExam(exam.id);
                      }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.examTitle}>{exam.name}</Text>
                {exam.topic && (
                  <Text style={styles.examTopic}>{exam.topic}</Text>
                )}
                {exam.chapter && (
                  <Text style={styles.examChapter}>
                    Chapter: {exam.chapter}
                  </Text>
                )}

                <View style={styles.examDetails}>
                  <View style={styles.detailRow}>
                    <BookOpen size={14} color="#64748B" />
                    <Text style={styles.detailText}>{exam.course?.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#64748B" />
                    <Text style={styles.detailText}>
                      {new Date(exam.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Star size={14} color="#64748B" />
                    <Text style={styles.detailText}>
                      Total Marks: {exam.total_marks}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Users size={14} color="#64748B" />
                    <TouchableOpacity onPress={() => handleViewBatches(exam)}>
                      <Text style={[styles.detailText, styles.linkText]}>
                        View Batches
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.detailRow}>
                    <MessageCircle size={14} color="#64748B" />
                    <TouchableOpacity onPress={() => handleOpenReviews(exam)}>
                      <Text style={[styles.detailText, styles.linkText]}>
                        Reviews
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal || !!editingExam}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <ExamForm />
        </SafeAreaView>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={!!selectedExam}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedExam(null)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Exam Details</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedExam && <ExamDetails exam={selectedExam} />}
        </SafeAreaView>
      </Modal>

      {/* Batch Management Modal */}
      <Modal
        visible={showBatchModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBatchModal(false)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Exam Batches</Text>
            <TouchableOpacity onPress={handleOpenAddBatch}>
              <Plus size={24} color="#2563EB" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.batchContainer}>
            {examBatches.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No batches found for this exam
                </Text>
              </View>
            ) : (
              examBatches.map((batch) => (
                <View key={batch.id} style={styles.batchCard}>
                  <View style={styles.batchHeader}>
                    <Text style={styles.batchTime}>
                      {new Date(batch.scheduled_start).toLocaleString()} -{' '}
                      {new Date(batch.scheduled_end).toLocaleString()}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusBgColor(
                            getBatchStatus(batch)
                          ),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(getBatchStatus(batch)) },
                        ]}
                      >
                        {getBatchStatus(batch).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {batch.notes && (
                    <Text style={styles.batchNotes}>{batch.notes}</Text>
                  )}
                  <View style={styles.batchActions}>
                    <TouchableOpacity
                      style={styles.attendanceButton}
                      onPress={() => handleViewAttendance(batch)}
                    >
                      <Users size={16} color="#FFFFFF" />
                      <Text style={styles.attendanceButtonText}>
                        View Attendance
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.attendanceButton,
                        { backgroundColor: '#10B981' },
                        loadingBatchId === batch.id &&
                          styles.attendanceButtonDisabled,
                      ]}
                      onPress={() => handleOpenBatchAttendance(batch)}
                      disabled={loadingBatchId === batch.id}
                    >
                      <CheckCircle size={16} color="#FFFFFF" />
                      <Text style={styles.attendanceButtonText}>
                        {loadingBatchId === batch.id
                          ? 'Loading...'
                          : 'Mark Attendance'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.attendanceButton,
                        { backgroundColor: '#F59E0B' },
                      ]}
                      onPress={() => handleEditBatch(batch)}
                    >
                      <Edit size={16} color="#FFFFFF" />
                      <Text style={styles.attendanceButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.attendanceButton,
                        { backgroundColor: '#EF4444' },
                      ]}
                      onPress={() => handleDeleteBatch(batch.id)}
                    >
                      <Trash2 size={16} color="#FFFFFF" />
                      <Text style={styles.attendanceButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        visible={showAttendanceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAttendanceModal(false)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Attendance & Scores</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.attendanceContainer}>
            {attendances.map((attendance) => (
              <View key={attendance.id} style={styles.attendanceCard}>
                <View style={styles.attendanceHeader}>
                  <Text style={styles.studentName}>
                    {attendance.student?.full_name}
                  </Text>
                  <Text style={styles.studentRoll}>
                    {attendance.student?.roll}
                  </Text>
                </View>
                <View style={styles.attendanceDetails}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBgColor(attendance.status) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(attendance.status) },
                      ]}
                    >
                      {attendance.status.toUpperCase()}
                    </Text>
                  </View>
                  {attendance.score !== null &&
                    attendance.score !== undefined && (
                      <Text style={styles.attendanceScoreText}>
                        Score: {attendance.score}
                      </Text>
                    )}
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Batch Attendance Modal */}
      <Modal
        visible={showBatchAttendanceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowBatchAttendanceModal(false)}
            >
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Mark Attendance</Text>
            <TouchableOpacity
              onPress={handleMarkBatchAttendance}
              disabled={loadingAttendance}
              style={[
                styles.saveButton,
                loadingAttendance && styles.saveButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  loadingAttendance && styles.saveButtonTextDisabled,
                ]}
              >
                {loadingAttendance ? 'Loading...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.attendanceContainer}>
            {loadingAttendance ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading attendance...</Text>
              </View>
            ) : (
              studentsForAttendance.map((student) => (
                <View key={student.id} style={styles.attendanceCard}>
                  <View style={styles.attendanceHeader}>
                    <Text style={styles.studentName}>{student.full_name}</Text>
                    <Text style={styles.studentRoll}>{student.roll}</Text>
                  </View>
                  <View style={styles.attendanceForm}>
                    <View style={styles.statusSelector}>
                      <Text style={styles.formLabel}>Status:</Text>
                      <View style={styles.statusButtons}>
                        {(
                          ['present', 'absent', 'late', 'excused'] as const
                        ).map((status) => (
                          <TouchableOpacity
                            key={status}
                            style={[
                              styles.statusButton,
                              attendanceData[student.id]?.status === status &&
                                styles.statusButtonActive,
                            ]}
                            onPress={() =>
                              setAttendanceData({
                                ...attendanceData,
                                [student.id]: {
                                  ...attendanceData[student.id],
                                  status,
                                },
                              })
                            }
                          >
                            <Text
                              style={[
                                styles.statusButtonText,
                                attendanceData[student.id]?.status === status &&
                                  styles.statusButtonTextActive,
                              ]}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View style={styles.scoreInput}>
                      <Text style={styles.formLabel}>Score:</Text>
                      <TextInput
                        style={styles.scoreTextInput}
                        value={attendanceData[student.id]?.score || '0'}
                        onChangeText={(text) =>
                          setAttendanceData({
                            ...attendanceData,
                            [student.id]: {
                              ...attendanceData[student.id],
                              score: text,
                            },
                          })
                        }
                        placeholder="Score"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Reviews Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Exam Reviews</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.reviewInputSection}>
            <Text style={styles.formLabel}>Add Review:</Text>
            <TextInput
              style={styles.reviewTextInput}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Enter your review..."
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={handleAddReview}
            >
              <Text style={styles.addReviewButtonText}>Add Review</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.reviewsContainer}>
            {examReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>
                    {review.reviewer?.full_name}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.reviewed_at).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <View style={styles.reviewFooter}>
                  <Text style={styles.reviewerRole}>
                    {review.reviewer?.role}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Batch Modal */}
      <Modal
        visible={showAddBatchModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddBatchModal(false);
                setEditingBatch(null);
              }}
            >
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingBatch ? 'Edit Exam Batch' : 'Add Exam Batch'}
            </Text>
            <TouchableOpacity
              onPress={handleCreateBatch}
              style={styles.headerSaveButton}
            >
              <Text style={styles.headerSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Start Date *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Calendar size={20} color="#64748B" />
                <Text style={styles.dateTimeText}>
                  {batchFormData.startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={batchFormData.startDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      setBatchFormData({
                        ...batchFormData,
                        startDate: selectedDate,
                      });
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Start Time *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Clock size={20} color="#64748B" />
                <Text style={styles.dateTimeText}>
                  {batchFormData.startTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={batchFormData.startTime}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowStartTimePicker(false);
                    if (selectedTime) {
                      setBatchFormData({
                        ...batchFormData,
                        startTime: selectedTime,
                      });
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>End Date *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Calendar size={20} color="#64748B" />
                <Text style={styles.dateTimeText}>
                  {batchFormData.endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={batchFormData.endDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) {
                      setBatchFormData({
                        ...batchFormData,
                        endDate: selectedDate,
                      });
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>End Time *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Clock size={20} color="#64748B" />
                <Text style={styles.dateTimeText}>
                  {batchFormData.endTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={batchFormData.endTime}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowEndTimePicker(false);
                    if (selectedTime) {
                      setBatchFormData({
                        ...batchFormData,
                        endTime: selectedTime,
                      });
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={batchFormData.notes}
                onChangeText={(text) =>
                  setBatchFormData({ ...batchFormData, notes: text })
                }
                placeholder="Enter notes (optional)..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
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
  filtersSection: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'Inter-SemiBold',
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'Inter-Medium',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  examsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  examActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
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
  examDetails: {
    gap: 8,
    marginBottom: 12,
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
  resultsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  resultsText: {
    fontSize: 12,
    color: '#059669',
    fontFamily: 'Inter-Medium',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontFamily: 'Inter-SemiBold',
  },
  headerSaveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Regular',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  datePickerText: {
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Regular',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pickerOptionActive: {
    backgroundColor: '#2563EB',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Medium',
  },
  pickerOptionTextActive: {
    color: '#FFFFFF',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'Inter-SemiBold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  saveButtonTextDisabled: {
    color: '#CBD5E1',
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    flex: 1,
    marginRight: 16,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  typeContainer: {
    marginTop: 4,
  },
  syllabusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  syllabusChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syllabusText: {
    fontSize: 12,
    color: '#2563EB',
    fontFamily: 'Inter-Medium',
  },
  instructionsText: {
    fontSize: 16,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  resultsContainer: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  gradeContainer: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    fontFamily: 'Inter-SemiBold',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
  },
  percentageText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  detailsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  examTopic: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  examChapter: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  linkText: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  batchContainer: {
    flex: 1,
    padding: 20,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  batchTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  batchNotes: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  batchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },
  attendanceButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  attendanceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  attendanceContainer: {
    flex: 1,
    padding: 20,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  studentRoll: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  attendanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    fontFamily: 'Inter-SemiBold',
  },
  attendanceForm: {
    marginTop: 12,
  },
  statusSelector: {
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  statusButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  scoreInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreTextInput: {
    flex: 1,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  reviewInputSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  reviewTextInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addReviewButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  reviewsContainer: {
    flex: 1,
    padding: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reviewerRole: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textTransform: 'capitalize',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
