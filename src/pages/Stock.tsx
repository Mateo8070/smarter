import React, { useState, useMemo, useEffect } from 'react';
import { useDb } from '../hooks/useDb';
import StockForm from '../components/StockForm';
import type { Hardware } from '../types/database';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../components/Toast';
import {
  StockPageContainer,
  FilterContainer,
  FilterButton,
  CardView,
  Card,
  FloatingActionButton,
  SortModalContent,
  SortOption,
  TableViewContainer,
  StockTable,
  ActionCell,
  TableDeleteButton,
  TableEditButton,
  PageHeader,
  TableWrapper,
  EmptyStateContainer,
  EmptyStateMessage
} from './Stock.styles';
import ItemDetailsModal from '../components/ItemDetailsModal';
import {
  EditIcon as ActionEditIcon,
  TrashIcon,
  PlusIcon,
} from '../components/Icons';
import Pagination from '../components/Pagination';
import Skeleton from '../components/Skeleton';

const sortOptions = [
  { value: 'description_asc', label: 'Description (A-Z)' },
  { value: 'description_desc', label: 'Description (Z-A)' },
  { value: 'retail_price_desc', label: 'Retail Price (High to Low)' },
  { value: 'retail_price_asc', label: 'Retail Price (Low to High)' },
  { value: 'quantity_desc', label: 'Quantity (High to Low)' },
  { value: 'quantity_asc', label: 'Quantity (Low to High)' },
];

interface StockProps {
  setPage?: (page: string, payload?: any) => void;
  searchQuery: string;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  isDesktop: boolean;
  isSortModalOpen: boolean;
  setSortModalOpen: (isOpen: boolean) => void;
  isHeaderVisible: boolean;
  viewMode: 'card' | 'table';
  mainContentRef: React.RefObject<HTMLElement>;
}

const ITEMS_PER_PAGE = 50;

const Stock: React.FC<StockProps> = (props) => {
  const { setPage, searchQuery, sortOrder, setSortOrder, isDesktop, isSortModalOpen, setSortModalOpen, isHeaderVisible, viewMode, mainContentRef } = props;
  const { hardware, categories, addHardware, updateHardware, deleteHardware, addAuditLog } = useDb();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Hardware | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();
  const [detailsItem, setDetailsItem] = useState<Hardware | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryId, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddItem = async (item: Partial<Hardware>) => {
    if (!addHardware || !addAuditLog) return;
    try {
      const newItem: Hardware = {
        ...item,
        id: crypto.randomUUID(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
      } as Hardware;
      await addHardware(newItem);
      
      await addAuditLog({
        id: crypto.randomUUID(),
        item_id: newItem.id,
        change_description: `Created item: ${newItem.description}`,
        created_at: new Date().toISOString(),
        username: 'Giya Hardware',
        is_synced: 0
      });

      setShowForm(false);
      addToast('Stock item added', 'success');
    } catch (error) {
      addToast('Failed to add item', 'error');
    }
  };
  
  const openDetails = (item: Hardware) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setDetailsItem(null);
    setShowDetailsModal(false);
  };

  const handleEdit = (item: Hardware) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleUpdateItem = async (item: Partial<Hardware>) => {
    if (!updateHardware || !editingItem || !addAuditLog) return;
    try {
      await updateHardware(editingItem.id, {
        ...item,
        updated_at: new Date().toISOString(),
      });
      
      await addAuditLog({
        id: crypto.randomUUID(),
        item_id: editingItem.id,
        change_description: `Updated item: ${item.description || editingItem.description}`,
        created_at: new Date().toISOString(),
        username: 'Giya Hardware',
        is_synced: 0
      });

      setShowForm(false);
      setEditingItem(undefined);
      addToast('Stock item updated', 'success');
    } catch (error) {
      addToast('Failed to update item', 'error');
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDeleteId(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteHardware || !itemToDeleteId || !addAuditLog) return;
    try {
      const itemToDelete = hardware?.find(h => h.id === itemToDeleteId);
      const description = itemToDelete?.description || 'Unknown Item';

      await deleteHardware(itemToDeleteId);
      
      await addAuditLog({
        id: crypto.randomUUID(),
        item_id: itemToDeleteId,
        change_description: `Deleted item: ${description}`,
        created_at: new Date().toISOString(),
        username: 'Giya Hardware',
        is_synced: 0
      });

      setShowConfirmModal(false);
      setItemToDeleteId(null);
      addToast('Stock item deleted', 'success');
    } catch (error) {
      addToast('Failed to delete item', 'error');
    }
  };

  const extractNumericValue = (str: string | null | undefined): number => {
    if (!str) return 0;
    const match = str.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const { paginatedItems, totalPages } = useMemo(() => {
    let filtered = hardware?.filter(item => !item.is_deleted) || [];

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategoryId) {
      filtered = filtered.filter(item => item.category_id === selectedCategoryId);
    }

    const sorted = filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'description_asc': return a.description?.localeCompare(b.description || '') || 0;
        case 'description_desc': return b.description?.localeCompare(a.description || '') || 0;
        case 'retail_price_asc': return (a.retail_price || 0) - (b.retail_price || 0);
        case 'retail_price_desc': return (b.retail_price || 0) - (a.retail_price || 0);
        case 'quantity_asc': return extractNumericValue(a.quantity) - extractNumericValue(b.quantity);
        case 'quantity_desc': return extractNumericValue(b.quantity) - extractNumericValue(a.quantity);
        default: return 0;
      }
    });

    const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    return { paginatedItems, totalPages };
  }, [hardware, searchQuery, selectedCategoryId, sortOrder, currentPage]);
  
  // Effect to adjust current page if it's out of bounds (e.g., after deleting items)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const renderSkeletons = () => {
    const CardSkeletonView = () => (
      <CardView>
        {Array.from({ length: 12 }).map((_, index) => (
          <Card key={index} style={{ pointerEvents: 'none' }}>
            <div className="card-header">
              <Skeleton height="24px" width="70%" />
              <Skeleton height="20px" width="50px" style={{ borderRadius: '12px' }} />
            </div>
            <div className="card-body">
              <div className="detail-item"><Skeleton height="12px" width="30px" /><Skeleton height="16px" width="50px" style={{ marginTop: '4px' }} /></div>
              <div className="detail-item"><Skeleton height="12px" width="40px" /><Skeleton height="16px" width="80px" style={{ marginTop: '4px' }} /></div>
              <div className="detail-item"><Skeleton height="12px" width="60px" /><Skeleton height="16px" width="80px" style={{ marginTop: '4px' }} /></div>
            </div>
          </Card>
        ))}
      </CardView>
    );

    const TableSkeletonView = () => (
      <TableViewContainer>
        <TableWrapper>
            <StockTable>
                <thead><tr><th>Description</th><th>Category</th><th>Quantity</th><th>Retail Price</th><th>Wholesale Price</th><th>Actions</th></tr></thead>
                <tbody>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i}>
                            <td><Skeleton height="20px" /></td><td><Skeleton height="20px" /></td><td><Skeleton height="20px" /></td>
                            <td><Skeleton height="20px" /></td><td><Skeleton height="20px" /></td>
                            <td><div style={{ display: 'flex', gap: '8px' }}><Skeleton width="36px" height="36px" /><Skeleton width="36px" height="36px" /></div></td>
                        </tr>
                    ))}
                </tbody>
            </StockTable>
        </TableWrapper>
      </TableViewContainer>
    );

    return (
      <StockPageContainer>
        <PageHeader isVisible={true}>
          <FilterContainer>
            <Skeleton width="60px" height="34px" style={{ borderRadius: '20px' }} />
            <Skeleton width="100px" height="34px" style={{ borderRadius: '20px' }} />
            <Skeleton width="80px" height="34px" style={{ borderRadius: '20px' }} />
          </FilterContainer>
        </PageHeader>
        {isDesktop && viewMode === 'table' ? <TableSkeletonView /> : <CardSkeletonView />}
      </StockPageContainer>
    );
  };
  
  if (hardware === undefined) {
    return renderSkeletons();
  }

  return (
    <StockPageContainer>
      <PageHeader isVisible={isHeaderVisible}>
        <FilterContainer>
          <FilterButton active={!selectedCategoryId} onClick={() => setSelectedCategoryId(null)}>All</FilterButton>
          {categories?.filter(cat => !cat.is_deleted).map(cat => (
            <FilterButton key={cat.id} active={selectedCategoryId === cat.id} onClick={() => setSelectedCategoryId(cat.id)}>
              {cat.name}
            </FilterButton>
          ))}
        </FilterContainer>
      </PageHeader>
      
      {paginatedItems.length === 0 ? (
        <EmptyStateContainer>
          <h3>No Items Found</h3>
          <EmptyStateMessage>
            {searchQuery || selectedCategoryId ? "Try adjusting your search or filter." : "Your inventory is empty. Add a new item to get started."}
          </EmptyStateMessage>
        </EmptyStateContainer>
      ) : (
        <>
        {isDesktop && viewMode === 'table' ? (
          <TableViewContainer>
              <TableWrapper>
                  <StockTable>
                      <thead>
                          <tr>
                              <th>Description</th><th>Category</th><th>Quantity</th><th>Retail Price</th><th>Wholesale Price</th><th>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {paginatedItems.map(item => (
                              <tr key={item.id}>
                                  <td onClick={() => openDetails(item)}>{item.description}</td>
                                  <td onClick={() => openDetails(item)}>{categories?.find(c => c.id === item.category_id)?.name || 'N/A'}</td>
                                  <td onClick={() => openDetails(item)}>{item.quantity}</td>
                                  <td onClick={() => openDetails(item)}>MK {item.retail_price?.toLocaleString()} {item.retail_price_unit ? `/ ${item.retail_price_unit}` : ''}</td>
                                  <td onClick={() => openDetails(item)}>MK {item.wholesale_price?.toLocaleString()} {item.wholesale_price_unit ? `/ ${item.wholesale_price_unit}`: ''}</td>
                                  <ActionCell>
                                      <TableEditButton onClick={() => handleEdit(item)} aria-label={`Edit ${item.description}`}><ActionEditIcon /></TableEditButton>
                                      <TableDeleteButton onClick={() => handleDeleteClick(item.id)} aria-label={`Delete ${item.description}`}><TrashIcon /></TableDeleteButton>
                                  </ActionCell>
                              </tr>
                          ))}
                      </tbody>
                  </StockTable>
              </TableWrapper>
          </TableViewContainer>
        ) : (
          <CardView>
            {paginatedItems.map((item) => {
              const category = categories?.find(c => c.id === item.category_id);
              return (
                <Card key={item.id} onClick={() => openDetails(item)}>
                  <div className="card-header">
                    <span className="description">{item.description}</span>
                    {category && <span className="category-tag" style={{'--category-color': category.color} as React.CSSProperties}>{category.name}</span>}
                  </div>
                  <div className="card-body">
                    <div className="detail-item">
                      <span className="detail-label">Qty</span>
                      <span className="detail-value">{item.quantity || 'N/A'}</span>
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
          </CardView>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
        </>
      )}

      <FloatingActionButton onClick={() => { setEditingItem(undefined); setShowForm(true); }} aria-label="Add stock item">
        <PlusIcon />
      </FloatingActionButton>
      
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingItem ? 'Edit Item' : 'Add New Item'}>
        <StockForm 
            onSubmit={editingItem ? handleUpdateItem : handleAddItem} 
            initialItem={editingItem} 
            categories={categories || []}
        />
      </Modal>
      <Modal isOpen={isSortModalOpen} onClose={() => setSortModalOpen(false)} title="Sort by">
        <SortModalContent>
            {sortOptions.map(option => (
            <SortOption key={option.value} onClick={() => { setSortOrder(option.value); setSortModalOpen(false); }}>
                <input type="radio" id={option.value} name="sort" value={option.value} checked={sortOrder === option.value} readOnly />
                <label htmlFor={option.value}>{option.label}</label>
            </SortOption>
            ))}
        </SortModalContent>
      </Modal>
      <ConfirmationModal isOpen={showConfirmModal} onConfirm={handleConfirmDelete} onCancel={() => setShowConfirmModal(false)} title="Confirm Deletion" message="Are you sure you want to delete this stock item? This action cannot be undone." />
      {detailsItem && <ItemDetailsModal
        isOpen={showDetailsModal}
        onClose={closeDetails}
        item={detailsItem}
        onEdit={(it) => { closeDetails(); handleEdit(it); }}
        onHistory={(it) => { closeDetails(); setPage && setPage('audit-log', { auditItemId: it.id }); }}
        onDelete={(id) => { closeDetails(); handleDeleteClick(id); }}
      />}
    </StockPageContainer>
  );
};

export default Stock;
