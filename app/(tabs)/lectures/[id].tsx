import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Upload, MessageCircle, User, Clock, MapPin, BookOpen, Send, FileText, Download, Plus } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

// Mock lecture data - in production this would come from an API
const mockLecture = {
  id: '1',
  subject: 'Physics',
  topic: 'Electromagnetic Induction',
  teacher: 'Dr. Rajesh Kumar',
  date: '2025-01-22',
  time: '10:00 AM - 11:30 AM',
  location: 'Room A-101',
  description: 'Understanding Faraday\'s law and its applications in real-world scenarios. We will cover the mathematical derivation and practical applications.',
  materials: ['Textbook Chapter 12', 'Lab Manual', 'Practice Problems'],
  notes: [
    {
      id: '1',
      title: 'Faraday\'s Law Notes',
      uploadedBy: 'Arjun Sharma',
      uploadedAt: '2025-01-22T11:45:00Z',
      fileType: 'PDF',
      size: '2.3 MB'
    },
    {
      id: '2',
      title: 'EM Induction Diagrams',
      uploadedBy: 'Priya Patel',
      uploadedAt: '2025-01-22T12:15:00Z',
      fileType: 'PDF',
      size: '1.8 MB'
    }
  ],
  questions: [
    {
      id: '1',
      question: 'Can someone explain the difference between motional EMF and induced EMF?',
      askedBy: 'Arjun Sharma',
      askedAt: '2025-01-22T14:30:00Z',
      answers: [
        {
          id: '1',
          answer: 'Motional EMF occurs when a conductor moves through a magnetic field, while induced EMF is generated when the magnetic flux through a conductor changes.',
          answeredBy: 'Dr. Rajesh Kumar',
          answeredAt: '2025-01-22T15:00:00Z',
          isTeacher: true
        }
      ]
    }
  ]
};

export default function LectureDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'questions'>('overview');
  const [newQuestion, setNewQuestion] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [noteTitle, setNoteTitle] = useState('');

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleUploadNote = () => {
    if (!uploadedFile || !noteTitle) {
      Alert.alert('Error', 'Please select a file and enter a title');
      return;
    }

    // In production, upload to server
    Alert.alert('Success', 'Note uploaded successfully!');
    setShowUploadModal(false);
    setUploadedFile(null);
    setNoteTitle('');
  };

  const handleAskQuestion = () => {
    if (!newQuestion.trim()) {
      Alert.alert('Error', 'Please enter your question');
      return;
    }

    // In production, send to server
    Alert.alert('Success', 'Question posted successfully!');
    setNewQuestion('');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'questions', label: 'Q&A', icon: MessageCircle },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mockLecture.topic}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id as any)}>
            <tab.icon size={20} color={activeTab === tab.id ? '#2563EB' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <View style={styles.overviewSection}>
            <View style={styles.lectureCard}>
              <Text style={styles.subject}>{mockLecture.subject}</Text>
              <Text style={styles.topic}>{mockLecture.topic}</Text>
              
              <View style={styles.lectureDetails}>
                <View style={styles.detailRow}>
                  <User size={16} color="#64748B" />
                  <Text style={styles.detailText}>Teacher: {mockLecture.teacher}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={16} color="#64748B" />
                  <Text style={styles.detailText}>{mockLecture.date} • {mockLecture.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={16} color="#64748B" />
                  <Text style={styles.detailText}>{mockLecture.location}</Text>
                </View>
              </View>

              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.description}>{mockLecture.description}</Text>

              <Text style={styles.materialsTitle}>Required Materials</Text>
              <View style={styles.materialsContainer}>
                {mockLecture.materials.map((material, index) => (
                  <View key={index} style={styles.materialChip}>
                    <Text style={styles.materialText}>{material}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'notes' && (
          <View style={styles.notesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Class Notes</Text>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => setShowUploadModal(true)}>
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
            </View>

            {mockLecture.notes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <FileText size={20} color="#2563EB" />
                  <View style={styles.noteInfo}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <Text style={styles.noteDetails}>
                      by {note.uploadedBy} • {new Date(note.uploadedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.downloadButton}>
                    <Download size={16} color="#2563EB" />
                  </TouchableOpacity>
                </View>
                <View style={styles.noteFooter}>
                  <Text style={styles.fileType}>{note.fileType}</Text>
                  <Text style={styles.fileSize}>{note.size}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'questions' && (
          <View style={styles.questionsSection}>
            <View style={styles.askQuestionCard}>
              <Text style={styles.askTitle}>Ask a Question</Text>
              <TextInput
                style={styles.questionInput}
                placeholder="Type your question about this lecture..."
                value={newQuestion}
                onChangeText={setNewQuestion}
                multiline
                numberOfLines={3}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity style={styles.askButton} onPress={handleAskQuestion}>
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.askButtonText}>Ask Question</Text>
              </TouchableOpacity>
            </View>

            {mockLecture.questions.map((q) => (
              <View key={q.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {q.askedBy.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.questionInfo}>
                    <Text style={styles.questionAuthor}>{q.askedBy}</Text>
                    <Text style={styles.questionTime}>
                      {new Date(q.askedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.questionText}>{q.question}</Text>
                
                {q.answers.map((answer) => (
                  <View key={answer.id} style={styles.answerCard}>
                    <View style={styles.answerHeader}>
                      <View style={[styles.avatar, answer.isTeacher && styles.teacherAvatar]}>
                        <Text style={styles.avatarText}>
                          {answer.answeredBy.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <View style={styles.answerInfo}>
                        <View style={styles.answerAuthorRow}>
                          <Text style={styles.answerAuthor}>{answer.answeredBy}</Text>
                          {answer.isTeacher && (
                            <View style={styles.teacherBadge}>
                              <Text style={styles.teacherBadgeText}>Teacher</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.answerTime}>
                          {new Date(answer.answeredAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.answerText}>{answer.answer}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUploadModal(false)}>
              <ArrowLeft size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Upload Notes</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.uploadForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Note Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter a title for your notes"
                value={noteTitle}
                onChangeText={setNoteTitle}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>File</Text>
              <TouchableOpacity style={styles.filePickerButton} onPress={handleFileUpload}>
                <Upload size={20} color="#2563EB" />
                <Text style={styles.filePickerText}>
                  {uploadedFile ? uploadedFile.name : 'Choose File'}
                </Text>
              </TouchableOpacity>
              {uploadedFile && (
                <Text style={styles.fileInfo}>
                  {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.uploadSubmitButton} onPress={handleUploadNote}>
              <Text style={styles.uploadSubmitText}>Upload Notes</Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overviewSection: {
    padding: 20,
  },
  lectureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  topic: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
  },
  lectureDetails: {
    gap: 12,
    marginBottom: 20,
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
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: 20,
  },
  materialsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
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
  notesSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  noteCard: {
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
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteInfo: {
    flex: 1,
    marginLeft: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  noteDetails: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  downloadButton: {
    padding: 8,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileType: {
    fontSize: 12,
    color: '#2563EB',
    fontFamily: 'Inter-Medium',
  },
  fileSize: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  questionsSection: {
    padding: 20,
  },
  askQuestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  askTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  questionInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Regular',
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 80,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  askButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  questionCard: {
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
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teacherAvatar: {
    backgroundColor: '#059669',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  questionInfo: {
    flex: 1,
  },
  questionAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  questionTime: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  questionText: {
    fontSize: 16,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: 16,
  },
  answerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerInfo: {
    flex: 1,
  },
  answerAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  teacherBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  teacherBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  answerTime: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  answerText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
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
  uploadForm: {
    padding: 20,
  },
  formGroup: {
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
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filePickerText: {
    fontSize: 16,
    color: '#2563EB',
    fontFamily: 'Inter-Medium',
  },
  fileInfo: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  uploadSubmitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  uploadSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
});