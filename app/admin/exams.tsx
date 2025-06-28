import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, CreditCard as Edit, Trash2, Calendar, Clock, MapPin, Target, Award, Search, Filter } from 'lucide-react-native';

const mockExams = [
  {
    id: '1',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    date: '2025-01-25',
    time: '10:00 AM - 12:00 PM',
    duration: 120,
    totalMarks: 100,
    location: 'Hall A',
    type: 'Unit Test' as const,
    syllabus: ['Wave equation', 'EM spectrum', 'Properties of EM waves'],
    status: 'upcoming' as const,
    students: ['student_001', 'student_002', 'student_003'],
    instructions: 'Bring calculator and drawing instruments. No mobile phones allowed.',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
  },
  {
    id: '2',
    subject: 'Chemistry',
    topic: 'Organic Chemistry - Aldehydes & Ketones',
    date: '2025-01-28',
    time: '2:00 PM - 4:00 PM',
    duration: 120,
    totalMarks: 80,
    location: 'Hall B',
    type: 'Chapter Test' as const,
    syllabus: ['Preparation methods', 'Chemical reactions', 'Identification tests'],
    status: 'upcoming' as const,
    students: ['student_001', 'student_004'],
    instructions: 'Periodic table will be provided. Show all working clearly.',
    createdAt: '2025-01-20T11:00:00Z',
    updatedAt: '2025-01-20T11:00:00Z',
  },
  {
    id: '3',
    subject: 'Mathematics',
    topic: 'Calculus - Integration',
    date: '2025-01-18',
    time: '9:00 AM - 11:00 AM',
    duration: 120,
    totalMarks: 100,
    location: 'Hall C',
    type: 'Monthly Test' as const,
    syllabus: ['Indefinite integration', 'Definite integration', 'Applications'],
    status: 'completed' as const,
    students: ['student_001', 'student_002', 'student_003', 'student_004'],
    instructions: 'Formula sheet provided. Attempt all questions.',
    results: [
      { studentId: 'student_001', marksObtained: 85, grade: 'A' },
      { studentId: 'student_002', marksObtained: 78, grade: 'B+' },
      { studentId: 'student_003', marksObtained: 92, grade: 'A+' },
      { studentId: 'student_004', marksObtained: 71, grade: 'B' },
    ],
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-18T11:00:00Z',
  },
];

const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'];
const examTypes = ['Unit Test', 'Chapter Test', 'Monthly Test', 'Prelims', 'Board Exam'];

export default function ExamsManagement() {
  const router = useRouter();
  const [exams, setExams] = useState(mockExams);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    date: '',
    time: '',
    duration: '120',
    totalMarks: '100',
    location: '',
    type: 'Unit Test',
    syllabus: '',
    instructions: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#2563EB';
      case 'ongoing': return '#EA580C';
      case 'completed': return '#059669';
      case 'cancelled': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#EFF6FF';
      case 'ongoing': return '#FEF3C7';
      case 'completed': return '#ECFDF5';
      case 'cancelled': return '#FEF2F2';
      default: return '#F1F5F9';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Unit Test': return '#2563EB';
      case 'Chapter Test': return '#059669';
      case 'Monthly Test': return '#EA580C';
      case 'Prelims': return '#7C3AED';
      case 'Board Exam': return '#EF4444';
      default: return '#64748B';
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || exam.subject === selectedSubject;
    const matchesStatus = selectedStatus === 'All' || exam.status === selectedStatus;
    
    return matchesSearch && matchesSubject && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      subject: '',
      topic: '',
      date: '',
      time: '',
      duration: '120',
      totalMarks: '100',
      location: '',
      type: 'Unit Test',
      syllabus: '',
      instructions: '',
    });
  };

  const handleAddExam = () => {
    if (!formData.subject || !formData.topic || !formData.date || !formData.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newExam = {
      id: `exam_${Date.now()}`,
      ...formData,
      duration: parseInt(formData.duration),
      totalMarks: parseInt(formData.totalMarks),
      syllabus: formData.syllabus.split(',').map(s => s.trim()).filter(Boolean),
      status: 'upcoming' as const,
      students: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setExams([...exams, newExam]);
    setShowAddModal(false);
    resetForm();
    Alert.alert('Success', 'Exam scheduled successfully');
  };

  const handleEditExam = () => {
    if (!formData.subject || !formData.topic || !formData.date || !formData.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const updatedExam = {
      ...editingExam,
      ...formData,
      duration: parseInt(formData.duration),
      totalMarks: parseInt(formData.totalMarks),
      syllabus: formData.syllabus.split(',').map(s => s.trim()).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };

    setExams(exams.map(e => e.id === editingExam.id ? updatedExam : e));
    setEditingExam(null);
    resetForm();
    Alert.alert('Success', 'Exam updated successfully');
  };

  const handleDeleteExam = (examId: string) => {
    Alert.alert(
      'Delete Exam',
      'Are you sure you want to delete this exam?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setExams(exams.filter(e => e.id !== examId));
            Alert.alert('Success', 'Exam deleted successfully');
          }
        }
      ]
    );
  };

  const openEditModal = (exam: any) => {
    setEditingExam(exam);
    setFormData({
      subject: exam.subject,
      topic: exam.topic,
      date: exam.date,
      time: exam.time,
      duration: exam.duration.toString(),
      totalMarks: exam.totalMarks.toString(),
      location: exam.location,
      type: exam.type,
      syllabus: exam.syllabus.join(', '),
      instructions: exam.instructions || '',
    });
  };

  const ExamForm = () => (
    <ScrollView style={styles.formContainer}>
      <Text style={styles.formTitle}>
        {editingExam ? 'Edit Exam' : 'Schedule New Exam'}
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
          placeholder="Enter exam topic"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Exam Type</Text>
        <View style={styles.pickerContainer}>
          {examTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.pickerOption,
                formData.type === type && styles.pickerOptionActive
              ]}
              onPress={() => setFormData({...formData, type})}>
              <Text style={[
                styles.pickerOptionText,
                formData.type === type && styles.pickerOptionTextActive
              ]}>
                {type}
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
            placeholder="10:00 AM - 12:00 PM"
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
            placeholder="120"
            keyboardType="numeric"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.formLabel}>Total Marks</Text>
          <TextInput
            style={styles.textInput}
            value={formData.totalMarks}
            onChangeText={(text) => setFormData({...formData, totalMarks: text})}
            placeholder="100"
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
          placeholder="Hall A"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Syllabus (comma separated)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.syllabus}
          onChangeText={(text) => setFormData({...formData, syllabus: text})}
          placeholder="Topic 1, Topic 2, Topic 3"
          multiline
          numberOfLines={3}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Instructions</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.instructions}
          onChangeText={(text) => setFormData({...formData, instructions: text})}
          placeholder="Enter exam instructions"
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
            setEditingExam(null);
            resetForm();
          }}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={editingExam ? handleEditExam : handleAddExam}>
          <Text style={styles.saveButtonText}>
            {editingExam ? 'Update' : 'Schedule'} Exam
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const ExamDetails = ({ exam }: { exam: any }) => (
    <ScrollView style={styles.detailsContainer}>
      <View style={styles.detailsHeader}>
        <Text style={styles.detailsTitle}>{exam.topic}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusBgColor(exam.status) }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(exam.status) }
          ]}>
            {exam.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsSectionTitle}>Exam Information</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Subject</Text>
            <Text style={styles.detailValue}>{exam.subject}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Type</Text>
            <View style={styles.typeContainer}>
              <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(exam.type)}15` }]}>
                <Text style={[styles.typeText, { color: getTypeColor(exam.type) }]}>
                  {exam.type}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Calendar size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{exam.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{exam.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{exam.duration} minutes</Text>
          </View>
          <View style={styles.detailItem}>
            <Target size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Total Marks</Text>
            <Text style={styles.detailValue}>{exam.totalMarks}</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={16} color="#64748B" />
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{exam.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Students</Text>
            <Text style={styles.detailValue}>{exam.students.length} enrolled</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.detailsSectionTitle}>Syllabus</Text>
        <View style={styles.syllabusContainer}>
          {exam.syllabus.map((topic: string, index: number) => (
            <View key={index} style={styles.syllabusChip}>
              <Text style={styles.syllabusText}>{topic}</Text>
            </View>
          ))}
        </View>
      </View>

      {exam.instructions && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>{exam.instructions}</Text>
        </View>
      )}

      {exam.results && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Results</Text>
          <View style={styles.resultsContainer}>
            {exam.results.map((result: any, index: number) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.studentId}>Student {result.studentId}</Text>
                  <View style={styles.gradeContainer}>
                    <Text style={styles.gradeText}>{result.grade}</Text>
                  </View>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>
                    {result.marksObtained}/{exam.totalMarks}
                  </Text>
                  <Text style={styles.percentageText}>
                    {Math.round((result.marksObtained / exam.totalMarks) * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.detailsActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setSelectedExam(null);
            openEditModal(exam);
          }}>
          <Edit size={16} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Exam</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            setSelectedExam(null);
            handleDeleteExam(exam.id);
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
        <Text style={styles.headerTitle}>Exams Management</Text>
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
        <View style={styles.examsContainer}>
          {filteredExams.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              style={styles.examCard}
              onPress={() => setSelectedExam(exam)}>
              <View style={styles.examHeader}>
                <View style={styles.examInfo}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(exam.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(exam.status) }
                    ]}>
                      {exam.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(exam.type)}15` }]}>
                    <Text style={[styles.typeText, { color: getTypeColor(exam.type) }]}>
                      {exam.type}
                    </Text>
                  </View>
                </View>
                <View style={styles.examActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      openEditModal(exam);
                    }}>
                    <Edit size={16} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteExam(exam.id);
                    }}>
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.examSubject}>{exam.subject}</Text>
              <Text style={styles.examTitle}>{exam.topic}</Text>

              <View style={styles.examDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={14} color="#64748B" />
                  <Text style={styles.detailText}>{exam.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={14} color="#64748B" />
                  <Text style={styles.detailText}>{exam.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={14} color="#64748B" />
                  <Text style={styles.detailText}>{exam.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Target size={14} color="#64748B" />
                  <Text style={styles.detailText}>{exam.totalMarks} marks</Text>
                </View>
              </View>

              {exam.results && (
                <View style={styles.resultsPreview}>
                  <Award size={16} color="#059669" />
                  <Text style={styles.resultsText}>
                    Results available • {exam.results.length} students
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal || !!editingExam}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <ExamForm />
        </SafeAreaView>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={!!selectedExam}
        animationType="slide"
        presentationStyle="pageSheet">
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  examSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
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
});