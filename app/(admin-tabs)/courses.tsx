import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Edit, Trash2, X } from 'lucide-react-native';
import { courseService } from '@/services/courses';
import { CourseWithDetails } from '@/types/database-new';

interface CourseFormData {
  name: string;
  code: string;
}

export default function AdminCoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithDetails | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    code: '',
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await courseService.getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '' });
  };

  const handleAddCourse = async () => {
    if (!formData.name || !formData.code) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Code)');
      return;
    }
    try {
      setSubmitting(true);
      await courseService.createCourse({
        name: formData.name,
        code: formData.code,
      });
      setShowAddModal(false);
      resetForm();
      loadCourses();
      Alert.alert('Success', 'Course created successfully');
    } catch (error) {
      console.error('Error creating course:', error);
      Alert.alert('Error', 'Failed to create course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (course: CourseWithDetails) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
    });
    setShowEditModal(true);
  };

  const handleEditCourse = async () => {
    if (!selectedCourse || !formData.name || !formData.code) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Code)');
      return;
    }
    try {
      setSubmitting(true);
      await courseService.updateCourse(selectedCourse.id, {
        name: formData.name,
        code: formData.code,
      });
      setShowEditModal(false);
      setSelectedCourse(null);
      resetForm();
      loadCourses();
      Alert.alert('Success', 'Course updated successfully');
    } catch (error) {
      console.error('Error updating course:', error);
      Alert.alert('Error', 'Failed to update course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = (course: CourseWithDetails) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete ${course.name}? This will also delete all enrollments for this course.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await courseService.deleteCourse(course.id);
              loadCourses();
              Alert.alert(
                'Success',
                'Course and related enrollments deleted successfully'
              );
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert(
                'Error',
                'Failed to delete course. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const renderCourseItem = ({ item: course }: { item: CourseWithDetails }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseInfo}>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.courseCode}>{course.code}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(course)}
        >
          <Edit size={16} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteCourse(course)}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Courses List */}
      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id}
        style={styles.coursesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No courses found</Text>
            <Text style={styles.emptySubtext}>
              Add your first course to get started
            </Text>
          </View>
        }
      />

      {/* Add Course Modal */}
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
              <X size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Course</Text>
            <TouchableOpacity
              onPress={handleAddCourse}
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Course Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Course Name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Code *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.code}
                  onChangeText={(text) =>
                    setFormData({ ...formData, code: text })
                  }
                  placeholder="COURSE-101"
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Course Modal */}
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
                setSelectedCourse(null);
                resetForm();
              }}
            >
              <X size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Course</Text>
            <TouchableOpacity
              onPress={handleEditCourse}
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Course Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Course Name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Code *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.code}
                  onChangeText={(text) =>
                    setFormData({ ...formData, code: text })
                  }
                  placeholder="COURSE-101"
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#1F2937' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coursesList: { flex: 1, paddingHorizontal: 20 },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  courseCode: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: { backgroundColor: '#FEF2F2' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600' },
  formContainer: { flex: 1, padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
});
