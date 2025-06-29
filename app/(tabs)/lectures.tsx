import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Clock, MapPin, Play, FileText, Users } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { lecturesService } from '@/services/lectures';
import { isDemoMode } from '@/lib/supabase';

const hscSubjects = [
  'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi',
  'Marathi', 'History', 'Geography', 'Economics', 'Political Science',
  'Psychology', 'Sociology', 'Philosophy', 'Logic', 'Statistics',
  'Geology', 'Environmental Science', 'Computer Science', 'Electronics',
  'Biotechnology', 'Information Technology', 'Agriculture', 'Home Science',
  'Defence Studies', 'Physical Education', 'Art'
];

// Mock data for demo mode
const mockLectureData = [
  {
    id: 1,
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    teacher: 'Dr. Rajesh Kumar',
    date: '2025-01-20',
    time: '10:00 AM - 11:30 AM',
    location: 'Room A-101',
    status: 'upcoming',
    materials: 3,
    attendees: 45,
    description: 'Understanding Faraday\'s law and its applications in real-world scenarios.',
    notesCount: 5,
    questionsCount: 3,
  },
  {
    id: 2,
    subject: 'Chemistry',
    topic: 'Organic Compounds - Alcohols',
    teacher: 'Prof. Meera Patel',
    date: '2025-01-20',
    time: '2:00 PM - 3:30 PM',
    location: 'Room B-205',
    status: 'upcoming',
    materials: 5,
    attendees: 38,
    description: 'Classification, properties, and reactions of alcohols with practical examples.',
    notesCount: 2,
    questionsCount: 1,
  },
  {
    id: 3,
    subject: 'Mathematics',
    topic: 'Calculus - Derivatives',
    teacher: 'Mr. Amit Shah',
    date: '2025-01-21',
    time: '9:00 AM - 10:30 AM',
    location: 'Room A-203',
    status: 'scheduled',
    materials: 4,
    attendees: 52,
    description: 'Advanced derivative techniques and their applications in optimization problems.',
    notesCount: 8,
    questionsCount: 6,
  },
  {
    id: 4,
    subject: 'Biology',
    topic: 'Human Reproduction System',
    teacher: 'Dr. Priya Sharma',
    date: '2025-01-19',
    time: '11:00 AM - 12:30 PM',
    location: 'Room C-101',
    status: 'completed',
    materials: 6,
    attendees: 41,
    description: 'Detailed study of male and female reproductive systems with diagrams.',
    notesCount: 12,
    questionsCount: 9,
  },
];

const filterOptions = ['All', 'Today', 'Tomorrow', 'This Week', 'Completed'];

export default function LecturesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadLectures();
  }, []);

  const loadLectures = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemoMode()) {
        // Use mock data in demo mode
        setLectures(mockLectureData);
      } else {
        // Load from database
        const data = await lecturesService.getLectures();
        const formattedLectures = data.map((lecture: any) => ({
          id: lecture.id,
          subject: lecture.subjects?.name || 'Unknown Subject',
          topic: lecture.topic,
          teacher: lecture.profiles?.name || 'Unknown Teacher',
          date: lecture.scheduled_date,
          time: `${lecture.start_time} - ${lecture.end_time}`,
          location: lecture.location || 'TBD',
          status: lecture.status,
          materials: lecture.lecture_materials?.length || 0,
          attendees: 0, // This would need to be calculated from attendance
          description: lecture.description || '',
          notesCount: 0, // This would need to be calculated
          questionsCount: 0, // This would need to be calculated
        }));
        setLectures(formattedLectures);
      }
    } catch (err) {
      console.error('Error loading lectures:', err);
      setError('Failed to load lectures. Please try again.');
      // Fallback to mock data on error
      setLectures(mockLectureData);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#2563EB';
      case 'scheduled':
        return '#059669';
      case 'completed':
        return '#64748B';
      default:
        return '#64748B';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#EFF6FF';
      case 'scheduled':
        return '#ECFDF5';
      case 'completed':
        return '#F1F5F9';
      default:
        return '#F1F5F9';
    }
  };

  const handleLecturePress = (lectureId: number) => {
    router.push(`/(tabs)/lectures/${lectureId}`);
  };

  const filteredLectures = lectures.filter(lecture => {
    const matchesSearch = lecture.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lecture.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lecture.teacher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || lecture.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading lectures...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lecture Plan</Text>
        <Text style={styles.headerSubtitle}>HSC 2027 Batch</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLectures}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search lectures, topics, or teachers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterContainer}>
            {filterOptions.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive
                ]}
                onPress={() => setSelectedFilter(filter)}>
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Subject Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.subjectContainer}>
              <TouchableOpacity
                style={[
                  styles.subjectChip,
                  selectedSubject === 'All' && styles.subjectChipActive
                ]}
                onPress={() => setSelectedSubject('All')}>
                <Text style={[
                  styles.subjectText,
                  selectedSubject === 'All' && styles.subjectTextActive
                ]}>
                  All Subjects
                </Text>
              </TouchableOpacity>
              {hscSubjects.slice(0, 8).map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.subjectChip,
                    selectedSubject === subject && styles.subjectChipActive
                  ]}
                  onPress={() => setSelectedSubject(subject)}>
                  <Text style={[
                    styles.subjectText,
                    selectedSubject === subject && styles.subjectTextActive
                  ]}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lecture Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lectures</Text>
          {filteredLectures.map((lecture) => (
            <TouchableOpacity 
              key={lecture.id} 
              style={styles.lectureCard}
              onPress={() => handleLecturePress(lecture.id)}>
              <View style={styles.cardHeader}>
                <View style={styles.subjectInfo}>
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
                  <Text style={styles.subjectName}>{lecture.subject}</Text>
                </View>
                <View style={styles.cardActions}>
                  {lecture.status !== 'completed' && (
                    <TouchableOpacity style={styles.actionButton}>
                      <Play size={16} color="#2563EB" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={styles.lectureTopic}>{lecture.topic}</Text>
              <Text style={styles.teacherName}>by {lecture.teacher}</Text>
              <Text style={styles.lectureDescription}>{lecture.description}</Text>

              <View style={styles.lectureDetails}>
                <View style={styles.detailItem}>
                  <Clock size={16} color="#64748B" />
                  <Text style={styles.detailText}>{lecture.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MapPin size={16} color="#64748B" />
                  <Text style={styles.detailText}>{lecture.location}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <FileText size={14} color="#64748B" />
                    <Text style={styles.statText}>{lecture.notesCount} Notes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Users size={14} color="#64748B" />
                    <Text style={styles.statText}>{lecture.attendees} Students</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statText}>{lecture.questionsCount} Q&A</Text>
                  </View>
                </View>
                <Text style={styles.lectureDate}>
                  {new Date(lecture.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
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
  searchSection: {
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
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterScroll: {
    paddingLeft: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  subjectContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  subjectChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subjectChipActive: {
    backgroundColor: '#059669',
  },
  subjectText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Medium',
  },
  subjectTextActive: {
    color: '#FFFFFF',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectInfo: {
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
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lectureTopic: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  lectureDescription: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  lectureDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statsContainer: {
    flexDirection: 'row',
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
    fontFamily: 'Inter-Regular',
  },
  lectureDate: {
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
});