import React, { useState, useEffect, useRef } from 'react';
import type { Hardware, Category } from '../types/database';
import styled from 'styled-components';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    @media (max-width: 500px) {
        grid-template-columns: 1fr;
    }
`;

const FullWidthInputGroup = styled.div`
    grid-column: 1 / -1;
    overflow: hidden;
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

const CategorySelectorContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin: 0 -4px;
  padding-left: 4px;
  padding-right: 4px;

  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const CategoryButton = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  background-color: ${({ active }) => (active ? 'var(--primary)' : 'var(--surface-variant)')};
  color: ${({ active }) => (active ? 'white' : 'var(--text-primary)')};
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    background-color: ${({ active }) => (active ? 'var(--primary)' : 'var(--surface)')};
    color: ${({ active }) => (active ? 'white' : 'var(--text-primary)')};
  }
`;

interface StockFormProps {
  onSubmit: (item: Partial<Hardware>) => void;
  initialItem?: Hardware;
  categories: Category[];
}

// Helper to format price and unit into a display string
const formatPrice = (price?: number | null, unit?: string | null): string => {
  if (price === null || typeof price === 'undefined' || isNaN(price)) return '';
  const priceStr = price.toString();
  return unit ? `${priceStr} / ${unit}` : priceStr;
};

// Helper to parse a string into price and unit
const parsePriceAndUnit = (priceString: string): { price: number | null, unit: string | null } => {
  if (!priceString || !priceString.trim()) {
      return { price: null, unit: null };
  }
  const numericPart = priceString.match(/[\d,.]+/g)?.[0] || '';
  const price = parseFloat(numericPart.replace(/,/g, ''));

  const unitPart = priceString.replace(/[\d,./]/g, '').trim();
  
  return {
    price: isNaN(price) ? null : price,
    unit: unitPart || 'each',
  };
};


const StockForm: React.FC<StockFormProps> = ({ onSubmit, initialItem, categories }) => {
  // Use a local state that can hold strings for price fields during editing
  const [item, setItem] = useState<Partial<Hardware>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialItem) {
      // Format numeric prices into strings for the form fields for editing
      setItem({
        ...initialItem,
        retail_price: formatPrice(initialItem.retail_price, initialItem.retail_price_unit) as any,
        wholesale_price: formatPrice(initialItem.wholesale_price, initialItem.wholesale_price_unit) as any,
      });
    } else {
      // Reset for a new item, ensuring price fields are empty strings
      setItem({
        description: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        quantity: '',
        retail_price: '' as any,
        wholesale_price: '' as any,
      });
    }
  }, [initialItem, categories]);


  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { price: retailPrice, unit: retailUnit } = parsePriceAndUnit(item.retail_price as any || '');
    const { price: wholesalePrice, unit: wholesaleUnit } = parsePriceAndUnit(item.wholesale_price as any || '');
    
    const submissionData: Partial<Hardware> = {
      ...item,
      retail_price: retailPrice,
      retail_price_unit: retailUnit,
      wholesale_price: wholesalePrice,
      wholesale_price_unit: wholesaleUnit,
    };
    onSubmit(submissionData);
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <FullWidthInputGroup as={InputGroup}>
        <Label htmlFor="description">Item Description</Label>
        <input
            id="description"
            name="description"
            ref={inputRef}
            value={item.description || ''}
            onChange={handleChange}
            placeholder="e.g., Hammer"
            required
        />
      </FullWidthInputGroup>
      
      <InputGrid>
        <FullWidthInputGroup as={InputGroup}>
            <Label>Category</Label>
            <CategorySelectorContainer>
                {categories.filter(c => !c.is_deleted).map(cat => (
                    <CategoryButton
                        key={cat.id}
                        type="button"
                        active={item.category_id === cat.id}
                        onClick={() => setItem(prev => ({ ...prev, category_id: cat.id }))}
                    >
                        {cat.name}
                    </CategoryButton>
                ))}
            </CategorySelectorContainer>
        </FullWidthInputGroup>
        <InputGroup>
            <Label htmlFor="quantity">Quantity</Label>
            <input
                id="quantity"
                name="quantity"
                type="text"
                value={item.quantity || ''}
                onChange={handleChange}
                placeholder="e.g., 10 units"
            />
        </InputGroup>
        <InputGroup>
            <Label htmlFor="retail_price">Retail Price (MK)</Label>
            <input
                id="retail_price"
                type="text"
                name="retail_price"
                value={item.retail_price as any || ''}
                onChange={handleChange}
                placeholder="e.g., 5000 / each"
            />
        </InputGroup>
        <InputGroup>
            <Label htmlFor="wholesale_price">Wholesale Price (MK)</Label>
            <input
                id="wholesale_price"
                type="text"
                name="wholesale_price"
                value={item.wholesale_price as any || ''}
                onChange={handleChange}
                placeholder="e.g., 4500 / box"
            />
        </InputGroup>
      </InputGrid>

      <ButtonContainer>
        <SubmitButton type="submit">{initialItem ? 'Update' : 'Add'} Item</SubmitButton>
      </ButtonContainer>
    </FormContainer>
  );
};

export default StockForm;
