import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, Target, Award, BookOpen, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Users } from 'lucide-react-native';

// Mock exam data - in production this would come from an API
const mockExam = {
  id: '1',
  subject: 'Physics',
  topic: 'Electromagnetic Waves',
  date: '2025-01-25',
  time: '10:00 AM - 12:00 PM',
  duration: 120,
  totalMarks: 100,
  location: 'Hall A',
  type: 'Unit Test',
  status: 'upcoming',
  syllabus: ['Wave equation', 'EM spectrum', 'Properties of EM waves', 'Applications in technology'],
  instructions: [
    'Bring calculator and drawing instruments',
    'No mobile phones allowed in the examination hall',
    'Read all questions carefully before answering',
    'Attempt all questions as they carry equal marks',
    'Show all working clearly for numerical problems'
  ],
  examiner: 'Dr. Rajesh Kumar',
  totalStudents: 45,
  description: 'This unit test will cover electromagnetic waves, their properties, and applications. Focus on mathematical derivations and practical applications.',
  preparationTips: [
    'Review wave equations and their derivations',
    'Practice numerical problems from the textbook',
    'Understand the electromagnetic spectrum thoroughly',
    'Study real-world applications of EM waves'
  ],
  result: {
    marksObtained: 85,
    grade: 'A',
    percentage: 85,
    rank: 5,
    totalStudents: 45,
    feedback: 'Excellent understanding of wave concepts. Work on numerical problem-solving speed.',
    sectionWise: [
      { section: 'Theory', marks: 40, total: 50, percentage: 80 },
      { section: 'Numerical', marks: 45, total: 50, percentage: 90 }
    ]
  }
};

export default function ExamDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'details' | 'syllabus' | 'results'>('details');

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return Clock;
      case 'ongoing': return AlertCircle;
      case 'completed': return CheckCircle;
      default: return Clock;
    }
  };

  const StatusIcon = getStatusIcon(mockExam.status);

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'syllabus', label: 'Syllabus' },
    { id: 'results', label: 'Results' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mockExam.topic}</Text>
      </View>

      {/* Exam Header Card */}
      <View style={styles.examHeaderCard}>
        <View style={styles.examHeaderTop}>
          <View style={styles.examInfo}>
            <Text style={styles.subject}>{mockExam.subject}</Text>
            <Text style={styles.topic}>{mockExam.topic}</Text>
            <Text style={styles.examType}>{mockExam.type}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusBgColor(mockExam.status) }
          ]}>
            <StatusIcon size={16} color={getStatusColor(mockExam.status)} />
            <Text style={[
              styles.statusText,
              { color: getStatusColor(mockExam.status) }
            ]}>
              {mockExam.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.examStats}>
          <View style={styles.statItem}>
            <Calendar size={16} color="#64748B" />
            <Text style={styles.statText}>{mockExam.date}</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={16} color="#64748B" />
            <Text style={styles.statText}>{mockExam.time}</Text>
          </View>
          <View style={styles.statItem}>
            <Target size={16} color="#64748B" />
            <Text style={styles.statText}>{mockExam.totalMarks} marks</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id as any)}>
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'details' && (
          <View style={styles.detailsSection}>
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Exam Information</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <MapPin size={16} color="#64748B" />
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{mockExam.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Clock size={16} color="#64748B" />
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{mockExam.duration} minutes</Text>
                </View>
                <View style={styles.detailItem}>
                  <BookOpen size={16} color="#64748B" />
                  <Text style={styles.detailLabel}>Examiner</Text>
                  <Text style={styles.detailValue}>{mockExam.examiner}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Users size={16} color="#64748B" />
                  <Text style={styles.detailLabel}>Students</Text>
                  <Text style={styles.detailValue}>{mockExam.totalStudents}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{mockExam.description}</Text>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Exam Instructions</Text>
              {mockExam.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionBullet} />
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Preparation Tips</Text>
              {mockExam.preparationTips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <CheckCircle size={16} color="#059669" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'syllabus' && (
          <View style={styles.syllabusSection}>
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Syllabus Coverage</Text>
              <Text style={styles.syllabusDescription}>
                This exam will cover the following topics. Make sure to study all areas thoroughly.
              </Text>
              <View style={styles.syllabusContainer}>
                {mockExam.syllabus.map((topic, index) => (
                  <View key={index} style={styles.syllabusItem}>
                    <View style={styles.syllabusNumber}>
                      <Text style={styles.syllabusNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.syllabusText}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'results' && (
          <View style={styles.resultsSection}>
            {mockExam.status === 'completed' && mockExam.result ? (
              <>
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Award size={24} color="#059669" />
                    <Text style={styles.resultTitle}>Your Result</Text>
                  </View>
                  
                  <View style={styles.resultStats}>
                    <View style={styles.resultStatItem}>
                      <Text style={styles.resultStatValue}>{mockExam.result.marksObtained}</Text>
                      <Text style={styles.resultStatLabel}>Marks Obtained</Text>
                    </View>
                    <View style={styles.resultStatItem}>
                      <Text style={styles.resultStatValue}>{mockExam.result.percentage}%</Text>
                      <Text style={styles.resultStatLabel}>Percentage</Text>
                    </View>
                    <View style={styles.resultStatItem}>
                      <Text style={styles.resultStatValue}>{mockExam.result.grade}</Text>
                      <Text style={styles.resultStatLabel}>Grade</Text>
                    </View>
                    <View style={styles.resultStatItem}>
                      <Text style={styles.resultStatValue}>#{mockExam.result.rank}</Text>
                      <Text style={styles.resultStatLabel}>Rank</Text>
                    </View>
                  </View>

                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${mockExam.result.percentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {mockExam.result.marksObtained} out of {mockExam.totalMarks} marks
                  </Text>
                </View>

                <View style={styles.detailsCard}>
                  <Text style={styles.sectionTitle}>Section-wise Performance</Text>
                  {mockExam.result.sectionWise.map((section, index) => (
                    <View key={index} style={styles.sectionPerformance}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionName}>{section.section}</Text>
                        <Text style={styles.sectionScore}>
                          {section.marks}/{section.total}
                        </Text>
                      </View>
                      <View style={styles.sectionProgressBar}>
                        <View 
                          style={[
                            styles.sectionProgressFill, 
                            { width: `${section.percentage}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.sectionPercentage}>{section.percentage}%</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.detailsCard}>
                  <Text style={styles.sectionTitle}>Teacher's Feedback</Text>
                  <Text style={styles.feedback}>{mockExam.result.feedback}</Text>
                </View>
              </>
            ) : (
              <View style={styles.noResultsCard}>
                <AlertCircle size={48} color="#64748B" />
                <Text style={styles.noResultsTitle}>Results Not Available</Text>
                <Text style={styles.noResultsText}>
                  {mockExam.status === 'upcoming' 
                    ? 'Results will be available after the exam is completed.'
                    : 'Results are being processed and will be available soon.'
                  }
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  examHeaderCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  examHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  examInfo: {
    flex: 1,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  topic: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  examType: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  examStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailsCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
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
  description: {
    fontSize: 16,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
    marginTop: 8,
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginLeft: 8,
  },
  syllabusSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  syllabusDescription: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  syllabusContainer: {
    gap: 12,
  },
  syllabusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  syllabusNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  syllabusNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  syllabusText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },
  resultsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resultStatItem: {
    alignItems: 'center',
  },
  resultStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  resultStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  sectionPerformance: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  sectionScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
  sectionProgressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  sectionProgressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  sectionPercentage: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'right',
  },
  feedback: {
    fontSize: 16,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  noResultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});