import React from 'react';
import styled from 'styled-components';
import type { Hardware } from '../types/database';
import Modal from './Modal';
import { useDb } from '../hooks/useDb';
import { EditIcon, HistoryIcon, TrashIcon } from './Icons';

const DetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const DetailLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
`;

const DetailValue = styled.span`
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
`;

const DescriptionValue = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  word-break: break-word;
  padding-right: 40px; /* Space for close button */
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-evenly;
  gap: 12px;
  border-top: 1px solid var(--border);
  padding-top: 24px;
  width: 100%;
`;

const ActionButton = styled.button`
  background-color: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 1rem;
  flex: 1;
  justify-content: center;
  max-width: 150px;

  &:hover {
    background-color: var(--background);
    border-color: var(--text-secondary);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  @media (max-width: 420px) {
    padding: 8px 12px;
    font-size: 0.875rem;
    gap: 6px;
    flex-direction: column;
    span {
      display: none;
    }
  }
`;

const DeleteButton = styled(ActionButton)`
  border-color: transparent;
  background-color: ${({ theme }) => theme.danger}1a;
  color: var(--danger);

  &:hover {
    background-color: var(--danger);
    border-color: var(--danger);
    color: white;
  }
`;

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Hardware;
  onEdit: (item: Hardware) => void;
  onHistory: (item: Hardware) => void;
  onDelete: (id: string) => void;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ isOpen, onClose, item, onEdit, onHistory, onDelete }) => {
  if (!item) return null;

  const { categories } = useDb();
  const categoryName = categories?.find(c => c.id === item.category_id)?.name || 'N/A';

  const formatPrice = (price?: number | null, unit?: string | null) => {
    if (price === null || typeof price === 'undefined') return 'N/A';
    const formattedPrice = `MK ${price.toLocaleString()}`;
    return unit ? `${formattedPrice} / ${unit}` : formattedPrice;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <DetailsContainer>
        <DescriptionValue>{item.description}</DescriptionValue>
        
        <DetailGrid>
          <DetailItem><DetailLabel>Quantity</DetailLabel><DetailValue>{item.quantity || 'N/A'}</DetailValue></DetailItem>
          <DetailItem><DetailLabel>Category</DetailLabel><DetailValue>{categoryName}</DetailValue></DetailItem>
          <DetailItem><DetailLabel>Retail Price</DetailLabel><DetailValue>{formatPrice(item.retail_price, item.retail_price_unit)}</DetailValue></DetailItem>
          <DetailItem><DetailLabel>Wholesale Price</DetailLabel><DetailValue>{formatPrice(item.wholesale_price, item.wholesale_price_unit)}</DetailValue></DetailItem>
        </DetailGrid>

        <ButtonContainer>
          <ActionButton onClick={() => onEdit(item)}><EditIcon /> <span>Edit</span></ActionButton>
          <ActionButton onClick={() => onHistory(item)}><HistoryIcon /> <span>History</span></ActionButton>
          <DeleteButton onClick={() => onDelete(item.id)}><TrashIcon /> <span>Delete</span></DeleteButton>
        </ButtonContainer>
      </DetailsContainer>
    </Modal>
  );
};

export default ItemDetailsModal;
