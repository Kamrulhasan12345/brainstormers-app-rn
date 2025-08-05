import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  GraduationCap,
  Search,
  BookOpen,
  Calendar,
  X,
} from 'lucide-react-native';
import { studentService } from '@/services/students';
import { courseService } from '@/services/courses';
import { StudentWithProfile, CourseWithDetails } from '@/types/database-new';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/Pagination';
import {
  ListItemSkeleton,
  SkeletonList,
} from '../../components/SkeletonLoader';

interface StudentFormData {
  email: string;
  password: string;
  fullName: string;
  roll: string;
}

export default function AdminStudentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<
    StudentWithProfile[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination for filtered students
  const pagination = usePagination(filteredStudents, { itemsPerPage: 10 });

  const [formData, setFormData] = useState<StudentFormData>({
    email: '',
    password: '',
    fullName: '',
    roll: '',
  });

  const [selectedCourseId, setSelectedCourseId] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [studentsData, coursesData] = await Promise.all([
        studentService.getAllStudents(),
        courseService.getAllCourses(),
      ]);
      setStudents(studentsData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load student and course data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterStudents = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(
      (student) =>
        student.profile?.full_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        student.roll?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [students, searchQuery]);

  useEffect(() => {
    filterStudents();
  }, [filterStudents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      roll: '',
    });
  };
  const handleAddStudent = async () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      Alert.alert(
        'Error',
        'Please fill in all required fields (Email, Password, Full Name)'
      );
      return;
    }

    try {
      setSubmitting(true);
      await studentService.createStudent({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        roll: formData.roll,
      });

      setShowAddModal(false);
      resetForm();
      loadData();
      Alert.alert('Success', 'Student created successfully');
    } catch (error: any) {
      console.error('Error creating student:', error);
      // Show specific error if duplicate email or other known error
      if (
        error instanceof Error &&
        error.message === 'A user with this email already exists.'
      ) {
        Alert.alert(
          'Duplicate Email',
          'A user with this email already exists. Please use a different email.'
        );
      } else {
        Alert.alert(
          'Error',
          error?.message || 'Failed to create student. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStudent = async () => {
    if (!selectedStudent || !formData.fullName) {
      Alert.alert('Error', 'Please fill in the full name');
      return;
    }

    try {
      setSubmitting(true);
      await studentService.updateStudent(selectedStudent.id, {
        full_name: formData.fullName,
        roll: formData.roll,
      });

      setShowEditModal(false);
      setSelectedStudent(null);
      resetForm();
      loadData();
      Alert.alert('Success', 'Student updated successfully');
    } catch (error) {
      console.error('Error updating student:', error);
      Alert.alert('Error', 'Failed to update student. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = (student: StudentWithProfile) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${
        student.profile?.full_name || 'this student'
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await studentService.deleteStudent(student.id);
              loadData();
              Alert.alert('Success', 'Student deleted successfully');
            } catch (error) {
              console.error('Error deleting student:', error);
              Alert.alert(
                'Error',
                'Failed to delete student. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const openEditModal = (student: StudentWithProfile) => {
    setSelectedStudent(student);
    setFormData({
      email: '', // Don't pre-fill email for editing
      password: '', // Don't pre-fill password for editing
      fullName: student.profile?.full_name || '',
      roll: student.roll || '',
    });
    setShowEditModal(true);
  };

  const openEnrollModal = (student: StudentWithProfile) => {
    setSelectedStudent(student);
    setSelectedCourseId('');
    setShowEnrollModal(true);
  };

  // Helper to get available courses for enrollment (not already enrolled)
  const getAvailableCoursesForStudent = (student: StudentWithProfile) => {
    const enrolledCourseIds = new Set(
      (student.enrollments || []).map((e) => e.course_id || e.course?.id)
    );
    return courses.filter((course) => !enrolledCourseIds.has(course.id));
  };

  const handleEnrollStudent = async () => {
    if (!selectedCourseId || !selectedStudent) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    try {
      setSubmitting(true);
      await studentService.enrollInCourse(selectedStudent.id, selectedCourseId);
      setShowEnrollModal(false);
      setSelectedStudent(null);
      setSelectedCourseId('');
      loadData();
      Alert.alert('Success', 'Student enrolled successfully');
    } catch (error) {
      console.error('Error enrolling student:', error);
      Alert.alert('Error', 'Failed to enroll student. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStudentItem = ({
    item: student,
  }: {
    item: StudentWithProfile;
  }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.avatarContainer}>
          <User size={24} color="#2563EB" />
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {student.profile?.full_name || 'Unknown Student'}
          </Text>
          <Text style={styles.studentEmail}>
            Roll: {student.roll || 'Not assigned'}
          </Text>
          <Text style={styles.studentId}>ID: {student.id}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(student)}
          >
            <Edit size={16} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEnrollModal(student)}
          >
            <BookOpen size={16} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteStudent(student)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Student Details */}
      <View style={styles.studentDetails}>
        <View style={styles.detailRow}>
          <Phone size={14} color="#64748B" />
          <Text style={styles.detailText}>
            Role: {student.profile?.role || 'student'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.detailText}>
            Created:{' '}
            {new Date(student.profile?.created_at || '').toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <BookOpen size={14} color="#64748B" />
          <Text style={styles.detailText}>
            {student.enrollments?.length || 0} courses enrolled
          </Text>
        </View>
      </View>

      {/* Enrolled Courses */}
      {student.enrollments && student.enrollments.length > 0 && (
        <View style={styles.coursesSection}>
          <Text style={styles.coursesTitle}>Enrolled Courses:</Text>
          <View style={styles.coursesList}>
            {student.enrollments.map((enrollment) => (
              <View key={enrollment.id} style={styles.courseTag}>
                <Text style={styles.courseTagText}>
                  {enrollment.course?.name || 'Unknown Course'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{students.length}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{courses.length}</Text>
          <Text style={styles.statLabel}>Available Courses</Text>
        </View>
      </View>

      {/* Students List */}
      {loading ? (
        <SkeletonList
          count={8}
          renderItem={() => <ListItemSkeleton />}
          style={styles.studentsList}
        />
      ) : (
        <>
          <FlatList
            data={pagination.paginatedData}
            renderItem={renderStudentItem}
            keyExtractor={(item) => item.id}
            style={styles.studentsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <GraduationCap size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No students found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Add your first student to get started'}
                </Text>
              </View>
            }
          />

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            pageNumbers={pagination.pageNumbers}
            onNextPage={pagination.nextPage}
            onPreviousPage={pagination.previousPage}
            onGoToPage={pagination.goToPage}
          />
        </>
      )}

      {/* Add Student Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <X size={24} color="#2563EB" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Student</Text>
            <TouchableOpacity
              onPress={handleAddStudent}
              disabled={submitting}
              style={[
                styles.saveButton,
                submitting && styles.saveButtonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Student Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Student Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, email: text }))
                  }
                  placeholder="student@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, password: text }))
                  }
                  placeholder="Enter password"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, fullName: text }))
                  }
                  placeholder="John Doe"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Roll Number *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.roll}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, roll: text }))
                  }
                  placeholder="2024-STU-0001"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowEditModal(false);
                setSelectedStudent(null);
                resetForm();
              }}
            >
              <X size={24} color="#2563EB" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Student</Text>
            <TouchableOpacity
              onPress={handleEditStudent}
              disabled={submitting}
              style={[
                styles.saveButton,
                submitting && styles.saveButtonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Student Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Student Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, fullName: text }))
                  }
                  placeholder="John Doe"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Roll Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.roll}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, roll: text }))
                  }
                  placeholder="2024-STU-0001"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Enroll Student Modal */}
      <Modal
        visible={showEnrollModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowEnrollModal(false);
                setSelectedStudent(null);
                setSelectedCourseId('');
              }}
            >
              <X size={24} color="#2563EB" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Enroll {selectedStudent?.profile?.full_name || 'Student'}
            </Text>
            <TouchableOpacity
              onPress={handleEnrollStudent}
              disabled={submitting || !selectedCourseId}
              style={[
                styles.saveButton,
                (submitting || !selectedCourseId) && styles.saveButtonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Enroll</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Course</Text>

              {selectedStudent &&
              getAvailableCoursesForStudent(selectedStudent).length === 0 ? (
                <Text style={{ color: '#9CA3AF', marginTop: 16 }}>
                  This student is already enrolled in all available courses.
                </Text>
              ) : null}

              {selectedStudent &&
                getAvailableCoursesForStudent(selectedStudent).map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.courseOption,
                      selectedCourseId === course.id &&
                        styles.courseOptionSelected,
                    ]}
                    onPress={() => setSelectedCourseId(course.id)}
                  >
                    <View style={styles.courseOptionContent}>
                      <Text
                        style={[
                          styles.courseOptionName,
                          selectedCourseId === course.id &&
                            styles.courseOptionNameSelected,
                        ]}
                      >
                        {course.name}
                      </Text>
                      <Text
                        style={[
                          styles.courseOptionCode,
                          selectedCourseId === course.id &&
                            styles.courseOptionCodeSelected,
                        ]}
                      >
                        {course.code}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioButton,
                        selectedCourseId === course.id &&
                          styles.radioButtonSelected,
                      ]}
                    >
                      {selectedCourseId === course.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
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
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  studentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  studentEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  studentId: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionButtons: {
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
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  studentDetails: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
  },
  coursesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  coursesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  coursesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  courseTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  courseTagText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
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
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  courseOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseOptionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  courseOptionContent: {
    flex: 1,
  },
  courseOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  courseOptionNameSelected: {
    color: '#2563EB',
  },
  courseOptionCode: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  courseOptionCodeSelected: {
    color: '#2563EB',
  },
  courseOptionDepartment: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  courseOptionDepartmentSelected: {
    color: '#2563EB',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#2563EB',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
});
