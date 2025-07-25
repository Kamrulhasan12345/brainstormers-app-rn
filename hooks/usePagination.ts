import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  itemsPerPage?: number;
}

interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  paginatedData: T[];
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  resetPage: () => void;
  pageNumbers: number[];
}

export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { initialPage = 1, itemsPerPage = 10 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Handle empty data arrays safely
  const safeData = useMemo(() => data || [], [data]);
  const totalPages = Math.max(1, Math.ceil(safeData.length / itemsPerPage));
  const hasNextPage = safeData.length > 0 && currentPage < totalPages;
  const hasPreviousPage = safeData.length > 0 && currentPage > 1;

  const paginatedData = useMemo(() => {
    if (safeData.length === 0) {
      return [];
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return safeData.slice(startIndex, endIndex);
  }, [safeData, currentPage, itemsPerPage]);

  const pageNumbers = useMemo(() => {
    if (safeData.length === 0) {
      return [1]; // Always show at least page 1 for empty data
    }

    const pages = [];
    const maxVisiblePages = 5;
    const actualTotalPages = Math.ceil(safeData.length / itemsPerPage);

    if (actualTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= actualTotalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(
        1,
        currentPage - Math.floor(maxVisiblePages / 2)
      );
      const endPage = Math.min(
        actualTotalPages,
        startPage + maxVisiblePages - 1
      );

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [currentPage, safeData.length, itemsPerPage]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback(
    (page: number) => {
      const actualTotalPages = Math.ceil(safeData.length / itemsPerPage);
      if (page >= 1 && page <= actualTotalPages) {
        setCurrentPage(page);
      }
    },
    [safeData.length, itemsPerPage]
  );

  const resetPage = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  return {
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    paginatedData,
    nextPage,
    previousPage,
    goToPage,
    resetPage,
    pageNumbers,
  };
}
