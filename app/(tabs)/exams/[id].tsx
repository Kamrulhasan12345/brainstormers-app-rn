import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { examManagementService } from '../../../services/exam-management';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
} from 'lucide-react-native';

export default function ExamDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReviews, setUserReviews] = useState<any[]>([]);

  useEffect(() => {
    loadExamDetails();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading exam details for ID:', id);

      const examData = await examManagementService.getExamById(id as string);
      console.log('Exam data loaded:', examData);

      const batches = await examManagementService.getExamBatches(id as string);
      console.log('Batches loaded:', batches);

      // Get attendance for each batch for this user
      const batchesWithAttendance = await Promise.all(
        batches.map(async (batch) => {
          try {
            const attendances = await examManagementService.getExamAttendances(
              batch.id
            );
            const userAttendance = attendances.find(
              (att) => att.student_id === user?.id
            );
            console.log(`Batch ${batch.id} attendance:`, userAttendance);
            return {
              ...batch,
              attendance: userAttendance || null,
            };
          } catch (err) {
            console.error(
              `Error getting attendance for batch ${batch.id}:`,
              err
            );
            return {
              ...batch,
              attendance: null,
            };
          }
        })
      );

      // Load user's reviews for this exam
      const reviews = await loadUserReviews();

      const finalExam = {
        ...examData,
        batches: batchesWithAttendance,
      };

      console.log('Final exam data:', finalExam);
      setExam(finalExam);
      setUserReviews(reviews);
    } catch (err) {
      console.error('Error loading exam details:', err);
      setError(
        `Failed to load exam details: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUserReviews = async () => {
    try {
      // Get all reviews for this exam by this user
      const reviews = await examManagementService.getExamReviews(id as string);
      const userReviews = reviews.filter(
        (review) => review.reviewer_id === user?.id
      );
      console.log('User reviews loaded:', userReviews);
      return userReviews;
    } catch (err) {
      console.error('Error loading user reviews:', err);
      return [];
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please enter a review comment');
      return;
    }

    try {
      setSubmittingReview(true);

      await examManagementService.createExamReview({
        exam_id: id as string,
        reviewer_id: user?.id || '',
        role: 'student',
        comment: reviewText.trim(),
      });

      setReviewText('');
      Alert.alert('Success', 'Review submitted successfully');
      loadExamDetails();
    } catch (err) {
      console.error('Error submitting review:', err);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getActualBatchStatus = (batch: any) => {
    const now = new Date();
    const startTime = new Date(batch.scheduled_start);
    const endTime = new Date(batch.scheduled_end);

    // If manually set to cancelled or postponed, respect that
    if (batch.status === 'cancelled' || batch.status === 'postponed') {
      return batch.status;
    }

    // If there's attendance recorded and it's marked as completed, it's completed
    if (batch.status === 'completed' || (batch.attendance && now > endTime)) {
      return 'completed';
    }

    // Time-based status determination
    if (now < startTime) {
      return 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      return 'ongoing';
    } else if (now > endTime) {
      return 'completed';
    }

    return 'scheduled';
  };

  const getBatchStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
      case 'scheduled':
        return '#2563EB';
      case 'ongoing':
        return '#F59E0B';
      case 'completed':
        return '#059669';
      case 'cancelled':
        return '#EF4444';
      case 'postponed':
        return '#EA580C';
      default:
        return '#64748B';
    }
  };

  const getBatchStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
      case 'scheduled':
        return Clock;
      case 'ongoing':
        return AlertCircle;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      case 'postponed':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#059669';
      case 'absent':
        return '#EF4444';
      case 'late':
        return '#EA580C';
      case 'excused':
        return '#6366F1';
      default:
        return '#64748B';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };
  };

  const getRelativeTimeInfo = (batch: any) => {
    const now = new Date();
    const startTime = new Date(batch.scheduled_start);
    const endTime = new Date(batch.scheduled_end);
    const actualStatus = getActualBatchStatus(batch);

    if (actualStatus === 'upcoming' || actualStatus === 'scheduled') {
      const diffMs = startTime.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      if (diffDays > 0) {
        return `Starts in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `Starts in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      } else {
        const diffMinutes = Math.floor(
          (diffMs % (1000 * 60 * 60)) / (1000 * 60)
        );
        return `Starts in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      }
    } else if (actualStatus === 'ongoing') {
      const diffMs = endTime.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours > 0) {
        return `Ends in ${diffHours} hour${
          diffHours > 1 ? 's' : ''
        } ${diffMinutes} min`;
      } else {
        return `Ends in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      }
    } else if (actualStatus === 'completed') {
      const diffMs = now.getTime() - endTime.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return `Completed ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        return `Completed ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      }
    }

    return '';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading exam details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !exam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Exam not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadExamDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam Details</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.examInfoCard}>
          <Text style={styles.examName}>{exam.name}</Text>
          <Text style={styles.examSubject}>
            {exam.course?.name || exam.subject}
          </Text>
          <Text style={styles.examTopic}>{exam.topic}</Text>

          <View style={styles.examDetails}>
            <View style={styles.detailRow}>
              <Target size={16} color="#64748B" />
              <Text style={styles.detailText}>
                Total Marks: {exam.total_marks}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Users size={16} color="#64748B" />
              <Text style={styles.detailText}>
                Course: {exam.course?.code || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exam Batches</Text>
          {exam.batches && exam.batches.length > 0 ? (
            exam.batches.map((batch: any) => {
              const actualStatus = getActualBatchStatus(batch);
              const StatusIcon = getBatchStatusIcon(actualStatus);
              const startDateTime = formatDateTime(batch.scheduled_start);
              const endDateTime = formatDateTime(batch.scheduled_end);

              return (
                <View key={batch.id} style={styles.batchCard}>
                  <View style={styles.batchHeader}>
                    <View style={styles.batchStatus}>
                      <StatusIcon
                        size={16}
                        color={getBatchStatusColor(actualStatus)}
                      />
                      <Text
                        style={[
                          styles.batchStatusText,
                          { color: getBatchStatusColor(actualStatus) },
                        ]}
                      >
                        {actualStatus.toUpperCase()}
                      </Text>
                    </View>
                    {batch.attendance && (
                      <View style={styles.quickAttendanceStatus}>
                        <View
                          style={[
                            styles.quickAttendanceBadge,
                            {
                              backgroundColor: getAttendanceStatusColor(
                                batch.attendance.status
                              ),
                            },
                          ]}
                        >
                          <Text style={styles.quickAttendanceText}>
                            {batch.attendance.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.batchDetails}>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color="#64748B" />
                      <Text style={styles.detailText}>
                        {startDateTime.date}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Clock size={16} color="#64748B" />
                      <Text style={styles.detailText}>
                        {startDateTime.time} - {endDateTime.time}
                      </Text>
                    </View>
                    <View style={styles.relativeTimeRow}>
                      <Text
                        style={[
                          styles.relativeTimeText,
                          { color: getBatchStatusColor(actualStatus) },
                        ]}
                      >
                        {getRelativeTimeInfo(batch)}
                      </Text>
                    </View>
                  </View>

                  {batch.attendance && (
                    <View style={styles.attendanceSection}>
                      <Text style={styles.attendanceTitle}>
                        Your Attendance
                      </Text>
                      <View style={styles.attendanceCard}>
                        <View style={styles.attendanceStatus}>
                          <View
                            style={[
                              styles.attendanceStatusBadge,
                              {
                                backgroundColor: getAttendanceStatusColor(
                                  batch.attendance.status
                                ),
                              },
                            ]}
                          >
                            <Text style={styles.attendanceStatusText}>
                              {batch.attendance.status.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.attendanceDate}>
                            {new Date(
                              batch.attendance.recorded_at
                            ).toLocaleDateString('en-IN')}
                          </Text>
                        </View>

                        {batch.attendance.score !== null &&
                          batch.attendance.score !== undefined && (
                            <View style={styles.scoreSection}>
                              <Text style={styles.scoreTitle}>Your Score</Text>
                              <View style={styles.scoreDisplay}>
                                <Text style={styles.scoreText}>
                                  {batch.attendance.score}/{exam.total_marks}
                                </Text>
                                <View style={styles.percentageCircle}>
                                  <Text style={styles.percentageText}>
                                    {Math.round(
                                      (batch.attendance.score /
                                        exam.total_marks) *
                                        100
                                    )}
                                    %
                                  </Text>
                                </View>
                              </View>
                            </View>
                          )}
                      </View>
                    </View>
                  )}

                  {!batch.attendance && actualStatus === 'completed' && (
                    <View style={styles.noAttendanceSection}>
                      <Text style={styles.noAttendanceText}>
                        No attendance recorded for this batch
                      </Text>
                    </View>
                  )}

                  {!batch.attendance && actualStatus === 'ongoing' && (
                    <View style={styles.ongoingSection}>
                      <View style={styles.ongoingIndicator}>
                        <Text style={styles.ongoingText}>
                          Exam is currently in progress
                        </Text>
                      </View>
                    </View>
                  )}

                  {!batch.attendance &&
                    (actualStatus === 'upcoming' ||
                      actualStatus === 'scheduled') && (
                      <View style={styles.upcomingSection}>
                        <View style={styles.upcomingIndicator}>
                          <Text style={styles.upcomingText}>
                            Exam is scheduled for the future
                          </Text>
                        </View>
                      </View>
                    )}
                </View>
              );
            })
          ) : (
            <View style={styles.noBatchesContainer}>
              <Text style={styles.noBatchesText}>
                No exam batches scheduled yet
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Reviews</Text>

          <View style={styles.addReviewCard}>
            <Text style={styles.addReviewTitle}>Add a Review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your thoughts about this exam..."
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                submittingReview && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {userReviews && userReviews.length > 0 ? (
            <View style={styles.existingReviewsSection}>
              <Text style={styles.existingReviewsTitle}>
                Your Previous Reviews
              </Text>
              {userReviews.map((review: any, index: number) => (
                <View key={index} style={styles.reviewCard}>
                  <Text style={styles.reviewDate}>
                    {new Date(review.reviewed_at).toLocaleDateString('en-IN')}
                  </Text>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noReviewsContainer}>
              <Text style={styles.noReviewsText}>
                You haven&apos;t added any reviews for this exam yet.
              </Text>
            </View>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  examInfoCard: {
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
  examName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  examSubject: {
    fontSize: 16,
    color: '#2563EB',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  examTopic: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  examDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  batchStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batchStatusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  quickAttendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAttendanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quickAttendanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  batchDetails: {
    gap: 8,
    marginBottom: 12,
  },
  relativeTimeRow: {
    marginTop: 4,
    paddingLeft: 24,
  },
  relativeTimeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontStyle: 'italic',
  },
  attendanceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  attendanceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  attendanceStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attendanceStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  attendanceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  attendanceDate: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  scoreSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  scoreDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    fontFamily: 'Inter-Bold',
  },
  percentageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#059669',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    fontFamily: 'Inter-Bold',
  },
  noAttendanceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  noAttendanceText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    fontFamily: 'Inter-Regular',
  },
  ongoingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  ongoingIndicator: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  ongoingText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  upcomingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  upcomingIndicator: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  upcomingText: {
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  addReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addReviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  existingReviewsSection: {
    marginTop: 16,
  },
  existingReviewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  reviewCard: {
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
  reviewDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  reviewComment: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  noBatchesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noBatchesText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  noReviewsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
});
