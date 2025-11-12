import React, { useState } from 'react';
import Modal from './Modal';
import styled from 'styled-components';
import type { Category } from '../types/database';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Label = styled.label`
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background-color: var(--surface-variant);
  color: var(--text-primary);
  font-size: 16px;
  outline: none;
  appearance: none; /* Remove default arrow */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 20px;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px ${({ theme }) => (theme as any).primary}33;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  background-color: var(--primary);
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--primary-dark);
  }

  &:disabled {
    background-color: var(--text-secondary);
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  background-color: var(--surface-variant);
  color: var(--text-primary);
  border: 1px solid var(--border);
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--background);
  }
`;

interface ReassignCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onReassign: (newCategoryId: string) => void;
  selectedCount: number;
}

const ReassignCategoryModal: React.FC<ReassignCategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onReassign,
  selectedCount,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');

  React.useEffect(() => {
    if (categories.length > 0) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      onReassign(selectedCategory);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reassign ${selectedCount} Items`}>
      <FormContainer onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="category-select">Select New Category</Label>
          <Select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            required
          >
            {categories.filter(c => !c.is_deleted).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <ButtonGroup>
          <CancelButton type="button" onClick={onClose}>Cancel</CancelButton>
          <SubmitButton type="submit" disabled={!selectedCategory}>Reassign</SubmitButton>
        </ButtonGroup>
      </FormContainer>
    </Modal>
  );
};

export default ReassignCategoryModal;
