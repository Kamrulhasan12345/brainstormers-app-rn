import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonItem({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        { width, height, borderRadius, backgroundColor: '#E2E8F0' },
        style,
      ]}
    >
      <LinearGradient
        colors={['#E2E8F0', '#F1F5F9', '#E2E8F0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius }]}
      />
    </View>
  );
}

export function NotificationSkeleton() {
  return (
    <View style={styles.notificationSkeleton}>
      <View style={styles.notificationHeader}>
        <SkeletonItem width={12} height={12} borderRadius={6} />
        <SkeletonItem width="60%" height={14} />
        <SkeletonItem width={60} height={12} />
      </View>
      <SkeletonItem width="100%" height={16} style={{ marginTop: 8 }} />
      <SkeletonItem width="80%" height={14} style={{ marginTop: 4 }} />
    </View>
  );
}

export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.cardHeader}>
        <SkeletonItem width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <SkeletonItem width="70%" height={16} />
          <SkeletonItem width="50%" height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <SkeletonItem width="100%" height={14} style={{ marginTop: 12 }} />
      <SkeletonItem width="85%" height={14} style={{ marginTop: 4 }} />
      <SkeletonItem width="60%" height={14} style={{ marginTop: 4 }} />
    </View>
  );
});

export function ListItemSkeleton() {
  return (
    <View style={styles.listItemSkeleton}>
      <SkeletonItem width={40} height={40} borderRadius={8} />
      <View style={styles.listItemContent}>
        <SkeletonItem width="80%" height={16} />
        <SkeletonItem width="60%" height={12} style={{ marginTop: 4 }} />
        <SkeletonItem width="40%" height={12} style={{ marginTop: 4 }} />
      </View>
      <SkeletonItem width={24} height={24} borderRadius={4} />
    </View>
  );
}

export function StatCardSkeleton() {
  return (
    <View style={styles.statCardSkeleton}>
      <SkeletonItem width={48} height={48} borderRadius={24} />
      <SkeletonItem width={40} height={24} style={{ marginTop: 12 }} />
      <SkeletonItem width={60} height={12} style={{ marginTop: 4 }} />
    </View>
  );
}

export function TableRowSkeleton() {
  return (
    <View style={styles.tableRowSkeleton}>
      <SkeletonItem width="20%" height={14} />
      <SkeletonItem width="30%" height={14} />
      <SkeletonItem width="25%" height={14} />
      <SkeletonItem width="15%" height={14} />
    </View>
  );
}

export function ExamDetailsSkeleton() {
  return (
    <View style={styles.examDetailsSkeleton}>
      {/* Exam Info Card */}
      <View style={styles.examInfoCard}>
        <SkeletonItem width="80%" height={24} style={{ marginBottom: 8 }} />
        <SkeletonItem width="60%" height={16} style={{ marginBottom: 4 }} />
        <SkeletonItem width="70%" height={14} style={{ marginBottom: 16 }} />

        <View style={styles.examDetailsGrid}>
          <View style={styles.examDetailRow}>
            <SkeletonItem width={16} height={16} borderRadius={2} />
            <SkeletonItem width="70%" height={14} />
          </View>
          <View style={styles.examDetailRow}>
            <SkeletonItem width={16} height={16} borderRadius={2} />
            <SkeletonItem width="50%" height={14} />
          </View>
        </View>
      </View>

      {/* Merit List Section */}
      <View style={styles.sectionSkeleton}>
        <View style={styles.sectionHeader}>
          <SkeletonItem width={20} height={20} borderRadius={4} />
          <SkeletonItem width="30%" height={20} />
        </View>
        <View style={styles.meritListCard}>
          <View style={styles.meritListHeader}>
            <SkeletonItem width="20%" height={14} />
            <SkeletonItem width="30%" height={14} />
            <SkeletonItem width="15%" height={14} />
          </View>
          {Array.from({ length: 5 }, (_, index) => (
            <View key={index} style={styles.meritListItem}>
              <SkeletonItem width="15%" height={14} />
              <SkeletonItem width="45%" height={14} />
              <SkeletonItem width="20%" height={14} />
            </View>
          ))}
        </View>
      </View>

      {/* Exam Batches Section */}
      <View style={styles.sectionSkeleton}>
        <SkeletonItem width="40%" height={20} style={{ marginBottom: 16 }} />
        {Array.from({ length: 2 }, (_, index) => (
          <View key={index} style={styles.batchCardSkeleton}>
            <View style={styles.batchHeader}>
              <View style={styles.batchStatus}>
                <SkeletonItem width={16} height={16} borderRadius={2} />
                <SkeletonItem width={80} height={12} />
              </View>
              <SkeletonItem width={60} height={20} borderRadius={10} />
            </View>

            <View style={styles.batchDetails}>
              <View style={styles.batchDetailRow}>
                <SkeletonItem width={16} height={16} borderRadius={2} />
                <SkeletonItem width="70%" height={14} />
              </View>
              <View style={styles.batchDetailRow}>
                <SkeletonItem width={16} height={16} borderRadius={2} />
                <SkeletonItem width="50%" height={14} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Reviews Section */}
      <View style={styles.sectionSkeleton}>
        <SkeletonItem width="35%" height={20} style={{ marginBottom: 16 }} />
        <View style={styles.addReviewCard}>
          <SkeletonItem width="30%" height={16} style={{ marginBottom: 12 }} />
          <SkeletonItem
            width="100%"
            height={80}
            borderRadius={12}
            style={{ marginBottom: 16 }}
          />
          <SkeletonItem width={120} height={44} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

export function LectureOverviewSkeleton() {
  return (
    <View style={styles.lectureOverviewSkeleton}>
      {/* Lecture Info Card */}
      <View style={styles.lectureInfoCard}>
        <SkeletonItem width="50%" height={16} style={{ marginBottom: 4 }} />
        <SkeletonItem width="85%" height={24} style={{ marginBottom: 16 }} />

        <View style={styles.lectureDetailsGrid}>
          <View style={styles.lectureDetailRow}>
            <SkeletonItem width={16} height={16} borderRadius={2} />
            <SkeletonItem width="60%" height={14} />
          </View>
          <View style={styles.lectureDetailRow}>
            <SkeletonItem width={16} height={16} borderRadius={2} />
            <SkeletonItem width="50%" height={14} />
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <SkeletonItem width="30%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonItem width="100%" height={14} style={{ marginBottom: 4 }} />
          <SkeletonItem width="85%" height={14} style={{ marginBottom: 4 }} />
          <SkeletonItem width="70%" height={14} />
        </View>
      </View>

      {/* Batches Section */}
      <View style={styles.sectionSkeleton}>
        <SkeletonItem width="45%" height={20} style={{ marginBottom: 16 }} />
        {Array.from({ length: 3 }, (_, index) => (
          <View key={index} style={styles.lectureBatchCardSkeleton}>
            <View style={styles.batchHeader}>
              <View style={styles.batchInfo}>
                <SkeletonItem
                  width="70%"
                  height={18}
                  style={{ marginBottom: 8 }}
                />
                <View style={styles.batchDateTime}>
                  <SkeletonItem width={14} height={14} borderRadius={2} />
                  <SkeletonItem width="40%" height={14} />
                </View>
              </View>
              <SkeletonItem width={70} height={24} borderRadius={12} />
            </View>

            <View style={styles.attendanceSection}>
              <SkeletonItem
                width="30%"
                height={14}
                style={{ marginBottom: 8 }}
              />
              <View style={styles.attendanceStatus}>
                <SkeletonItem width={16} height={16} borderRadius={2} />
                <SkeletonItem width={80} height={20} borderRadius={10} />
                <SkeletonItem width={60} height={12} />
              </View>
            </View>

            <View style={styles.batchFooter}>
              <SkeletonItem width="40%" height={14} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LectureNotesSkeleton() {
  return (
    <View style={styles.lectureNotesSkeleton}>
      <SkeletonItem width="35%" height={20} style={{ marginBottom: 16 }} />

      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} style={styles.batchNotesSection}>
          <SkeletonItem width="60%" height={16} style={{ marginBottom: 8 }} />

          <View style={styles.notesLinksContainer}>
            {Array.from({ length: 2 }, (_, noteIndex) => (
              <View key={noteIndex} style={styles.noteLinkItem}>
                <SkeletonItem width={16} height={16} borderRadius={2} />
                <SkeletonItem width="70%" height={14} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export function LectureReviewsSkeleton() {
  return (
    <View style={styles.lectureReviewsSkeleton}>
      <SkeletonItem width="35%" height={20} style={{ marginBottom: 16 }} />

      {Array.from({ length: 2 }, (_, index) => (
        <View key={index} style={styles.reviewCardSkeleton}>
          <View style={styles.reviewHeader}>
            <View style={styles.batchInfo}>
              <SkeletonItem
                width="50%"
                height={16}
                style={{ marginBottom: 4 }}
              />
              <View style={styles.batchDateTime}>
                <SkeletonItem width={14} height={14} borderRadius={2} />
                <SkeletonItem width="40%" height={14} />
              </View>
            </View>
            <SkeletonItem width={70} height={24} borderRadius={12} />
          </View>

          <View style={styles.addReviewSection}>
            <SkeletonItem width="40%" height={14} style={{ marginBottom: 8 }} />
            <SkeletonItem
              width="100%"
              height={80}
              borderRadius={12}
              style={{ marginBottom: 12 }}
            />
            <SkeletonItem width={120} height={40} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
  renderItem: () => React.ReactElement;
  style?: ViewStyle;
}

export const SkeletonList = memo(function SkeletonList({
  count = 5,
  renderItem,
  style,
}: SkeletonListProps) {
  // Ensure count is a positive number
  const safeCount = Math.max(0, Math.floor(count || 0));

  if (safeCount === 0) {
    return <View style={style} />;
  }

  return (
    <View style={style}>
      {Array.from({ length: safeCount }, (_, index) => (
        <View key={`skeleton-${index}`} style={{ marginBottom: 12 }}>
          {renderItem()}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  notificationSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemContent: {
    flex: 1,
  },
  statCardSkeleton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tableRowSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // Exam Details Skeleton Styles
  examDetailsSkeleton: {
    padding: 16,
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
  examDetailsGrid: {
    gap: 8,
  },
  examDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionSkeleton: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  meritListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  meritListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  meritListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  batchCardSkeleton: {
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
  batchDetails: {
    gap: 8,
  },
  batchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // Lecture Overview Skeleton Styles
  lectureOverviewSkeleton: {
    padding: 20,
  },
  lectureInfoCard: {
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
  lectureDetailsGrid: {
    gap: 8,
  },
  lectureDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  descriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  lectureBatchCardSkeleton: {
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
  batchInfo: {
    flex: 1,
  },
  batchDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendanceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  batchFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  // Lecture Notes Skeleton Styles
  lectureNotesSkeleton: {
    padding: 20,
  },
  batchNotesSection: {
    marginBottom: 20,
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
  // Lecture Reviews Skeleton Styles
  lectureReviewsSkeleton: {
    padding: 20,
  },
  reviewCardSkeleton: {
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
  addReviewSection: {
    marginTop: 8,
  },
});
