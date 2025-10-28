import React, { useState, useEffect, useRef } from 'react';
import type { Category } from '../types/database';
import styled from 'styled-components';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
    font-weight: 500;
    font-size: 14px;
    color: var(--text-primary);
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
`;

const SubmitButton = styled.button`
    background-color: var(--primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: var(--primary-hover);
    }
`;

interface CategoryFormProps {
  onSubmit: (item: Partial<Category>) => void;
  initialItem?: Category;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onSubmit, initialItem }) => {
  const [item, setItem] = useState<Partial<Category>>(
    initialItem || { name: '' }
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialItem) {
        setItem(initialItem);
    }
  }, [initialItem]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(item);
    if (!initialItem) {
        setItem({ name: '' });
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <InputGroup>
        <Label htmlFor="category-name">Category Name</Label>
        <input
            id="category-name"
            name="name"
            ref={inputRef}
            value={item.name || ''}
            onChange={handleChange}
            placeholder="e.g., Laptops, Monitors"
            required
        />
      </InputGroup>
      <ButtonContainer>
        <SubmitButton type="submit">{initialItem ? 'Update' : 'Add'} Category</SubmitButton>
      </ButtonContainer>
    </FormContainer>
  );
};

export default CategoryForm;
