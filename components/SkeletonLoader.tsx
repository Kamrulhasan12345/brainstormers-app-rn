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
});
