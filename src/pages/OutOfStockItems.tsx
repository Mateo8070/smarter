// src/pages/OutOfStockItems.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { Hardware, Category } from '../types/database'; // Added Category
import { isOutOfStock } from '../utils/stockUtils';
import { useDb } from '../hooks/useDb'; // New import
import { useToast } from '../components/Toast'; // New import
import ItemDetailsModal from '../components/ItemDetailsModal'; // New import
import ConfirmationModal from '../components/ConfirmationModal'; // New import
import StockForm from '../components/StockForm'; // New import
import Modal from '../components/Modal'; // New import
import { Card } from './Stock.styles'; // New import for Card

const OutOfStockItemsContainer = styled.div`
  padding: 48px;

  @media (max-width: 768px) {
    padding: 24px;
  }

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const Title = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 32px;

  @media (max-width: 768px) {
    font-size: 28px;
    margin-bottom: 24px;
  }
`;

const ItemList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
`;



interface OutOfStockItemsProps {
  hardware: Hardware[];
  setPage: (page: string, payload?: { auditItemId?: string }) => void; // New prop
}

const OutOfStockItems: React.FC<OutOfStockItemsProps> = ({ hardware, setPage }) => {
  const { categories, updateHardware, deleteHardware } = useDb(); // New hook usage
  const { addToast } = useToast(); // New hook usage
  const outOfStockHardware = hardware.filter(item => !item.is_deleted && isOutOfStock(item.quantity));

  const [selectedItem, setSelectedItem] = useState<Hardware | null>(null); // New state
  const [isModalOpen, setIsModalOpen] = useState(false); // New state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // New state
  const [itemToDelete, setItemToDelete] = useState<string | null>(null); // New state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // New state

  const handleItemClick = (item: Hardware) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
    setIsModalOpen(false); // Close the details modal
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteHardware(itemToDelete);
      addToast('Item deleted successfully', 'success');
    }
    setIsConfirmModalOpen(false);
    setItemToDelete(null);
  };

  const handleEditRequest = (item: Hardware) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
    setIsModalOpen(false); // Close the details modal
  };

  const handleEditSubmit = (item: Partial<Hardware>) => {
    if (selectedItem) {
      updateHardware(selectedItem.id, item);
      addToast('Item updated successfully', 'success');
    }
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleHistoryRequest = (item: Hardware) => {
    setPage('audit-log', { auditItemId: item.id });
    setIsModalOpen(false); // Close the details modal
  };

  return (
    <OutOfStockItemsContainer>
      {outOfStockHardware.length > 0 ? (
        <ItemList>
          {outOfStockHardware.map(item => {
            const category = categories?.find(c => c.id === item.category_id);
            return (
              <Card key={item.id} onClick={() => handleItemClick(item)}>
                <div className="card-header">
                  <span className="description">{item.description || 'N/A'}</span>
                  {category && <span className="category-tag" style={{'--category-color': category.color} as React.CSSProperties}>{category.name}</span>}
                </div>
                <div className="card-body">
                  <div className="detail-item">
                    <span className="detail-label">Qty</span>
                    <span className="detail-value">{item.quantity || '0'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Retail</span>
                    <span className="detail-value">
                      MK {item.retail_price?.toLocaleString() ?? 'N/A'}
                      {item.retail_price_unit && <span className="price-unit">/ {item.retail_price_unit}</span>}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Wholesale</span>
                    <span className="detail-value">
                      MK {item.wholesale_price?.toLocaleString() ?? 'N/A'}
                      {item.wholesale_price_unit && <span className="price-unit">/ {item.wholesale_price_unit}</span>}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </ItemList>
      ) : (
        <p>No out of stock items found.</p>
      )}
    {selectedItem && (
        <ItemDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={selectedItem}
          onEdit={handleEditRequest}
          onHistory={handleHistoryRequest}
          onDelete={handleDeleteRequest}
        />
      )}
      {selectedItem && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Item">
          <StockForm
            onSubmit={handleEditSubmit}
            initialItem={selectedItem}
            categories={categories || []}
          />
        </Modal>
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmModalOpen(false)}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
      />
    </OutOfStockItemsContainer>
  );
};

export default OutOfStockItems;
