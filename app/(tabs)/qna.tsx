import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, MessageCircle, ThumbsUp, ThumbsDown, User, Clock, Filter } from 'lucide-react-native';
import { useState } from 'react';

const qnaData = [
  {
    id: 1,
    subject: 'Physics',
    lecture: 'Electromagnetic Induction',
    question: 'Can someone explain the difference between motional EMF and induced EMF? I\'m getting confused between these two concepts.',
    author: 'Priya Sharma',
    authorAvatar: 'PS',
    timestamp: '2 hours ago',
    upvotes: 12,
    downvotes: 1,
    answers: 5,
    tags: ['EMF', 'Electromagnetic Induction', 'Faraday\'s Law'],
    isAnswered: true,
    topAnswer: {
      id: 101,
      author: 'Dr. Rajesh Kumar',
      authorRole: 'Teacher',
      content: 'Great question! Motional EMF occurs when a conductor moves through a magnetic field, while induced EMF is generated when the magnetic flux through a conductor changes. Both follow Faraday\'s law but have different physical origins.',
      timestamp: '1 hour ago',
      upvotes: 15,
    }
  },
  {
    id: 2,
    subject: 'Chemistry',
    lecture: 'Organic Compounds - Alcohols',
    question: 'What is the mechanism for the dehydration of alcohols? Why do tertiary alcohols dehydrate faster than primary alcohols?',
    author: 'Arjun Patel',
    authorAvatar: 'AP',
    timestamp: '4 hours ago',
    upvotes: 8,
    downvotes: 0,
    answers: 3,
    tags: ['Alcohols', 'Dehydration', 'Reaction Mechanism'],
    isAnswered: true,
  },
  {
    id: 3,
    subject: 'Mathematics',
    lecture: 'Calculus - Derivatives',
    question: 'How do I find the derivative of composite functions? The chain rule is confusing me.',
    author: 'Sneha Desai',
    authorAvatar: 'SD',
    timestamp: '6 hours ago',
    upvotes: 15,
    downvotes: 2,
    answers: 7,
    tags: ['Chain Rule', 'Derivatives', 'Composite Functions'],
    isAnswered: true,
  },
  {
    id: 4,
    subject: 'Biology',
    lecture: 'Human Reproduction System',
    question: 'What are the hormonal changes during the menstrual cycle? Can someone provide a detailed timeline?',
    author: 'Kavya Singh',
    authorAvatar: 'KS',
    timestamp: '1 day ago',
    upvotes: 20,
    downvotes: 0,
    answers: 4,
    tags: ['Hormones', 'Menstrual Cycle', 'Reproduction'],
    isAnswered: false,
  },
];

const subjectFilters = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'];
const sortOptions = ['Recent', 'Most Upvoted', 'Most Answers', 'Unanswered'];

export default function QnAScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Recent');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Q&A Forum</Text>
        <Text style={styles.headerSubtitle}>Ask questions, share knowledge</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search and Add Question */}
        <View style={styles.actionSection}>
          <View style={styles.searchBar}>
            <Search size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search questions, topics..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Subject:</Text>
              {subjectFilters.map((subject) => (
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

        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Sort by:</Text>
              {sortOptions.map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.filterChip,
                    selectedSort === sort && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedSort(sort)}>
                  <Text style={[
                    styles.filterText,
                    selectedSort === sort && styles.filterTextActive
                  ]}>
                    {sort}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Questions List */}
        <View style={styles.section}>
          {qnaData.map((question) => (
            <TouchableOpacity key={question.id} style={styles.questionCard}>
              {/* Question Header */}
              <View style={styles.questionHeader}>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectText}>{question.subject}</Text>
                </View>
                <View style={styles.lectureInfo}>
                  <Text style={styles.lectureText}>From: {question.lecture}</Text>
                </View>
              </View>

              {/* Question Content */}
              <Text style={styles.questionText}>{question.question}</Text>

              {/* Tags */}
              <View style={styles.tagsContainer}>
                {question.tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Top Answer Preview */}
              {question.topAnswer && (
                <View style={styles.topAnswerPreview}>
                  <View style={styles.answerHeader}>
                    <View style={styles.teacherBadge}>
                      <Text style={styles.teacherBadgeText}>✓ Teacher Answer</Text>
                    </View>
                  </View>
                  <Text style={styles.answerPreviewText} numberOfLines={2}>
                    {question.topAnswer.content}
                  </Text>
                  <Text style={styles.answerAuthor}>
                    by {question.topAnswer.author} • {question.topAnswer.upvotes} upvotes
                  </Text>
                </View>
              )}

              {/* Question Stats */}
              <View style={styles.questionStats}>
                <View style={styles.authorInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{question.authorAvatar}</Text>
                  </View>
                  <View style={styles.authorDetails}>
                    <Text style={styles.authorName}>{question.author}</Text>
                    <View style={styles.timestampRow}>
                      <Clock size={12} color="#94A3B8" />
                      <Text style={styles.timestamp}>{question.timestamp}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <ThumbsUp size={16} color="#059669" />
                    <Text style={styles.statText}>{question.upvotes}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <MessageCircle size={16} color="#2563EB" />
                    <Text style={styles.statText}>{question.answers}</Text>
                  </View>
                  {question.isAnswered && (
                    <View style={styles.answeredBadge}>
                      <Text style={styles.answeredText}>Answered</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                  <ThumbsUp size={16} color="#64748B" />
                  <Text style={styles.actionButtonText}>Upvote</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MessageCircle size={16} color="#64748B" />
                  <Text style={styles.actionButtonText}>Answer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ask Question CTA */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Have a Question?</Text>
            <Text style={styles.ctaText}>
              Don't hesitate to ask! Our teachers and fellow students are here to help.
            </Text>
            <TouchableOpacity style={styles.ctaButton}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>Ask a Question</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
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
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filtersSection: {
    paddingLeft: 20,
    marginBottom: 8,
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
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  questionCard: {
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
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subjectText: {
    fontSize: 12,
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
  lectureInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  lectureText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  questionText: {
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: {
    fontSize: 10,
    color: '#475569',
    fontFamily: 'Inter-Regular',
  },
  topAnswerPreview: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  answerHeader: {
    marginBottom: 8,
  },
  teacherBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  teacherBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  answerPreviewText: {
    fontSize: 14,
    color: '#065F46',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  answerAuthor: {
    fontSize: 12,
    color: '#047857',
    fontFamily: 'Inter-Medium',
    marginTop: 8,
  },
  questionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  authorDetails: {
    gap: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  answeredBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  answeredText: {
    fontSize: 10,
    color: '#059669',
    fontFamily: 'Inter-SemiBold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  ctaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
});