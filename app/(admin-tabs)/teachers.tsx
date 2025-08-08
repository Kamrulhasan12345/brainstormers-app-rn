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
import { ArrowLeft, Plus, Edit, Trash2, User, X } from 'lucide-react-native';
import { teacherService } from '@/services/teachers';
import { TeacherWithProfile } from '@/types/database-new';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/Pagination';
import {
  ListItemSkeleton,
  SkeletonList,
} from '../../components/SkeletonLoader';

interface TeacherFormData {
  email: string;
  password: string;
  fullName: string;
  designation: string;
  department: string;
}

export default function AdminTeachersScreen() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherWithProfile[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<
    TeacherWithProfile[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] =
    useState<TeacherWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination for filtered teachers
  const pagination = usePagination(filteredTeachers, { itemsPerPage: 10 });
  const [formData, setFormData] = useState<TeacherFormData>({
    email: '',
    password: '',
    fullName: '',
    designation: '',
    department: '',
  });

  const loadTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const teachersData = await teacherService.getAllTeachers();
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading teachers:', error);
      Alert.alert('Error', 'Failed to load teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterTeachers = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredTeachers(teachers);
      return;
    }
    const filtered = teachers.filter(
      (teacher) =>
        teacher.profile?.full_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        teacher.designation
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        teacher.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTeachers(filtered);
  }, [teachers, searchQuery]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    filterTeachers();
  }, [filterTeachers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTeachers();
    setRefreshing(false);
  }, [loadTeachers]);

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      designation: '',
      department: '',
    });
  };

  const handleAddTeacher = async () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      Alert.alert(
        'Error',
        'Please fill in all required fields (Email, Password, Full Name)'
      );
      return;
    }
    try {
      setSubmitting(true);
      await teacherService.createTeacher({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        designation: formData.designation,
        department: formData.department,
      });
      setShowAddModal(false);
      resetForm();
      loadTeachers();
      Alert.alert('Success', 'Teacher created successfully');
    } catch (error: any) {
      console.error('Error creating teacher:', error);
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
          error?.message || 'Failed to create teacher. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTeacher = async () => {
    if (!selectedTeacher || !formData.fullName) {
      Alert.alert('Error', 'Please fill in the full name');
      return;
    }
    try {
      setSubmitting(true);
      await teacherService.updateTeacher(selectedTeacher.id, {
        full_name: formData.fullName,
        designation: formData.designation,
        department: formData.department,
      });
      setShowEditModal(false);
      setSelectedTeacher(null);
      resetForm();
      loadTeachers();
      Alert.alert('Success', 'Teacher updated successfully');
    } catch (error) {
      console.error('Error updating teacher:', error);
      Alert.alert('Error', 'Failed to update teacher. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = (teacher: TeacherWithProfile) => {
    Alert.alert(
      'Delete Teacher',
      `Are you sure you want to delete ${
        teacher.profile?.full_name || 'this teacher'
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await teacherService.deleteTeacher(teacher.id);
              loadTeachers();
              Alert.alert('Success', 'Teacher deleted successfully');
            } catch (error) {
              console.error('Error deleting teacher:', error);
              Alert.alert(
                'Error',
                'Failed to delete teacher. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const openEditModal = (teacher: TeacherWithProfile) => {
    setSelectedTeacher(teacher);
    setFormData({
      email: '',
      password: '',
      fullName: teacher.profile?.full_name || '',
      designation: teacher.designation || '',
      department: teacher.department || '',
    });
    setShowEditModal(true);
  };

  const renderTeacherItem = ({
    item: teacher,
  }: {
    item: TeacherWithProfile;
  }) => (
    <View style={styles.teacherCard}>
      <View style={styles.teacherHeader}>
        <View style={styles.avatarContainer}>
          <User size={24} color="#2563EB" />
        </View>
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>
            {teacher.profile?.full_name || 'Unknown Teacher'}
          </Text>
          <Text style={styles.teacherEmail}>
            Designation: {teacher.designation || 'Not assigned'}
          </Text>
          <Text style={styles.teacherEmail}>
            Department: {teacher.department || 'Not assigned'}
          </Text>
          <Text style={styles.teacherId}>ID: {teacher.id}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(teacher)}
          >
            <Edit size={16} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteTeacher(teacher)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Teacher Details */}
      <View style={styles.teacherDetails}>
        <Text style={styles.detailText}>
          Role: {teacher.profile?.role || 'teacher'}
        </Text>
        <Text style={styles.detailText}>
          Created:{' '}
          {new Date(teacher.profile?.created_at || '').toLocaleDateString()}
        </Text>
      </View>
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
          <ArrowLeft size={24} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teacher Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search teachers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Teachers List */}
      {loading ? (
        <SkeletonList
          count={8}
          renderItem={() => <ListItemSkeleton />}
          style={styles.teachersList}
        />
      ) : (
        <>
          <FlatList
            data={pagination.paginatedData}
            renderItem={renderTeacherItem}
            keyExtractor={(item) => item.id}
            style={styles.teachersList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No teachers found</Text>
                <Text style={styles.emptySubtext}>
                  Add your first teacher to get started
                </Text>
              </View>
            }
            ListFooterComponent={
              pagination.totalPages > 1 ? (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  hasNextPage={pagination.hasNextPage}
                  hasPreviousPage={pagination.hasPreviousPage}
                  pageNumbers={pagination.pageNumbers}
                  onNextPage={pagination.nextPage}
                  onPreviousPage={pagination.previousPage}
                  onGoToPage={pagination.goToPage}
                  isFooter={true}
                />
              ) : null
            }
          />
        </>
      )}

      {/* Add Teacher Modal */}
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
            <Text style={styles.modalTitle}>Add New Teacher</Text>
            <TouchableOpacity
              onPress={handleAddTeacher}
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
              <Text style={styles.sectionTitle}>Teacher Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, email: text }))
                  }
                  placeholder="teacher@example.com"
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
                  placeholder="Jane Doe"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Designation</Text>
                <TextInput
                  style={styles.input}
                  value={formData.designation}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, designation: text }))
                  }
                  placeholder="Professor, Lecturer, etc."
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Department</Text>
                <TextInput
                  style={styles.input}
                  value={formData.department}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, department: text }))
                  }
                  placeholder="Mathematics, Physics, etc."
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Teacher Modal */}
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
                setSelectedTeacher(null);
                resetForm();
              }}
            >
              <X size={24} color="#2563EB" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Teacher</Text>
            <TouchableOpacity
              onPress={handleEditTeacher}
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
              <Text style={styles.sectionTitle}>Teacher Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, fullName: text }))
                  }
                  placeholder="Jane Doe"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Designation</Text>
                <TextInput
                  style={styles.input}
                  value={formData.designation}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, designation: text }))
                  }
                  placeholder="Professor, Lecturer, etc."
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Department</Text>
                <TextInput
                  style={styles.input}
                  value={formData.department}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, department: text }))
                  }
                  placeholder="Mathematics, Physics, etc."
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
    padding: 8,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teachersList: {
    flex: 1,
    padding: 20,
  },
  teacherCard: {
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
  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  teacherId: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
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
  teacherDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
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
    color: '#94A3B8',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CBD5E1',
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
    borderRadius: 8,
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
    fontWeight: '500',
    color: '#374151',
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
});
