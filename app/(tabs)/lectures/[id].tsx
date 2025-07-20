import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  FileText,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Plus,
  ExternalLink,
} from 'lucide-react-native';
import { lecturesManagementService } from '@/services/lectures-management';
import { useAuth } from '@/contexts/AuthContext';

export default function LectureDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'reviews'>(
    'overview'
  );
  const [lecture, setLecture] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: any }>(
    {}
  );
  const [reviewsData, setReviewsData] = useState<{ [key: string]: any[] }>({});
  const [newReview, setNewReview] = useState<{ [key: string]: string }>({});
  const [submittingReview, setSubmittingReview] = useState<{
    [key: string]: boolean;
  }>({});

  // Calculate the actual status of a batch based on its scheduled time
  const calculateBatchStatus = (
    batch: any
  ):
    | 'upcoming'
    | 'ongoing'
    | 'completed'
    | 'postponed'
    | 'cancelled'
    | 'not_held' => {
    if (!batch) return 'upcoming';

    const now = new Date();
    const scheduledTime = new Date(batch.scheduled_at);

    // If manually set to completed, postponed, cancelled, or not_held, respect that
    if (
      batch.status === 'completed' ||
      batch.status === 'postponed' ||
      batch.status === 'cancelled' ||
      batch.status === 'not_held'
    ) {
      return batch.status;
    }

    // Calculate time difference
    const timeDiff = now.getTime() - scheduledTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // If the lecture hasn't started yet (more than 15 minutes before)
    if (hoursDiff < -0.25) {
      return 'upcoming';
    }

    // If the lecture has started but not been marked as complete (within 4 hours of start time)
    if (hoursDiff >= -0.25 && hoursDiff < 4) {
      return 'ongoing';
    }

    return 'ongoing';

    // If it's been more than 4 hours and not marked complete, consider it not held
    // return 'not_held';
  };

  const loadLectureData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id || !user?.id) {
        setError('Invalid lecture ID or user not authenticated');
        return;
      }

      // Get lecture details
      const lectureData = await lecturesManagementService.getAllLectures();
      const currentLecture = lectureData.find((l) => l.id === id);

      if (!currentLecture) {
        setError('Lecture not found');
        return;
      }

      setLecture(currentLecture);

      // Get all batches for this lecture
      const batchData = await lecturesManagementService.getLectureBatches(id);

      // Sort batches by scheduled time (earliest first)
      const sortedBatches = batchData.sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      );

      setBatches(sortedBatches);

      // Get attendance data for each batch
      const attendancePromises = sortedBatches.map(async (batch) => {
        try {
          const attendanceRecords =
            await lecturesManagementService.getAttendanceForBatch(batch.id);
          const userAttendance = attendanceRecords.find(
            (att) => att.student_id === user.id
          );
          return {
            batchId: batch.id,
            attendance: userAttendance
              ? {
                  status: userAttendance.status,
                  recordedAt: userAttendance.recorded_at,
                }
              : null,
          };
        } catch (error) {
          console.warn(
            `Failed to fetch attendance for batch ${batch.id}:`,
            error
          );
          return { batchId: batch.id, attendance: null };
        }
      });

      const attendanceResults = await Promise.all(attendancePromises);
      const attendanceMap = attendanceResults.reduce((acc, result) => {
        acc[result.batchId] = result.attendance;
        return acc;
      }, {} as { [key: string]: any });

      setAttendanceData(attendanceMap);

      // Get reviews data for each batch (only current user's reviews)
      const reviewsPromises = sortedBatches.map(async (batch) => {
        try {
          const allReviews = await lecturesManagementService.getReviewsForBatch(
            batch.id
          );
          // Filter to only show current user's reviews
          const userReviews = allReviews.filter(
            (review) => review.reviewer_id === user.id
          );
          return {
            batchId: batch.id,
            reviews: userReviews,
          };
        } catch (error) {
          console.warn(`Failed to fetch reviews for batch ${batch.id}:`, error);
          return { batchId: batch.id, reviews: [] };
        }
      });

      const reviewsResults = await Promise.all(reviewsPromises);
      const reviewsMap = reviewsResults.reduce((acc, result) => {
        acc[result.batchId] = result.reviews;
        return acc;
      }, {} as { [key: string]: any[] });

      setReviewsData(reviewsMap);
    } catch (err) {
      console.error('Error loading lecture data:', err);
      setError('Failed to load lecture details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadLectureData();
  }, [loadLectureData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLectureData();
    setRefreshing(false);
  }, [loadLectureData]);

  const handleSubmitReview = async (batchId: string) => {
    try {
      const reviewText = newReview[batchId]?.trim();
      if (!reviewText || !user?.id) return;

      setSubmittingReview((prev) => ({ ...prev, [batchId]: true }));

      await lecturesManagementService.addReview(batchId, {
        reviewerId: user.id,
        role: 'student',
        comment: reviewText,
      });

      // Clear the input
      setNewReview((prev) => ({ ...prev, [batchId]: '' }));

      // Refresh the reviews data
      const allReviews = await lecturesManagementService.getReviewsForBatch(
        batchId
      );
      const userReviews = allReviews.filter(
        (review) => review.reviewer_id === user.id
      );

      setReviewsData((prev) => ({
        ...prev,
        [batchId]: userReviews,
      }));

      Alert.alert('Success', 'Review added successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview((prev) => ({ ...prev, [batchId]: false }));
    }
  };

  const handleDownload = async (note: any) => {
    try {
      if (note.file_url) {
        const canOpen = await Linking.canOpenURL(note.file_url);
        if (canOpen) {
          await Linking.openURL(note.file_url);
        } else {
          Alert.alert('Error', 'Cannot open this file');
        }
      } else {
        Alert.alert('Info', 'Download link not available');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#2563EB';
      case 'ongoing':
        return '#F59E0B';
      case 'completed':
        return '#059669';
      case 'postponed':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      case 'not_held':
        return '#64748B';
      default:
        return '#64748B';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#EFF6FF';
      case 'ongoing':
        return '#FEF3C7';
      case 'completed':
        return '#ECFDF5';
      case 'postponed':
        return '#FEF3C7';
      case 'cancelled':
        return '#FEF2F2';
      case 'not_held':
        return '#F1F5F9';
      default:
        return '#F1F5F9';
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#059669';
      case 'late':
        return '#F59E0B';
      case 'absent':
        return '#EF4444';
      case 'excused':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return CheckCircle;
      case 'late':
        return AlertCircle;
      case 'absent':
        return XCircle;
      case 'excused':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'reviews', label: 'Reviews', icon: MessageCircle },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading lecture details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadLectureData}
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
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {lecture?.topic || lecture?.subject}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <tab.icon
              size={20}
              color={activeTab === tab.id ? '#2563EB' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {activeTab === 'overview' && (
          <View style={styles.overviewSection}>
            <View style={styles.lectureCard}>
              <Text style={styles.subject}>{lecture?.subject}</Text>
              <Text style={styles.topic}>
                {lecture?.topic || lecture?.subject}
              </Text>

              <View style={styles.lectureDetails}>
                <View style={styles.detailRow}>
                  <User size={16} color="#64748B" />
                  <Text style={styles.detailText}>
                    Course: {lecture?.course?.name || 'Unknown Course'}
                  </Text>
                </View>
                {lecture?.chapter && (
                  <View style={styles.detailRow}>
                    <FileText size={16} color="#64748B" />
                    <Text style={styles.detailText}>
                      Chapter: {lecture.chapter}
                    </Text>
                  </View>
                )}
              </View>

              {lecture?.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>
                    {lecture.description}
                  </Text>
                </View>
              )}
            </View>

            {/* Batches Section */}
            <View style={styles.batchesSection}>
              <Text style={styles.sectionTitle}>Lecture Batches</Text>

              {batches.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No batches scheduled for this lecture yet.
                  </Text>
                </View>
              ) : (
                batches.map((batch) => {
                  const status = calculateBatchStatus(batch);
                  const attendance = attendanceData[batch.id];
                  const { date, time } = formatDateTime(batch.scheduled_at);
                  const endTime = batch.end_time
                    ? formatDateTime(batch.end_time).time
                    : null;

                  return (
                    <View key={batch.id} style={styles.batchCard}>
                      <View style={styles.batchHeader}>
                        <View style={styles.batchInfo}>
                          <Text style={styles.batchTitle}>{date}</Text>
                          <View style={styles.batchDateTime}>
                            <Clock size={14} color="#64748B" />
                            <Text style={styles.batchDateText}>
                              {time}
                              {endTime ? ` - ${endTime}` : ''}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.batchStatus}>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusBgColor(status) },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                { color: getStatusColor(status) },
                              ]}
                            >
                              {status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Attendance Status */}
                      {status === 'completed' && (
                        <View style={styles.attendanceSection}>
                          <Text style={styles.attendanceTitle}>
                            Your Attendance
                          </Text>
                          {attendance ? (
                            <View style={styles.attendanceStatus}>
                              <View
                                style={[
                                  styles.attendanceIndicator,
                                  {
                                    backgroundColor: getAttendanceColor(
                                      attendance.status
                                    ),
                                  },
                                ]}
                              >
                                {React.createElement(
                                  getAttendanceIcon(attendance.status),
                                  {
                                    size: 16,
                                    color: '#FFFFFF',
                                  }
                                )}
                                <Text style={styles.attendanceText}>
                                  {attendance.status.charAt(0).toUpperCase() +
                                    attendance.status.slice(1)}
                                </Text>
                              </View>
                              {attendance.recordedAt && (
                                <Text style={styles.attendanceTime}>
                                  Recorded:{' '}
                                  {formatDateTime(attendance.recordedAt).time}
                                </Text>
                              )}
                            </View>
                          ) : (
                            <Text style={styles.noAttendanceText}>
                              No attendance record found
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Notes count */}
                      <View style={styles.batchFooter}>
                        <Text style={styles.notesCount}>
                          {batch.lecture_notes?.length || 0} notes available
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {activeTab === 'notes' && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Lecture Notes</Text>

            {batches.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No notes available for this lecture.
                </Text>
              </View>
            ) : (
              batches.map((batch) => {
                const { date, time } = formatDateTime(batch.scheduled_at);
                const notes = batch.lecture_notes || [];

                return (
                  <View key={batch.id} style={styles.batchNotesSimple}>
                    <Text style={styles.batchNotesSimpleTitle}>
                      {date} at {time}
                    </Text>

                    {notes.length === 0 ? (
                      <Text style={styles.noNotesSimpleText}>
                        No notes available for this batch.
                      </Text>
                    ) : (
                      <View style={styles.notesLinksContainer}>
                        {notes.map((note: any, index: number) => (
                          <TouchableOpacity
                            key={note.id || index}
                            style={styles.noteLinkItem}
                            onPress={() => handleDownload(note)}
                          >
                            <ExternalLink size={16} color="#2563EB" />
                            <Text style={styles.noteLinkText}>
                              {note.title || `Note ${index + 1}`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Your Reviews</Text>

            {batches.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No batches available for review.
                </Text>
              </View>
            ) : (
              batches.map((batch) => {
                const status = calculateBatchStatus(batch);
                const { date, time } = formatDateTime(batch.scheduled_at);
                const batchReviews = reviewsData[batch.id] || [];
                const canReview = status === 'completed';

                return (
                  <View key={batch.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.batchInfo}>
                        <Text style={styles.batchTitle}>{date}</Text>
                        <View style={styles.batchDateTime}>
                          <Clock size={14} color="#64748B" />
                          <Text style={styles.batchDateText}>{time}</Text>
                        </View>
                      </View>
                      <View style={styles.batchStatus}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusBgColor(status) },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(status) },
                            ]}
                          >
                            {status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Existing Reviews */}
                    {batchReviews.length > 0 && (
                      <View style={styles.existingReviews}>
                        <Text style={styles.existingReviewsTitle}>
                          Your Reviews:
                        </Text>
                        {batchReviews.map((review, index) => (
                          <View
                            key={review.id || index}
                            style={styles.reviewItem}
                          >
                            <View style={styles.reviewContent}>
                              <Text style={styles.reviewText}>
                                {review.comment}
                              </Text>
                              <Text style={styles.reviewDate}>
                                {formatDateTime(review.reviewed_at).date} at{' '}
                                {formatDateTime(review.reviewed_at).time}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Add New Review */}
                    {canReview && (
                      <View style={styles.addReviewSection}>
                        <Text style={styles.addReviewTitle}>
                          {batchReviews.length > 0
                            ? 'Add Another Review:'
                            : 'Add Your Review:'}
                        </Text>
                        <View style={styles.reviewInputContainer}>
                          <TextInput
                            style={styles.reviewInput}
                            placeholder="Share your thoughts about this lecture..."
                            placeholderTextColor="#94A3B8"
                            value={newReview[batch.id] || ''}
                            onChangeText={(text) =>
                              setNewReview((prev) => ({
                                ...prev,
                                [batch.id]: text,
                              }))
                            }
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                          />
                          <TouchableOpacity
                            style={[
                              styles.submitReviewButton,
                              (!newReview[batch.id]?.trim() ||
                                submittingReview[batch.id]) &&
                                styles.submitReviewButtonDisabled,
                            ]}
                            onPress={() => handleSubmitReview(batch.id)}
                            disabled={
                              !newReview[batch.id]?.trim() ||
                              submittingReview[batch.id]
                            }
                          >
                            {submittingReview[batch.id] ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Plus size={16} color="#FFFFFF" />
                                <Text style={styles.submitReviewButtonText}>
                                  Submit
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {!canReview && (
                      <View style={styles.reviewNotAvailable}>
                        <Text style={styles.reviewNotAvailableText}>
                          Reviews are only available for completed lectures
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
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
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
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
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  descriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  batchesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  batchInfo: {
    flex: 1,
  },
  batchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  batchDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  batchDateText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  batchTimeText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter-Medium',
  },
  batchStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  attendanceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  attendanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attendanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  attendanceText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  attendanceTime: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  noAttendanceText: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  batchFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  notesCount: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  notesSection: {
    padding: 20,
  },
  reviewsSection: {
    padding: 20,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  existingReviews: {
    marginBottom: 16,
  },
  existingReviewsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  reviewItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  reviewContent: {
    gap: 4,
  },
  reviewText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  addReviewSection: {
    marginTop: 8,
  },
  addReviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  reviewInputContainer: {
    gap: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
  },
  submitReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  submitReviewButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitReviewButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  reviewNotAvailable: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  reviewNotAvailableText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  batchNotesSimple: {
    marginBottom: 20,
  },
  batchNotesSimpleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  noNotesSimpleText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  notesLinksContainer: {
    gap: 8,
  },
  noteLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  noteLinkText: {
    fontSize: 14,
    color: '#2563EB',
    fontFamily: 'Inter-Medium',
    textDecorationLine: 'underline',
  },
});
