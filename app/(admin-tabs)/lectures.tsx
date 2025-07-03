import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, CreditCard as Edit, Trash2, Users, Clock, MapPin, BookOpen, Search, Filter, Calendar } from 'lucide-react-native';

const mockLectures = [
  {
    id: '1',
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    teacher: 'Dr. Rajesh Kumar',
    teacherId: 'teacher_001',
    date: '2025-01-22',
    time: '10:00 AM - 11:30 AM',
    duration: 90,
    location: 'Room A-101',
    description: 'Understanding Faraday\'s law and its applications in real-world scenarios.',
    materials: ['Textbook Chapter 12', 'Lab Manual', 'Practice Problems'],
    status: 'scheduled' as const,
    attendees: ['student_001', 'student_002', 'student_003'],
    maxStudents: 50,
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
  },
  {
    id: '2',
    subject: 'Chemistry',
    topic: 'Organic Compounds - Alcohols',
    teacher: 'Prof. Meera Patel',
    teacherId: 'teacher_002',
    date: '2025-01-23',
    time: '2:00 PM - 3:30 PM',
    duration: 90,
    location: 'Room B-205',
    description: 'Classification, properties, and reactions of alcohols with practical examples.',
    materials: ['Reference Book', 'Practice Problems', 'Lab Equipment'],
    status: 'scheduled' as const,
    attendees: ['student_001', 'student_004'],
    maxStudents: 40,
    createdAt: '2025-01-20T11:00:00Z',
    updatedAt: '2025-01-20T11:00:00Z',
  },
  {
    id: '3',
    subject: 'Mathematics',
    topic: 'Calculus - Derivatives',
    teacher: 'Mr. Amit Shah',
    teacherId: 'teacher_003',
    date: '2025-01-21',
    time: '9:00 AM - 10:30 AM',
    duration: 90,
    location: 'Room A-203',
    description: 'Advanced derivative techniques and their applications in optimization problems.',
    materials: ['Textbook', 'Problem Sets', 'Graphing Tools'],
    status: 'completed' as const,
    attendees: ['student_001', 'student_002', 'student_003', 'student_004'],
    maxStudents: 45,
    createdAt: '2025-01-19T09:00:00Z',
    updatedAt: '2025-01-21T10:30:00Z',
  },
];

const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'];
const teachers = [
  { id: 'teacher_001', name: 'Dr. Rajesh Kumar' },
  { id: 'teacher_002', name: 'Prof. Meera Patel' },
  { id: 'teacher_003', name: 'Mr. Amit Shah' },
];

export default function LecturesManagement() {
  const router = useRouter();
  const [lectures, setLectures] = useState(mockLectures);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState<any>(null);
  const [selectedLecture, setSelectedLecture] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    teacherId: '',
    date: '',
    time: '',
    duration: '90',
    location: '',
    description: '',
    materials: '',
    maxStudents: '50',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#2563EB';
      case 'ongoing': return '#EA580C';
      case 'completed': return '#059669';
      case 'cancelled': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#EFF6FF';
      case 'ongoing': return '#FEF3C7';
      case 'completed': return '#ECFDF5';
      case 'cancelled': return '#FEF2F2';
      default: return '#F1F5F9';
    }
  };

  const filteredLectures = lectures.filter(lecture => {
    const matchesSearch = lecture.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lecture.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lecture.teacher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || lecture.subject === selectedSubject;
    const matchesStatus = selectedStatus === 'All' || lecture.status === selectedStatus;
    
    return matchesSearch && matchesSubject && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      subject: '',
      topic: '',
      teacherId: '',
      date: '',
      time: '',
      duration: '90',
      location: '',
      description: '',
      materials: '',
      maxStudents: '50',
    });
  };

  const handleAddLecture = () => {
    if (!formData.subject || !formData.topic || !formData.teacherId || !formData.date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const teacher = teachers.find(t => t.id === formData.teacherId);
    const newLecture = {
      id: `lecture_${Date.now()}`,
      ...formData,
      teacher: teacher?.name || '',
      duration: parseInt(formData.duration),
      maxStudents: parseInt(formData.maxStudents),
      materials: formData.materials.split(',').map(m => m.trim()).filter(Boolean),
      status: 'scheduled' as const,
      attendees: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLectures([...lectures, newLecture]);
    setShowAddModal(false);
    resetForm();
    Alert.alert('Success', 'Lecture added successfully');
  };

  const handleEditLecture = () => {
    if (!formData.subject || !formData.topic || !formData.teacherId || !formData.date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const teacher = teachers.find(t => t.id === formData.teacherId);
    const updatedLecture = {
      ...editingLecture,
      ...formData,
      teacher: teacher?.name || '',
      duration: parseInt(formData.duration),
      maxStudents: parseInt(formData.maxStudents),
      materials: formData.materials.split(',').map(m => m.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };

    setLectures(lectures.map(l => l.id === editingLecture.id ? updatedLecture : l));
    setEditingLecture(null);
    resetForm();
    Alert.alert('Success', 'Lecture updated successfully');
  };

  const handleDeleteLecture = (lectureId: string) => {
    Alert.alert(
      'Delete Lecture',
      'Are you sure you want to delete this lecture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLectures(lectures.filter(l => l.id !== lectureId));
            Alert.alert('Success', 'Lecture deleted successfully');
          }
        }
      ]
    );
  };

  const openEditModal = (lecture: any) => {
    setEditingLecture(lecture);
    setFormData({
      subject: lecture.subject,
      topic: lecture.topic,
      teacherId: lecture.teacherId,
      date: lecture.date,
      time: lecture.time,
      duration: lecture.duration.toString(),
      location: lecture.location,
      description: lecture.description,
      materials: lecture.materials.join(', '),
      maxStudents: lecture.maxStudents.toString(),
    });
  };

  const LectureForm = () => (
    <ScrollView style={styles.formContainer}>
      <Text style={styles.formTitle}>
        {editingLecture ? 'Edit Lecture' : 'Add New Lecture'}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Subject *</Text>
        <View style={styles.pickerContainer}>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.pickerOption,
                formData.subject === subject && styles.pickerOptionActive
              ]}
              onPress={() => setFormData({...formData, subject})}>
              <Text style={[
                styles.pickerOptionText,
                formData.subject === subject && styles.pickerOptionTextActive
              ]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Topic *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.topic}
          onChangeText={(text) => setFormData({...formData, topic: text})}
          placeholder="Enter lecture topic"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Teacher *</Text>
        <View style={styles.pickerContainer}>
          {teachers.map(teacher => (
            <TouchableOpacity
              key={teacher.id}
              style={[
                styles.pickerOption,
                formData.teacherId === teacher.id && styles.pickerOptionActive
              ]}
              onPress={() => setFormData({...formData, teacherId: teacher.id})}>
              <Text style={[
                styles.pickerOptionText,
                formData.teacherId === teacher.id && styles.pickerOptionTextActive
              ]}>
                {teacher.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.formLabel}>Date *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.date}
            onChangeText={(text) => setFormData({...formData, date: text})}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.formLabel}>Time *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.time}
            onChangeText={(text) => setFormData({...formData, time: text})}
            placeholder="10:00 AM - 11:30 AM"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.formLabel}>Duration (minutes)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.duration}
            onChangeText={(text) => setFormData({...formData, duration: text})}
            placeholder="90"
            keyboardType="numeric"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.formLabel}>Max Students</Text>
          <TextInput
            style={styles.textInput}
            value={formData.maxStudents}
            onChangeText={(text) => setFormData({...formData, maxStudents: text})}
            placeholder="50"
            keyboardType="numeric"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Location</Text>
        <TextInput
          style={styles.textInput}
          value={formData.location}
          onChangeText={(text) => setFormData({...formData, location: text})}
          placeholder="Room A-101"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
          placeholder="Enter lecture description"
          multiline
          numberOfLines={3}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Materials (comma separated)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.materials}
          onChangeText={(text) => setFormData({...formData, materials: text})}
          placeholder="Textbook, Lab Manual, Practice Problems"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setShowAddModal(false);
            setEditingLecture(null);
            resetForm();
          }}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={editingLecture ? handleEditLecture : handleAddLecture}>
          <Text style={styles.saveButtonText}>
            {editingLecture ? 'Update' : 'Add'} Lecture
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const LectureDetails = ({ lecture }: { lecture: any }) => (
    <ScrollView style={styles.detailsContainer}>
      <View style={styles.detailsHeader}>
        <Text style={styles.detailsTitle}>{lecture.topic}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusBgColor(lecture.status) }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(lecture.status) }
          ]}>
            {lecture.status.toUpperCase()}
          </Text>
        </View>
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
            <Users size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Teacher</Text>
            <Text style={styles.detailValue}>{lecture.teacher}</Text>
          </View>
          <View style={styles.detailItem}>
            <Calendar size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{lecture.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{lecture.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{lecture.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{lecture.duration} minutes</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsSectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{lecture.description}</Text>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsSectionTitle}>Materials</Text>
        <View style={styles.materialsContainer}>
          {lecture.materials.map((material: string, index: number) => (
            <View key={index} style={styles.materialChip}>
              <Text style={styles.materialText}>{material}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsSectionTitle}>Attendance</Text>
        <View style={styles.attendanceStats}>
          <View style={styles.attendanceStat}>
            <Text style={styles.attendanceNumber}>{lecture.attendees.length}</Text>
            <Text style={styles.attendanceLabel}>Enrolled</Text>
          </View>
          <View style={styles.attendanceStat}>
            <Text style={styles.attendanceNumber}>{lecture.maxStudents}</Text>
            <Text style={styles.attendanceLabel}>Max Capacity</Text>
          </View>
          <View style={styles.attendanceStat}>
            <Text style={styles.attendanceNumber}>
              {Math.round((lecture.attendees.length / lecture.maxStudents) * 100)}%
            </Text>
            <Text style={styles.attendanceLabel}>Utilization</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setSelectedLecture(null);
            openEditModal(lecture);
          }}>
          <Edit size={16} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Lecture</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            setSelectedLecture(null);
            handleDeleteLecture(lecture.id);
          }}>
          <Trash2 size={16} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lectures Management</Text>
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
                  selectedSubject === subject && styles.filterChipActive
                ]}
                onPress={() => setSelectedSubject(subject)}>
                <Text style={[
                  styles.filterText,
                  selectedSubject === subject && styles.filterTextActive
                ]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.lecturesContainer}>
          {filteredLectures.map((lecture) => (
            <TouchableOpacity
              key={lecture.id}
              style={styles.lectureCard}
              onPress={() => setSelectedLecture(lecture)}>
              <View style={styles.lectureHeader}>
                <View style={styles.lectureInfo}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(lecture.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(lecture.status) }
                    ]}>
                      {lecture.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.subjectText}>{lecture.subject}</Text>
                </View>
                <View style={styles.lectureActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      openEditModal(lecture);
                    }}>
                    <Edit size={16} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteLecture(lecture.id);
                    }}>
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.lectureTitle}>{lecture.topic}</Text>
              <Text style={styles.teacherName}>by {lecture.teacher}</Text>

              <View style={styles.lectureDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={14} color="#64748B" />
                  <Text style={styles.detailText}>{lecture.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={14} color="#64748B" />
                  <Text style={styles.detailText}>{lecture.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={14} color="#64748B" />
                  <Text style={styles.detailText}>{lecture.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Users size={14} color="#64748B" />
                  <Text style={styles.detailText}>
                    {lecture.attendees.length}/{lecture.maxStudents} students
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal || !!editingLecture}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <LectureForm />
        </SafeAreaView>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={!!selectedLecture}
        animationType="slide"
        presentationStyle="pageSheet">
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
  lecturesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  lectureCard: {
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
    fontFamily: 'Inter-SemiBold',
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
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
    gap: 16,
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
  descriptionText: {
    fontSize: 16,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  materialsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materialChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  materialText: {
    fontSize: 12,
    color: '#2563EB',
    fontFamily: 'Inter-Medium',
  },
  attendanceStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  attendanceNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
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