import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
  MessageCircle,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Send,
} from 'lucide-react-native';

interface Question {
  id: string;
  studentName: string;
  studentId: string;
  subject: string;
  title: string;
  content: string;
  timestamp: string;
  status: 'pending' | 'answered' | 'follow-up';
  priority: 'low' | 'medium' | 'high';
  category: 'concept' | 'homework' | 'exam' | 'general';
  hasAttachment: boolean;
  answer?: string;
  answerTimestamp?: string;
}

export default function TeacherQnAScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockQuestions: Question[] = [
      {
        id: '1',
        studentName: 'Arjun Sharma',
        studentId: 'BS2027001',
        subject: 'Chemistry',
        title: 'Doubt about Alcohol Reactions',
        content:
          'Sir, I am confused about the reaction mechanism of alcohols with HCl. Can you please explain the SN1 vs SN2 mechanism for primary, secondary, and tertiary alcohols?',
        timestamp: '2025-07-03T14:30:00Z',
        status: 'pending',
        priority: 'medium',
        category: 'concept',
        hasAttachment: false,
      },
      {
        id: '2',
        studentName: 'Priya Patel',
        studentId: 'BS2027002',
        subject: 'Mathematics',
        title: 'Integration by Parts Problem',
        content:
          'I am stuck on question 15 from exercise 7.2. The integration of x²e^x. I tried integration by parts but getting different answer than the book.',
        timestamp: '2025-07-03T11:15:00Z',
        status: 'answered',
        priority: 'low',
        category: 'homework',
        hasAttachment: true,
        answer:
          'For ∫x²e^x dx, you need to apply integration by parts twice. Let me break it down step by step...',
        answerTimestamp: '2025-07-03T12:00:00Z',
      },
      {
        id: '3',
        studentName: 'Rahul Kumar',
        studentId: 'BS2027003',
        subject: 'Physics',
        title: 'Electromagnetic Induction - Urgent',
        content:
          "Sir, I have exam tomorrow and I'm not understanding Lenz's law direction. How do we determine the direction of induced current? Please help urgently!",
        timestamp: '2025-07-03T16:45:00Z',
        status: 'pending',
        priority: 'high',
        category: 'exam',
        hasAttachment: false,
      },
      {
        id: '4',
        studentName: 'Sneha Desai',
        studentId: 'BS2027004',
        subject: 'Chemistry',
        title: 'Follow-up on Benzene Structure',
        content:
          "Thank you for the previous explanation. I understand resonance now, but can you explain why benzene doesn't show typical alkene reactions?",
        timestamp: '2025-07-03T10:20:00Z',
        status: 'follow-up',
        priority: 'low',
        category: 'concept',
        hasAttachment: false,
      },
      {
        id: '5',
        studentName: 'Arjun Sharma',
        studentId: 'BS2027001',
        subject: 'General',
        title: 'Study Schedule Advice',
        content:
          "Sir, with board exams approaching, can you suggest an effective study schedule for PCM subjects? I'm feeling overwhelmed with the syllabus.",
        timestamp: '2025-07-02T19:30:00Z',
        status: 'answered',
        priority: 'medium',
        category: 'general',
        hasAttachment: false,
        answer:
          "Here's a balanced study schedule: Morning 6-8 AM for Math (fresh mind), 9-11 AM Physics, 4-6 PM Chemistry. Take 15-min breaks every hour...",
        answerTimestamp: '2025-07-02T20:15:00Z',
      },
    ];
    setQuestions(mockQuestions);
  }, []);

  const filters = ['All', 'Pending', 'Answered', 'Follow-up', 'High Priority'];

  const filteredQuestions =
    selectedFilter === 'All'
      ? questions
      : selectedFilter === 'High Priority'
      ? questions.filter((q) => q.priority === 'high')
      : questions.filter(
          (q) => q.status === selectedFilter.toLowerCase().replace('-', '-')
        );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#F59E0B" />;
      case 'answered':
        return <CheckCircle size={16} color="#10B981" />;
      case 'follow-up':
        return <AlertCircle size={16} color="#3B82F6" />;
      default:
        return <HelpCircle size={16} color="#6B7280" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'concept':
        return <BookOpen size={16} color="#7C3AED" />;
      case 'homework':
        return <MessageCircle size={16} color="#10B981" />;
      case 'exam':
        return <AlertCircle size={16} color="#EF4444" />;
      case 'general':
        return <HelpCircle size={16} color="#6B7280" />;
      default:
        return <MessageCircle size={16} color="#6B7280" />;
    }
  };

  const handleAnswerQuestion = (question: Question) => {
    if (question.status === 'answered') {
      // Show the full conversation
      Alert.alert(
        'View Conversation',
        `Q: ${question.content}\n\nA: ${question.answer}`,
        [
          { text: 'Close' },
          {
            text: 'Add Follow-up',
            onPress: () => console.log('Add follow-up'),
          },
        ]
      );
    } else {
      // Navigate to answer screen or show answer input
      Alert.alert('Answer Question', 'This would open the answer interface', [
        { text: 'Cancel' },
        { text: 'Quick Reply', onPress: () => console.log('Quick reply') },
        {
          text: 'Detailed Answer',
          onPress: () => console.log('Detailed answer'),
        },
      ]);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const renderQuestion = ({ item }: { item: Question }) => (
    <TouchableOpacity
      style={[
        styles.questionCard,
        item.priority === 'high' && styles.highPriorityCard,
      ]}
      onPress={() => handleAnswerQuestion(item)}
    >
      <View style={styles.questionHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <Text style={styles.questionSubject}>
            {item.subject} • {item.studentId}
          </Text>
        </View>
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority) },
            ]}
          >
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
          <View style={styles.statusContainer}>
            {getStatusIcon(item.status)}
            <Text
              style={[
                styles.statusText,
                { color: item.status === 'pending' ? '#F59E0B' : '#10B981' },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.questionContent}>
        <View style={styles.titleRow}>
          {getCategoryIcon(item.category)}
          <Text style={styles.questionTitle}>{item.title}</Text>
          {item.hasAttachment && (
            <Text style={styles.attachmentIndicator}>📎</Text>
          )}
        </View>
        <Text style={styles.questionText} numberOfLines={3}>
          {item.content}
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>

      {item.status === 'answered' && item.answer && (
        <View style={styles.answerPreview}>
          <Text style={styles.answerLabel}>Your Answer:</Text>
          <Text style={styles.answerText} numberOfLines={2}>
            {item.answer}
          </Text>
        </View>
      )}

      <View style={styles.questionActions}>
        {item.status === 'pending' && (
          <Text style={styles.actionHint}>Tap to answer this question</Text>
        )}
        {item.status === 'answered' && (
          <Text style={[styles.actionHint, { color: '#10B981' }]}>
            Tap to view full conversation
          </Text>
        )}
        {item.status === 'follow-up' && (
          <Text style={[styles.actionHint, { color: '#3B82F6' }]}>
            Tap to continue conversation
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!user || user.role !== 'teacher') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Q&A</Text>
        <Text style={styles.subtitle}>Answer student questions and doubts</Text>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.statusFilter,
                selectedFilter === filter && styles.statusFilterActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  selectedFilter === filter && styles.statusFilterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Clock size={20} color="#F59E0B" />
          <Text style={styles.statNumber}>
            {questions.filter((q) => q.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <AlertCircle size={20} color="#EF4444" />
          <Text style={styles.statNumber}>
            {questions.filter((q) => q.priority === 'high').length}
          </Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
        <View style={styles.statCard}>
          <CheckCircle size={20} color="#10B981" />
          <Text style={styles.statNumber}>
            {questions.filter((q) => q.status === 'answered').length}
          </Text>
          <Text style={styles.statLabel}>Answered</Text>
        </View>
      </View>

      {/* Questions List */}
      <FlatList
        data={filteredQuestions}
        renderItem={renderQuestion}
        keyExtractor={(item) => item.id}
        style={styles.questionsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  filterContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusFilterActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  statusFilterText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  questionsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionCard: {
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
  highPriorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  questionSubject: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  badgeContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  questionContent: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  attachmentIndicator: {
    fontSize: 16,
  },
  questionText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
  },
  answerPreview: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    color: '#047857',
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  questionActions: {
    alignItems: 'center',
  },
  actionHint: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
});
