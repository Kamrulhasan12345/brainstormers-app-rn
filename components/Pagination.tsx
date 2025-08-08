import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageNumbers: number[];
  onNextPage: () => void;
  onPreviousPage: () => void;
  onGoToPage: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  isFooter?: boolean; // New prop to indicate if it's used as a footer component
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  pageNumbers,
  onNextPage,
  onPreviousPage,
  onGoToPage,
  totalItems,
  itemsPerPage = 10,
  isFooter = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

  return (
    <View style={[styles.container, isFooter && styles.footerContainer]}>
      {totalItems && (
        <Text style={styles.itemsInfo}>
          Showing {startItem}-{endItem} of {totalItems} items
        </Text>
      )}

      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.pageButton, !hasPreviousPage && styles.disabledButton]}
          onPress={onPreviousPage}
          disabled={!hasPreviousPage}
        >
          <ChevronLeft
            size={16}
            color={!hasPreviousPage ? '#CBD5E1' : '#475569'}
          />
        </TouchableOpacity>

        {pageNumbers.map((pageNumber) => (
          <TouchableOpacity
            key={pageNumber}
            style={[
              styles.pageButton,
              currentPage === pageNumber && styles.activePageButton,
            ]}
            onPress={() => onGoToPage(pageNumber)}
          >
            <Text
              style={[
                styles.pageButtonText,
                currentPage === pageNumber && styles.activePageButtonText,
              ]}
            >
              {pageNumber}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.pageButton, !hasNextPage && styles.disabledButton]}
          onPress={onNextPage}
          disabled={!hasNextPage}
        >
          <ChevronRight
            size={16}
            color={!hasNextPage ? '#CBD5E1' : '#475569'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Helper function to create a pagination footer component
export function createPaginationFooter(
  paginationProps: Omit<PaginationProps, 'isFooter'>
) {
  const PaginationFooter = () => (
    <Pagination {...paginationProps} isFooter={true} />
  );

  PaginationFooter.displayName = 'PaginationFooter';
  return PaginationFooter;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    marginVertical: 8,
  },
  footerContainer: {
    marginVertical: 0,
    marginTop: 16,
    paddingBottom: 24,
  },
  itemsInfo: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  pageButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePageButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  disabledButton: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  pageButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  activePageButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
