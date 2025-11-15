import React from 'react';
import styled from 'styled-components';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';

const PaginationContainer = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  gap: 8px;
  flex-wrap: wrap;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  background-color: ${({ $active }) => ($active ? 'var(--primary)' : 'var(--surface)')};
  color: ${({ $active }) => ($active ? 'white' : 'var(--text-primary)')};
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: var(--primary);
    color: var(--primary);
    background-color: ${({ $active }) => ($active ? 'var(--primary)' : 'var(--surface-variant)')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background-color: var(--background);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Ellipsis = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  color: var(--text-secondary);
`;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
        const startPages = [1, 2];
        const endPages = [totalPages - 1, totalPages];
        const middlePages = [currentPage - 1, currentPage, currentPage + 1];

        const allPages = [...startPages, ...middlePages, ...endPages]
            .filter(p => p > 0 && p <= totalPages);
        
        const uniquePages = [...new Set(allPages)].sort((a,b) => a - b);
        
        let lastPage = 0;
        for (const page of uniquePages) {
            if (page > lastPage + 1) {
                pageNumbers.push('...');
            }
            pageNumbers.push(page);
            lastPage = page;
        }
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <PaginationContainer aria-label="Pagination">
      <PageButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ArrowLeftIcon />
      </PageButton>

      {pageNumbers.map((page, index) =>
        typeof page === 'number' ? (
          <PageButton
            key={index}
            $active={currentPage === page}
            onClick={() => onPageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </PageButton>
        ) : (
          <Ellipsis key={index}>...</Ellipsis>
        ),
      )}

      <PageButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ArrowRightIcon />
      </PageButton>
    </PaginationContainer>
  );
};

export default Pagination;