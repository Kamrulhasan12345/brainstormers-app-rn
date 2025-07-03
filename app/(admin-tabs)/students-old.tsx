import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Edit, Trash2, User, Mail, Phone, GraduationCap, Search, Filter, Users, Award, Calendar, BookOpen } from 'lucide-react-native';
import { studentService } from '@/services/students';
import { courseService } from '@/services/courses';
import { StudentWithProfile, CourseWithDetails } from '@/types/database-new';

const mockStudents = [
  {
    id: 'student_001',
    email: 'arjun.sharma@brainstormers.edu',
    name: 'Arjun Sharma',
    role: 'student' as const,
    rollNumber: 'BS2027001',
    class: 'HSC Science - Batch 2027',
    phone: '+91 98765 43210',
    guardianPhone: '+91 98765 43211',
    guardianEmail: 'parent.arjun@gmail.com',
    guardianName: 'Rajesh Sharma',
    dateOfBirth: '2008-05-15',
    address: '123 Main Street, Mumbai, Maharashtra',
    attendance: [
      { lectureId: 'lecture_001', date: '2025-01-20', status: 'present' as const, markedAt: '2025-01-20T10:00:00Z' },
      { lectureId: 'lecture_002', date: '2025-01-21', status: 'absent' as const, markedAt: '2025-01-21T10:00:00Z' },
    ],
    examResults: [
      { examId: 'exam_001', marksObtained: 85, totalMarks: 100, grade: 'A', percentage: 85 },
      { examId: 'exam_002', marksObtained: 78, totalMarks: 90, grade: 'B+', percentage: 87 },
    ],
    guardianNotifications: true,
    createdAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'student_002',
    email: 'priya.patel@brainstormers.edu',
    name: 'Priya Patel',
    role: 'student' as const,
    rollNumber: 'BS2027002',
    class: 'HSC Science - Batch 2027',
    phone: '+91 98765 43220',
    guardianPhone: '+91 98765 43221',
    guardianEmail: 'parent.priya@gmail.com',
    guardianName: 'Meera Patel',
    dateOfBirth: '2008-08-22',
    address: '456 Park Avenue, Pune, Maharashtra',
    attendance: [
      { lectureId: 'lecture_001', date: '2025-01-20', status: 'present' as const, markedAt: '2025-01-20T10:00:00Z' },
      { lectureId: 'lecture_002', date: '2025-01-21', status: 'present' as const, markedAt: '2025-01-21T10:00:00Z' },
    ],
    examResults: [
      { examId: 'exam_001', marksObtained: 92, totalMarks: 100, grade: 'A+', percentage: 92 },
      { examId: 'exam_002', marksObtained: 88, totalMarks: 90, grade: 'A', percentage: 98 },
    ],
    guardianNotifications: true,
    createdAt: '2024-08-01T00:00:00Z',
  },
];

const classes = ['HSC Science - Batch 2027', 'HSC Commerce - Batch 2027', 'HSC Arts - Batch 2027'];

export default function StudentsManagement() {
  const router = useRouter();
  const [students, setStudents] = useState(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    class: '',
    phone: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    dateOfBirth: '',
    address: '',
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'All' || student.class === selectedClass;
    
    return matchesSearch && matchesClass;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      rollNumber: '',
      class: '',
      phone: '',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      dateOfBirth: '',
      address: '',
    });
  };

  const handleAddStudent = () => {
    if (!formData.name || !formData.email || !formData.rollNumber || !formData.class) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newStudent = {
      id: `student_${Date.now()}`,
      ...formData,
      role: 'student' as const,
      attendance: [],
      examResults: [],
      guardianNotifications: true,
      createdAt: new Date().toISOString(),
    };

    setStudents([...students, newStudent]);
    setShowAddModal(false);
    resetForm();
    Alert.alert('Success', 'Student added successfully');
  };

  const handleEditStudent = () => {
    if (!formData.name || !formData.email || !formData.rollNumber || !formData.class) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const updatedStudent = {
      ...editingStudent,
      ...formData,
    };

    setStudents(students.map(s => s.id === editingStudent.id ? updatedStudent : s));
    setEditingStudent(null);
    resetForm();
    Alert.alert('Success', 'Student updated successfully');
  };

  const handleDeleteStudent = (studentId: string) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setStudents(students.filter(s => s.id !== studentId));
            Alert.alert('Success', 'Student deleted successfully');
          }
        }
      ]
    );
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      class: student.class,
      phone: student.phone || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      guardianEmail: student.guardianEmail || '',
      dateOfBirth: student.dateOfBirth || '',
      address: student.address || '',
    });
  };

  const calculateAttendancePercentage = (attendance: any[]) => {
    if (attendance.length === 0) return 0;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  const calculateAverageScore = (examResults: any[]) => {
    if (examResults.length === 0) return 0;
    const totalPercentage = examResults.reduce((sum, result) => sum + result.percentage, 0);
    return Math.round(totalPercentage / examResults.length);
  };

  const StudentForm = () => (
    <ScrollView style={styles.formContainer}>
      <Text style={styles.formTitle}>
        {editingStudent ? 'Edit Student' : 'Add New Student'}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Full Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
          placeholder="Enter student's full name"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Email *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          placeholder="student@brainstormers.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.formLabel}>Roll Number *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.rollNumber}
            onChangeText={(text) => setFormData({...formData, rollNumber: text})}
            placeholder="BS2027001"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.formLabel}>Phone</Text>
          <TextInput
            style={styles.textInput}
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Class *</Text>
        <View style={styles.pickerContainer}>
          {classes.map(className => (
            <TouchableOpacity
              key={className}
              style={[
                styles.pickerOption,
                formData.class === className && styles.pickerOptionActive
              ]}
              onPress={() => setFormData({...formData, class: className})}>
              <Text style={[
                styles.pickerOptionText,
                formData.class === className && styles.pickerOptionTextActive
              ]}>
                {className}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.formLabel}>Date of Birth</Text>
          <TextInput
            style={styles.textInput}
            value={formData.dateOfBirth}
            onChangeText={(text) => setFormData({...formData, dateOfBirth: text})}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Address</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.address}
          onChangeText={(text) => setFormData({...formData, address: text})}
          placeholder="Enter student's address"
          multiline
          numberOfLines={3}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <Text style={styles.sectionTitle}>Guardian Information</Text>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Guardian Name</Text>
        <TextInput
          style={styles.textInput}
          value={formData.guardianName}
          onChangeText={(text) => setFormData({...formData, guardianName: text})}
          placeholder="Enter guardian's name"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.formLabel}>Guardian Phone</Text>
          <TextInput
            style={styles.textInput}
            value={formData.guardianPhone}
            onChangeText={(text) => setFormData({...formData, guardianPhone: text})}
            placeholder="+91 98765 43211"
            keyboardType="phone-pad"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.formLabel}>Guardian Email</Text>
          <TextInput
            style={styles.textInput}
            value={formData.guardianEmail}
            onChangeText={(text) => setFormData({...formData, guardianEmail: text})}
            placeholder="parent@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setShowAddModal(false);
            setEditingStudent(null);
            resetForm();
          }}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={editingStudent ? handleEditStudent : handleAddStudent}>
          <Text style={styles.saveButtonText}>
            {editingStudent ? 'Update' : 'Add'} Student
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const StudentDetails = ({ student }: { student: any }) => {
    const attendancePercentage = calculateAttendancePercentage(student.attendance);
    const averageScore = calculateAverageScore(student.examResults);

    return (
      <ScrollView style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <View style={styles.studentAvatar}>
            <Text style={styles.avatarText}>
              {student.name.split(' ').map((n: string) => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.detailsTitle}>{student.name}</Text>
            <Text style={styles.rollNumberText}>{student.rollNumber}</Text>
            <Text style={styles.classText}>{student.class}</Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Users size={24} color="#2563EB" />
            <Text style={styles.statValue}>{attendancePercentage}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={24} color="#059669" />
            <Text style={styles.statValue}>{averageScore}%</Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={24} color="#EA580C" />
            <Text style={styles.statValue}>{student.examResults.length}</Text>
            <Text style={styles.statLabel}>Exams Taken</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Personal Information</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Mail size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{student.email}</Text>
            </View>
            <View style={styles.detailItem}>
              <Phone size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{student.phone || 'Not provided'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Calendar size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Date of Birth</Text>
              <Text style={styles.detailValue}>{student.dateOfBirth || 'Not provided'}</Text>
            </View>
            <View style={styles.detailItem}>
              <GraduationCap size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Class</Text>
              <Text style={styles.detailValue}>{student.class}</Text>
            </View>
          </View>
        </View>

        {student.address && (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Address</Text>
            <Text style={styles.addressText}>{student.address}</Text>
          </View>
        )}

        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Guardian Information</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <User size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Guardian Name</Text>
              <Text style={styles.detailValue}>{student.guardianName || 'Not provided'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Phone size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Guardian Phone</Text>
              <Text style={styles.detailValue}>{student.guardianPhone || 'Not provided'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Mail size={16} color="#64748B" />
              <Text style={styles.detailLabel}>Guardian Email</Text>
              <Text style={styles.detailValue}>{student.guardianEmail || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Recent Exam Results</Text>
          <View style={styles.resultsContainer}>
            {student.examResults.length > 0 ? (
              student.examResults.slice(-3).map((result: any, index: number) => (
                <View key={index} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.examId}>Exam {result.examId}</Text>
                    <View style={styles.gradeContainer}>
                      <Text style={styles.gradeText}>{result.grade}</Text>
                    </View>
                  </View>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>
                      {result.marksObtained}/{result.totalMarks}
                    </Text>
                    <Text style={styles.percentageText}>{result.percentage}%</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No exam results available</Text>
            )}
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Recent Attendance</Text>
          <View style={styles.attendanceContainer}>
            {student.attendance.length > 0 ? (
              student.attendance.slice(-5).map((record: any, index: number) => (
                <View key={index} style={styles.attendanceRecord}>
                  <Text style={styles.attendanceDate}>{record.date}</Text>
                  <View style={[
                    styles.attendanceStatus,
                    { backgroundColor: record.status === 'present' ? '#ECFDF5' : '#FEF2F2' }
                  ]}>
                    <Text style={[
                      styles.attendanceStatusText,
                      { color: record.status === 'present' ? '#059669' : '#EF4444' }
                    ]}>
                      {record.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No attendance records available</Text>
            )}
          </View>
        </View>

        <View style={styles.detailsActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setSelectedStudent(null);
              openEditModal(student);
            }}>
            <Edit size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setSelectedStudent(null);
              handleDeleteStudent(student.id);
            }}>
            <Trash2 size={16} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Students Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Class:</Text>
            {['All', ...classes].map((className) => (
              <TouchableOpacity
                key={className}
                style={[
                  styles.filterChip,
                  selectedClass === className && styles.filterChipActive
                ]}
                onPress={() => setSelectedClass(className)}>
                <Text style={[
                  styles.filterText,
                  selectedClass === className && styles.filterTextActive
                ]}>
                  {className === 'All' ? 'All Classes' : className.split(' - ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.studentsContainer}>
          {filteredStudents.map((student) => (
            <TouchableOpacity
              key={student.id}
              style={styles.studentCard}
              onPress={() => setSelectedStudent(student)}>
              <View style={styles.studentHeader}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.rollNumber}>{student.rollNumber}</Text>
                  <Text style={styles.className}>{student.class}</Text>
                </View>
                <View style={styles.studentActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      openEditModal(student);
                    }}>
                    <Edit size={16} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteStudent(student.id);
                    }}>
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.studentStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {calculateAttendancePercentage(student.attendance)}%
                  </Text>
                  <Text style={styles.statLabel}>Attendance</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {calculateAverageScore(student.examResults)}%
                  </Text>
                  <Text style={styles.statLabel}>Average Score</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{student.examResults.length}</Text>
                  <Text style={styles.statLabel}>Exams</Text>
                </View>
              </View>

              <View style={styles.contactInfo}>
                <View style={styles.contactItem}>
                  <Mail size={12} color="#64748B" />
                  <Text style={styles.contactText}>{student.email}</Text>
                </View>
                <View style={styles.contactItem}>
                  <Phone size={12} color="#64748B" />
                  <Text style={styles.contactText}>{student.phone || 'No phone'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal || !!editingStudent}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <StudentForm />
        </SafeAreaView>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={!!selectedStudent}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedStudent(null)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Student Details</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedStudent && <StudentDetails student={selectedStudent} />}
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
  studentsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  rollNumber: {
    fontSize: 14,
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  className: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  studentActions: {
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
  studentStats: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  contactInfo: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginTop: 24,
    marginBottom: 16,
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
  textArea: {
    height: 80,
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  rollNumberText: {
    fontSize: 16,
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  classText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginTop: 8,
    marginBottom: 4,
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
  addressText: {
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
  examId: {
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
  attendanceContainer: {
    gap: 8,
  },
  attendanceRecord: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendanceDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  attendanceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendanceStatusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  noDataText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
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
});