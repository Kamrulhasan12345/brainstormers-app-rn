import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  BookOpen,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react-native';
import { lecturesManagementService } from '@/services/lectures-management';
import {
  LectureWithDetails,
  LectureBatchWithDetails,
  Course,
} from '@/types/database-new';

// Form data for the batch creation modal
interface BatchFormData {
  scheduledDate: Date;
  scheduledTime: Date;
  notes: string;
}

// Props for the CreateBatchModal component
interface CreateBatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  batchFormData: BatchFormData;
  setBatchFormData: React.Dispatch<React.SetStateAction<BatchFormData>>;
  editingBatch?: LectureBatchWithDetails | null;
}

// Extended attendance type with student information
interface AttendanceWithStudent {
  id: string;
  batch_id: string;
  student_id: string;
  recorded_by: string | null;
  status: 'present' | 'absent' | 'late' | 'excused';
  recorded_at: string;
  student?: {
    id: string;
    full_name: string;
    roll?: string;
  };
}

export default function LecturesManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const [lectures, setLectures] = useState<LectureWithDetails[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLecture, setEditingLecture] =
    useState<LectureWithDetails | null>(null);
  const [selectedLecture, setSelectedLecture] =
    useState<LectureWithDetails | null>(null);
  const [selectedBatch, setSelectedBatch] =
    useState<LectureBatchWithDetails | null>(null);
  const [showBatchesModal, setShowBatchesModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] =
    useState<LectureBatchWithDetails | null>(null);
  const [batchFormData, setBatchFormData] = useState<BatchFormData>({
    scheduledDate: new Date(),
    scheduledTime: new Date(),
    notes: '',
  });

  // Simple refresh function that can be used by child components
  const refreshBatches = () => {
    // This function is passed to AttendanceModal but doesn't need to do anything
    // The actual batch refresh happens automatically when attendance is updated
    console.log('Batch refresh requested');
  };

  // Calculate the actual status of a batch based on its scheduled time
  const calculateBatchStatus = (
    batch: LectureBatchWithDetails
  ):
    | 'upcoming'
    | 'ongoing'
    | 'completed'
    | 'postponed'
    | 'cancelled'
    | 'not_held' => {
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

  // Check if a batch can be marked as complete
  const canMarkComplete = (batch: LectureBatchWithDetails): boolean => {
    const now = new Date();
    const scheduledTime = new Date(batch.scheduled_at);

    // Can only mark complete if the start time has passed (with 15 minutes buffer)
    return now.getTime() >= scheduledTime.getTime() - 15 * 60 * 1000;
  };

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    chapter: '',
    courseId: '',
    scheduledAt: '',
    duration: 90,
    notes: '',
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [lecturesData, coursesData] = await Promise.all([
        lecturesManagementService.getAllLectures(),
        lecturesManagementService.getCourses(),
      ]);
      setLectures(lecturesData);
      setCourses(coursesData);

      // Extract unique subjects
      const uniqueSubjects = [
        ...new Set(lecturesData.map((lecture) => lecture.subject)),
      ];
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load lectures data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

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
        return '#EA580C';
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

  const filteredLectures = lectures.filter((lecture) => {
    const matchesSearch =
      lecture.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.course?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === 'All' || lecture.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  const resetForm = () => {
    setFormData({
      subject: '',
      topic: '',
      chapter: '',
      courseId: '',
      scheduledAt: '',
      duration: 90,
      notes: '',
    });
  };

  const handleAddLecture = async () => {
    if (!formData.subject || !formData.topic || !formData.courseId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await lecturesManagementService.createLecture(formData);
      setShowAddModal(false);
      resetForm();
      await loadData();
      Alert.alert('Success', 'Lecture created successfully');
    } catch (error) {
      console.error('Error creating lecture:', error);
      Alert.alert('Error', 'Failed to create lecture');
    }
  };

  const handleEditLecture = async () => {
    if (
      !editingLecture ||
      !formData.subject ||
      !formData.topic ||
      !formData.courseId
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await lecturesManagementService.updateLecture(
        editingLecture.id,
        formData
      );
      setEditingLecture(null);
      resetForm();
      await loadData();
      Alert.alert('Success', 'Lecture updated successfully');
    } catch (error) {
      console.error('Error updating lecture:', error);
      Alert.alert('Error', 'Failed to update lecture');
    }
  };

  const handleDeleteLecture = (lectureId: string) => {
    Alert.alert(
      'Delete Lecture',
      'Are you sure you want to delete this lecture? This will also delete all associated batches and attendance records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await lecturesManagementService.deleteLecture(lectureId);
              await loadData();
              Alert.alert('Success', 'Lecture deleted successfully');
            } catch (error) {
              console.error('Error deleting lecture:', error);
              Alert.alert('Error', 'Failed to delete lecture');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (lecture: LectureWithDetails) => {
    setEditingLecture(lecture);
    setFormData({
      subject: lecture.subject || '',
      topic: lecture.topic || '',
      chapter: lecture.chapter || '',
      courseId: lecture.course_id || '',
      scheduledAt: '',
      duration: 90,
      notes: '',
    });
  };

  const openBatchesModal = (lecture: LectureWithDetails) => {
    setSelectedLecture(lecture);
    setShowBatchesModal(true);
  };

  const openAttendanceModal = (batch: LectureBatchWithDetails) => {
    setSelectedBatch(batch);
    setShowAttendanceModal(true);
  };

  const openReviewsModal = (batch: LectureBatchWithDetails) => {
    setSelectedBatch(batch);
    setShowReviewsModal(true);
  };

  const openNotesModal = (batch: LectureBatchWithDetails) => {
    setSelectedBatch(batch);
    setShowNotesModal(true);
  };

  const LectureDetails = ({ lecture }: { lecture: LectureWithDetails }) => (
    <ScrollView style={styles.detailsContainer}>
      <View style={styles.detailsHeader}>
        <Text style={styles.detailsTitle}>{lecture.topic}</Text>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsSectionTitle}>Basic Information</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <BookOpen size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Subject</Text>
            <Text style={styles.detailValue}>{lecture.subject}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Chapter</Text>
            <Text style={styles.detailValue}>{lecture.chapter || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Course</Text>
            <Text style={styles.detailValue}>
              {lecture.course?.name} ({lecture.course?.code})
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {new Date(lecture.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsSectionTitle}>Lecture Batches</Text>
        <Text style={styles.descriptionText}>
          {lecture.batches?.length || 0} batch(es) scheduled for this lecture
        </Text>
        <TouchableOpacity
          style={styles.batchesButton}
          onPress={() => {
            setSelectedLecture(null);
            openBatchesModal(lecture);
          }}
        >
          <Eye size={16} color="#FFFFFF" />
          <Text style={styles.batchesButtonText}>View Batches</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setSelectedLecture(null);
            openEditModal(lecture);
          }}
        >
          <Edit size={16} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Lecture</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            setSelectedLecture(null);
            handleDeleteLecture(lecture.id);
          }}
        >
          <Trash2 size={16} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const BatchesModal = ({ lecture }: { lecture: LectureWithDetails }) => {
    const [batches, setBatches] = useState<LectureBatchWithDetails[]>([]);
    const [batchesLoading, setBatchesLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentTime, setCurrentTime] = useState(new Date()); // Used to trigger re-renders for time-based status calculations

    const loadBatches = useCallback(async () => {
      try {
        setBatchesLoading(true);
        const batchesData = await lecturesManagementService.getLectureBatches(
          lecture.id
        );
        setBatches(batchesData);
      } catch (error) {
        console.error('Error loading batches:', error);
        Alert.alert('Error', 'Failed to load lecture batches');
      } finally {
        setBatchesLoading(false);
      }
    }, [lecture.id]);

    useEffect(() => {
      if (lecture) {
        loadBatches();
      }
    }, [lecture, loadBatches]);

    // Update current time every minute to refresh status calculations
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }, []);

    const handleStatusUpdate = async (batchId: string, status: string) => {
      try {
        await lecturesManagementService.updateBatchStatus(
          batchId,
          status as any
        );
        await loadBatches();
        Alert.alert('Success', 'Batch status updated successfully');
      } catch (error) {
        console.error('Error updating batch status:', error);
        Alert.alert('Error', 'Failed to update batch status');
      }
    };

    const createNewBatch = async () => {
      setBatchFormData({
        scheduledDate: new Date(),
        scheduledTime: new Date(),
        notes: '',
      });
      setEditingBatch(null);
      setShowCreateBatchModal(true);
    };

    const handleCreateBatch = async () => {
      try {
        const combinedDateTime = new Date(batchFormData.scheduledDate);
        combinedDateTime.setHours(batchFormData.scheduledTime.getHours());
        combinedDateTime.setMinutes(batchFormData.scheduledTime.getMinutes());

        if (editingBatch) {
          // Edit existing batch
          await lecturesManagementService.updateLectureBatch(
            editingBatch.id,
            combinedDateTime.toISOString(),
            batchFormData.notes
          );
          Alert.alert('Success', 'Batch updated successfully');
        } else {
          // Create new batch
          await lecturesManagementService.createLectureBatch(
            lecture.id,
            combinedDateTime.toISOString()
          );
          Alert.alert('Success', 'New batch created successfully');
        }

        setShowCreateBatchModal(false);
        setEditingBatch(null);
        await loadBatches();
      } catch (error) {
        console.error('Error creating batch:', error);
        Alert.alert('Error', 'Failed to create batch');
      }
    };

    const handleEditBatch = (batch: LectureBatchWithDetails) => {
      const batchDate = new Date(batch.scheduled_at);
      setBatchFormData({
        scheduledDate: batchDate,
        scheduledTime: batchDate,
        notes: batch.notes || '',
      });
      setEditingBatch(batch);
      setShowCreateBatchModal(true);
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
                await lecturesManagementService.deleteLectureBatch(batchId);
                await loadBatches();
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

    return (
      <View style={{ flex: 1 }}>
        <CreateBatchModal
          visible={showCreateBatchModal}
          onClose={() => setShowCreateBatchModal(false)}
          onSubmit={handleCreateBatch}
          batchFormData={batchFormData}
          setBatchFormData={setBatchFormData}
          editingBatch={editingBatch}
        />
        <ScrollView style={styles.batchesContainer}>
          <View style={styles.batchesHeader}>
            <Text style={styles.batchesTitle}>Lecture Batches</Text>
            <TouchableOpacity
              style={styles.addBatchButton}
              onPress={createNewBatch}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addBatchButtonText}>New Batch</Text>
            </TouchableOpacity>
          </View>

          {batchesLoading ? (
            <Text style={styles.loadingText}>Loading batches...</Text>
          ) : batches.length === 0 ? (
            <Text style={styles.emptyText}>
              No batches found for this lecture
            </Text>
          ) : (
            batches.map((batch) => {
              const actualStatus = calculateBatchStatus(batch);
              const canComplete = canMarkComplete(batch);

              return (
                <View key={batch.id} style={styles.batchCard}>
                  <View style={styles.batchHeader}>
                    <Text style={styles.batchDate}>
                      {new Date(batch.scheduled_at).toLocaleDateString()}
                    </Text>
                    <View style={styles.batchHeaderActions}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusBgColor(actualStatus) },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(actualStatus) },
                          ]}
                        >
                          {actualStatus.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.batchActions}>
                        <TouchableOpacity
                          style={styles.batchEditButton}
                          onPress={() => handleEditBatch(batch)}
                        >
                          <Edit size={12} color="#2563EB" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.batchDeleteButton}
                          onPress={() => handleDeleteBatch(batch.id)}
                        >
                          <Trash2 size={12} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.batchTime}>
                    {new Date(batch.scheduled_at).toLocaleTimeString()}
                  </Text>

                  {batch.notes && (
                    <Text style={styles.batchNotes}>{batch.notes}</Text>
                  )}

                  <View style={styles.batchStats}>
                    <View style={styles.batchStat}>
                      <Text style={styles.batchStatNumber}>
                        {batch.attendance_count || 0}
                      </Text>
                      <Text style={styles.batchStatLabel}>Students</Text>
                    </View>
                    <View style={styles.batchStat}>
                      <Text style={styles.batchStatNumber}>
                        {Math.round(batch.attendance_rate || 0)}%
                      </Text>
                      <Text style={styles.batchStatLabel}>Attendance</Text>
                    </View>
                    <View style={styles.batchStat}>
                      <Text style={styles.batchStatNumber}>
                        {batch.reviews?.length || 0}
                      </Text>
                      <Text style={styles.batchStatLabel}>Reviews</Text>
                    </View>
                    <View style={styles.batchStat}>
                      <Text style={styles.batchStatNumber}>
                        {Array.isArray(batch.lecture_notes)
                          ? batch.lecture_notes.length
                          : 0}
                      </Text>
                      <Text style={styles.batchStatLabel}>Notes</Text>
                    </View>
                  </View>

                  <View style={styles.batchActions}>
                    <TouchableOpacity
                      style={styles.attendanceButton}
                      onPress={() => openAttendanceModal(batch)}
                    >
                      <Users size={14} color="#FFFFFF" />
                      <Text style={styles.attendanceButtonText}>
                        Attendance
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.reviewsButton}
                      onPress={() => openReviewsModal(batch)}
                    >
                      <BookOpen size={14} color="#FFFFFF" />
                      <Text style={styles.reviewsButtonText}>Reviews</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.notesButton}
                      onPress={() => openNotesModal(batch)}
                    >
                      <BookOpen size={14} color="#FFFFFF" />
                      <Text style={styles.notesButtonText}>Notes</Text>
                    </TouchableOpacity>
                    {(actualStatus === 'ongoing' ||
                      actualStatus === 'upcoming') &&
                      canComplete && (
                        <TouchableOpacity
                          style={styles.completeButton}
                          onPress={() =>
                            handleStatusUpdate(batch.id, 'completed')
                          }
                        >
                          <CheckCircle size={14} color="#FFFFFF" />
                          <Text style={styles.completeButtonText}>
                            Complete
                          </Text>
                        </TouchableOpacity>
                      )}
                    {!canComplete && actualStatus === 'upcoming' && (
                      <TouchableOpacity
                        style={[styles.completeButton, styles.disabledButton]}
                        disabled={true}
                      >
                        <Clock size={14} color="#94A3B8" />
                        <Text style={styles.disabledButtonText}>
                          Not Started
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  const AttendanceModal = ({
    batch,
    onRefresh,
  }: {
    batch: LectureBatchWithDetails;
    onRefresh?: () => void;
  }) => {
    const [attendances, setAttendances] = useState<AttendanceWithStudent[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(true);

    const loadAttendance = useCallback(async () => {
      try {
        setAttendanceLoading(true);
        const attendanceData =
          await lecturesManagementService.getAttendanceForBatch(batch.id);
        setAttendances(attendanceData);
      } catch (error) {
        console.error('Error loading attendance:', error);
        Alert.alert('Error', 'Failed to load attendance data');
      } finally {
        setAttendanceLoading(false);
      }
    }, [batch.id]);

    useEffect(() => {
      if (batch) {
        loadAttendance();
      }
    }, [batch, loadAttendance]);

    const markAttendance = async (studentId: string, status: string) => {
      try {
        await lecturesManagementService.markAttendance(
          batch.id,
          studentId,
          status as any,
          user?.id || 'current-user-id'
        );

        // Update the local state instead of reloading all data
        setAttendances((prevAttendances) =>
          prevAttendances.map((attendance) =>
            attendance.student_id === studentId
              ? {
                  ...attendance,
                  status: status as any,
                  recorded_at: new Date().toISOString(),
                }
              : attendance
          )
        );

        // Call parent refresh to update batch statistics
        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error('Error marking attendance:', error);
        Alert.alert('Error', 'Failed to mark attendance');
      }
    };

    const markAllAttendance = async (
      status: 'present' | 'absent' | 'late' | 'excused'
    ) => {
      Alert.alert(
        'Bulk Attendance',
        `Are you sure you want to mark all students as ${status}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                await lecturesManagementService.markAllStudentsAttendance(
                  batch.id,
                  status,
                  user?.id || 'current-user-id'
                );

                // Update local state for all students
                setAttendances((prevAttendances) =>
                  prevAttendances.map((attendance) => ({
                    ...attendance,
                    status: status as any,
                    recorded_at: new Date().toISOString(),
                  }))
                );

                // Call parent refresh to update batch statistics
                if (onRefresh) {
                  onRefresh();
                }

                Alert.alert('Success', `All students marked as ${status}`);
              } catch (error) {
                console.error('Error marking bulk attendance:', error);
                Alert.alert('Error', 'Failed to mark bulk attendance');
              }
            },
          },
        ]
      );
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'present':
          return <CheckCircle size={16} color="#059669" />;
        case 'absent':
          return <XCircle size={16} color="#EF4444" />;
        case 'late':
          return <AlertCircle size={16} color="#EA580C" />;
        case 'excused':
          return <Clock size={16} color="#2563EB" />;
        default:
          return <Clock size={16} color="#64748B" />;
      }
    };

    return (
      <ScrollView style={styles.attendanceContainer}>
        <Text style={styles.attendanceTitle}>Attendance Management</Text>
        <Text style={styles.attendanceSubtitle}>
          {batch.lecture?.topic} -{' '}
          {new Date(batch.scheduled_at).toLocaleDateString()}
        </Text>

        {/* Bulk Attendance Actions */}
        <View style={styles.bulkAttendanceSection}>
          <Text style={styles.bulkAttendanceTitle}>
            Bulk Actions ({attendances.length} students)
          </Text>
          <View style={styles.bulkAttendanceButtons}>
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkPresentButton]}
              onPress={() => markAllAttendance('present')}
            >
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.bulkButtonText}>Mark All Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkAbsentButton]}
              onPress={() => markAllAttendance('absent')}
            >
              <XCircle size={16} color="#FFFFFF" />
              <Text style={styles.bulkButtonText}>Mark All Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkLateButton]}
              onPress={() => markAllAttendance('late')}
            >
              <AlertCircle size={16} color="#FFFFFF" />
              <Text style={styles.bulkButtonText}>Mark All Late</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkExcusedButton]}
              onPress={() => markAllAttendance('excused')}
            >
              <Clock size={16} color="#FFFFFF" />
              <Text style={styles.bulkButtonText}>Mark All Excused</Text>
            </TouchableOpacity>
          </View>
        </View>

        {attendanceLoading ? (
          <Text style={styles.loadingText}>Loading attendance...</Text>
        ) : attendances.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No students enrolled in this course yet.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Students need to be enrolled in the course before attendance can
              be taken.
            </Text>
          </View>
        ) : (
          <View style={styles.attendanceList}>
            {attendances.map((attendance) => (
              <View key={attendance.id} style={styles.attendanceCard}>
                <View style={styles.attendanceInfo}>
                  <Text style={styles.studentName}>
                    {attendance.student?.full_name || 'Unknown Student'}
                  </Text>
                  <Text style={styles.studentRoll}>
                    Roll: {attendance.student?.roll || 'N/A'}
                  </Text>
                </View>
                <View style={styles.attendanceStatus}>
                  {getStatusIcon(attendance.status)}
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: getStatusColor(attendance.status) },
                    ]}
                  >
                    {attendance.status.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.attendanceButtons}>
                  <TouchableOpacity
                    style={[styles.statusButton, styles.presentButton]}
                    onPress={() =>
                      markAttendance(attendance.student_id, 'present')
                    }
                  >
                    <Text style={styles.statusButtonText}>Present</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, styles.absentButton]}
                    onPress={() =>
                      markAttendance(attendance.student_id, 'absent')
                    }
                  >
                    <Text style={styles.statusButtonText}>Absent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, styles.lateButton]}
                    onPress={() =>
                      markAttendance(attendance.student_id, 'late')
                    }
                  >
                    <Text style={styles.statusButtonText}>Late</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, styles.excusedButton]}
                    onPress={() =>
                      markAttendance(attendance.student_id, 'excused')
                    }
                  >
                    <Text style={styles.statusButtonText}>Excused</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const ReviewsModal = ({ batch }: { batch: LectureBatchWithDetails }) => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [newReview, setNewReview] = useState('');

    const loadReviews = useCallback(async () => {
      try {
        setReviewsLoading(true);
        const reviewsData = await lecturesManagementService.getReviewsForBatch(
          batch.id
        );
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error loading reviews:', error);
        Alert.alert('Error', 'Failed to load reviews');
      } finally {
        setReviewsLoading(false);
      }
    }, [batch.id]);

    useEffect(() => {
      if (batch) {
        loadReviews();
      }
    }, [batch, loadReviews]);

    const addReview = async () => {
      if (!newReview.trim()) return;

      try {
        await lecturesManagementService.addReview(batch.id, {
          reviewerId: user?.id || 'current-user-id',
          role: 'staff',
          comment: newReview,
        });
        setNewReview('');
        await loadReviews();
        Alert.alert('Success', 'Review added successfully');
      } catch (error) {
        console.error('Error adding review:', error);
        Alert.alert('Error', 'Failed to add review');
      }
    };

    return (
      <ScrollView style={styles.reviewsContainer}>
        <Text style={styles.reviewsTitle}>Lecture Reviews</Text>
        <Text style={styles.reviewsSubtitle}>
          {batch.lecture?.topic} -{' '}
          {new Date(batch.scheduled_at).toLocaleDateString()}
        </Text>

        <View style={styles.addReviewSection}>
          <TextInput
            style={styles.reviewInput}
            value={newReview}
            onChangeText={setNewReview}
            placeholder="Add a review..."
            multiline
            numberOfLines={3}
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity style={styles.addReviewButton} onPress={addReview}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addReviewButtonText}>Add Review</Text>
          </TouchableOpacity>
        </View>

        {reviewsLoading ? (
          <Text style={styles.loadingText}>Loading reviews...</Text>
        ) : reviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet for this batch</Text>
        ) : (
          <View style={styles.reviewsList}>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>
                    {review.reviewer?.full_name || 'Anonymous'}
                  </Text>
                  <Text style={styles.reviewRole}>({review.role})</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.reviewed_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const NotesModal = ({ batch }: { batch: LectureBatchWithDetails }) => {
    const [notes, setNotes] = useState<any[]>([]);
    const [notesLoading, setNotesLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [showEditNoteModal, setShowEditNoteModal] = useState(false);
    const [noteInput, setNoteInput] = useState('');
    const [editingNote, setEditingNote] = useState<any>(null);

    const loadNotes = useCallback(async () => {
      try {
        setNotesLoading(true);
        const notesData = await lecturesManagementService.getNotesForBatch(
          batch.id
        );
        setNotes(notesData);
      } catch (error) {
        console.error('Error loading notes:', error);
        Alert.alert('Error', 'Failed to load notes');
      } finally {
        setNotesLoading(false);
      }
    }, [batch.id]);

    useEffect(() => {
      if (batch) {
        loadNotes();
      }
    }, [batch, loadNotes]);

    const handleAddNote = () => {
      setNoteInput('');
      setShowAddNoteModal(true);
    };

    const handleEditNote = (note: any) => {
      setEditingNote(note);
      setNoteInput(note.file_url);
      setShowEditNoteModal(true);
    };

    const submitAddNote = async () => {
      if (!noteInput.trim()) {
        Alert.alert('Error', 'Please enter a valid URL');
        return;
      }
      try {
        setUploading(true);
        await lecturesManagementService.uploadLectureNotes(
          batch.id,
          noteInput.trim(),
          user?.id || 'current-user-id'
        );
        await loadNotes();
        setShowAddNoteModal(false);
        setNoteInput('');
        Alert.alert('Success', 'Note added successfully');
      } catch (error) {
        console.error('Error adding note:', error);
        Alert.alert('Error', 'Failed to add note');
      } finally {
        setUploading(false);
      }
    };

    const submitEditNote = async () => {
      if (!noteInput.trim()) {
        Alert.alert('Error', 'Please enter a valid URL');
        return;
      }
      try {
        setUploading(true);
        // Delete the old note and create a new one (since we don't have an update endpoint)
        await lecturesManagementService.deleteNote(editingNote.id);
        await lecturesManagementService.uploadLectureNotes(
          batch.id,
          noteInput.trim(),
          user?.id || 'current-user-id'
        );
        await loadNotes();
        setShowEditNoteModal(false);
        setEditingNote(null);
        setNoteInput('');
        Alert.alert('Success', 'Note updated successfully');
      } catch (error) {
        console.error('Error updating note:', error);
        Alert.alert('Error', 'Failed to update note');
      } finally {
        setUploading(false);
      }
    };

    const handleDeleteNote = (noteId: string) => {
      Alert.alert(
        'Delete Note',
        'Are you sure you want to delete this scanned notebook note?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await lecturesManagementService.deleteNote(noteId);
                await loadNotes();
                Alert.alert('Success', 'Note deleted successfully');
              } catch (error) {
                console.error('Error deleting note:', error);
                Alert.alert('Error', 'Failed to delete note');
              }
            },
          },
        ]
      );
    };

    const handleOpenNote = async (url: string) => {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open this URL on your device');
        }
      } catch (error) {
        console.error('Error opening URL:', error);
        Alert.alert('Error', 'Failed to open the URL');
      }
    };

    return (
      <>
        <ScrollView style={styles.notesContainer}>
          <View style={styles.notesHeader}>
            <Text style={styles.notesTitle}>Lecture Notes</Text>
            <TouchableOpacity
              style={styles.addNoteButton}
              onPress={handleAddNote}
              disabled={uploading}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addNoteButtonText}>Add Note</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.notesSubtitle}>
            {batch.lecture?.topic} -{' '}
            {new Date(batch.scheduled_at).toLocaleDateString()}
          </Text>

          <Text style={styles.notesDescription}>
            Upload scanned copies of student notebooks or related lecture
            materials. Provide links to files stored in Google Drive, Dropbox,
            or other cloud storage.
          </Text>

          {notesLoading ? (
            <Text style={styles.loadingText}>Loading notes...</Text>
          ) : notes.length === 0 ? (
            <Text style={styles.emptyText}>
              No notes available for this lecture
            </Text>
          ) : (
            <View style={styles.notesList}>
              {notes.map((note) => (
                <View key={note.id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteUploader}>
                      {note.uploader?.full_name || 'Unknown User'}
                    </Text>
                    <Text style={styles.noteDate}>
                      {new Date(note.uploaded_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.noteUrlContainer}
                    onPress={() => handleOpenNote(note.file_url)}
                  >
                    <Text style={styles.noteUrl} numberOfLines={2}>
                      {note.file_url}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.noteActions}>
                    <TouchableOpacity
                      style={styles.editNoteButton}
                      onPress={() => handleEditNote(note)}
                    >
                      <Edit size={14} color="#2563EB" />
                      <Text style={styles.editNoteButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteNoteButton}
                      onPress={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 size={14} color="#EF4444" />
                      <Text style={styles.deleteNoteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Add Note Modal */}
        <Modal
          visible={showAddNoteModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddNoteModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddNoteModal(false)}>
                <ArrowLeft size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Lecture Note</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.formTitle}>Add Lecture Note</Text>
              <Text style={styles.formDescription}>
                Enter the URL for scanned notebook files or related lecture
                materials. This can be a Google Drive link, Dropbox link, or any
                other cloud storage URL.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>File URL *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={noteInput}
                  onChangeText={setNoteInput}
                  placeholder="Enter file URL (e.g., https://drive.google.com/file/d/...)"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddNoteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={submitAddNote}
                  disabled={uploading}
                >
                  <Text style={styles.saveButtonText}>
                    {uploading ? 'Adding...' : 'Add Note'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Edit Note Modal */}
        <Modal
          visible={showEditNoteModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditNoteModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditNoteModal(false)}>
                <ArrowLeft size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Lecture Note</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.formTitle}>Edit Lecture Note</Text>
              <Text style={styles.formDescription}>
                Update the URL for this scanned notebook file or lecture
                material.
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>File URL *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={noteInput}
                  onChangeText={setNoteInput}
                  placeholder="Enter file URL (e.g., https://drive.google.com/file/d/...)"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditNoteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={submitEditNote}
                  disabled={uploading}
                >
                  <Text style={styles.saveButtonText}>
                    {uploading ? 'Updating...' : 'Update Note'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lectures Management</Text>
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
            placeholder="Search lectures..."
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
            {['All', ...subjects].map((subject) => (
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.lecturesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading lectures...</Text>
            </View>
          ) : filteredLectures.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No lectures found</Text>
            </View>
          ) : (
            filteredLectures.map((lecture) => (
              <TouchableOpacity
                key={lecture.id}
                style={styles.lectureCard}
                onPress={() => setSelectedLecture(lecture)}
              >
                <View style={styles.lectureHeader}>
                  <View style={styles.lectureInfo}>
                    <Text style={styles.subjectText}>{lecture.subject}</Text>
                  </View>
                  <View style={styles.lectureActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        openEditModal(lecture);
                      }}
                    >
                      <Edit size={16} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteLecture(lecture.id);
                      }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.lectureTitle}>{lecture.topic}</Text>
                <Text style={styles.courseText}>
                  {lecture.course?.name} ({lecture.course?.code})
                </Text>
                {lecture.chapter && (
                  <Text style={styles.chapterText}>
                    Chapter: {lecture.chapter}
                  </Text>
                )}

                <View style={styles.lectureDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#64748B" />
                    <Text style={styles.detailText}>
                      {new Date(lecture.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <BookOpen size={14} color="#64748B" />
                    <Text style={styles.detailText}>
                      {lecture.batches?.length || 0} batch(es)
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Lecture Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Lecture</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.formContainer}>
            <Text style={styles.formTitle}>Create New Lecture</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.subject}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, subject: text }))
                }
                placeholder="Enter subject name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Topic *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.topic}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, topic: text }))
                }
                placeholder="Enter lecture topic"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Chapter</Text>
              <TextInput
                style={styles.textInput}
                value={formData.chapter}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, chapter: text }))
                }
                placeholder="Enter chapter name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Course *</Text>
              <View style={styles.pickerContainer}>
                {courses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.pickerOption,
                      formData.courseId === course.id &&
                        styles.pickerOptionActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, courseId: course.id }))
                    }
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.courseId === course.id &&
                          styles.pickerOptionTextActive,
                      ]}
                    >
                      {course.name} ({course.code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, notes: text }))
                }
                placeholder="Enter lecture notes"
                multiline
                numberOfLines={3}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddLecture}
              >
                <Text style={styles.saveButtonText}>Create Lecture</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Lecture Modal */}
      <Modal
        visible={!!editingLecture}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setEditingLecture(null);
          resetForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setEditingLecture(null);
                resetForm();
              }}
            >
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Lecture</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.formContainer}>
            <Text style={styles.formTitle}>Edit Lecture Details</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.subject}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, subject: text }))
                }
                placeholder="Enter subject name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Topic *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.topic}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, topic: text }))
                }
                placeholder="Enter lecture topic"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Chapter</Text>
              <TextInput
                style={styles.textInput}
                value={formData.chapter}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, chapter: text }))
                }
                placeholder="Enter chapter name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Course *</Text>
              <View style={styles.pickerContainer}>
                {courses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.pickerOption,
                      formData.courseId === course.id &&
                        styles.pickerOptionActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, courseId: course.id }))
                    }
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        formData.courseId === course.id &&
                          styles.pickerOptionTextActive,
                      ]}
                    >
                      {course.name} ({course.code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, notes: text }))
                }
                placeholder="Enter lecture notes"
                multiline
                numberOfLines={3}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingLecture(null);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleEditLecture}
              >
                <Text style={styles.saveButtonText}>Update Lecture</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={!!selectedLecture}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedLecture(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedLecture(null)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Lecture Details</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedLecture && <LectureDetails lecture={selectedLecture} />}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showBatchesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBatchesModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBatchesModal(false)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedLecture?.topic} - Batches
            </Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedLecture && <BatchesModal lecture={selectedLecture} />}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showAttendanceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAttendanceModal(false)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Attendance</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedBatch && (
            <AttendanceModal batch={selectedBatch} onRefresh={refreshBatches} />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showReviewsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReviewsModal(false)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reviews</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedBatch && <ReviewsModal batch={selectedBatch} />}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notes</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedBatch && <NotesModal batch={selectedBatch} />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const CreateBatchModal = ({
  visible,
  onClose,
  onSubmit,
  batchFormData,
  setBatchFormData,
  editingBatch,
}: CreateBatchModalProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingBatch ? 'Edit Batch' : 'Create New Batch'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.formContainer}>
          <Text style={styles.formTitle}>Schedule New Batch</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {batchFormData.scheduledDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={batchFormData.scheduledDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setBatchFormData({
                      ...batchFormData,
                      scheduledDate: selectedDate,
                    });
                  }
                }}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Time *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {batchFormData.scheduledTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={batchFormData.scheduledTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    setBatchFormData({
                      ...batchFormData,
                      scheduledTime: selectedTime,
                    });
                  }
                }}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={batchFormData.notes}
              onChangeText={(text) =>
                setBatchFormData((prev) => ({ ...prev, notes: text }))
              }
              placeholder="Enter batch notes..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={onSubmit}>
              <Text style={styles.saveButtonText}>
                {editingBatch ? 'Update Batch' : 'Create Batch'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

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
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  lecturesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  lectureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lectureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lectureInfo: {
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
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  lectureActions: {
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
  lectureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  lectureDetails: {
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
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
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
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    height: 100,
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
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1E293B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
  },
  courseText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  chapterText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  batchesButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchesButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  batchesContainer: {
    flex: 1,
    padding: 20,
  },
  batchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  batchesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  addBatchButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBatchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  batchTime: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  batchNotes: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  batchStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  batchStat: {
    alignItems: 'center',
    flex: 1,
  },
  batchStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  batchStatLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  batchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attendanceButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  attendanceButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 6,
  },
  reviewsButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  reviewsButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 6,
  },
  notesButton: {
    backgroundColor: '#F97316',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  notesButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 6,
  },
  completeButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 6,
  },
  disabledButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledButtonText: {
    color: '#94A3B8',
    fontWeight: '500',
    marginLeft: 6,
  },
  attendanceContainer: {
    padding: 16,
  },
  attendanceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  attendanceSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  bulkAttendanceSection: {
    marginBottom: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
  },
  bulkAttendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  bulkAttendanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  bulkPresentButton: {
    backgroundColor: '#16A34A',
  },
  bulkAbsentButton: {
    backgroundColor: '#DC2626',
  },
  bulkLateButton: {
    backgroundColor: '#D97706',
  },
  bulkExcusedButton: {
    backgroundColor: '#2563EB',
  },
  bulkButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '80%',
  },
  attendanceList: {
    gap: 12,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  attendanceInfo: {
    flex: 1,
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  studentRoll: {
    fontSize: 12,
    color: '#64748B',
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  presentButton: {
    backgroundColor: '#16A34A',
  },
  absentButton: {
    backgroundColor: '#DC2626',
  },
  lateButton: {
    backgroundColor: '#D97706',
  },
  excusedButton: {
    backgroundColor: '#2563EB',
  },
  reviewsContainer: {
    padding: 16,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  reviewsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  addReviewSection: {
    marginBottom: 24,
  },
  reviewInput: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 14,
    color: '#1E293B',
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  addReviewButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addReviewButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontWeight: '600',
    color: '#1E293B',
  },
  reviewRole: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 'auto',
  },
  reviewComment: {
    fontSize: 14,
    color: '#334155',
  },
  notesContainer: {
    padding: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  addNoteButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addNoteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  notesSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  notesDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  notesList: {
    gap: 12,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteUploader: {
    fontWeight: '500',
    color: '#334155',
  },
  noteDate: {
    fontSize: 12,
    color: '#64748B',
  },
  noteUrlContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noteUrl: {
    fontSize: 14,
    color: '#0EA5E9',
    textDecorationLine: 'underline',
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
  },
  editNoteButtonText: {
    color: '#2563EB',
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 12,
  },
  deleteNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
  },
  deleteNoteButtonText: {
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  pickerOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#334155',
  },
  pickerOptionTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 20,
  },
  detailsHeader: {
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
  },
  detailItem: {
    width: '50%',
    padding: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 20,
  },
  editButton: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  batchHeaderActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  batchEditButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchEditButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  batchDeleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  formDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
});
