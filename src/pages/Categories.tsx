import React, { useState, useMemo } from 'react';
import { useDb } from '../hooks/useDb';
import CategoryForm from '../components/CategoryForm';
import type { Category } from '../types/database';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../components/Toast';
import {
  CategoriesPageContainer,
  CardView,
  Card,
  ActionButton,
  DeleteButton,
  FloatingActionButton,
  Toolbar,
  SearchInput,
  PrimaryButton,
  EmptyStateContainer,
  EmptyStateMessage,
} from './Categories.styles';
import { EditIcon, TrashIcon, PlusIcon, SearchIcon } from '../components/Icons';
import ColorPickerModal from '../components/ColorPickerModal';
import { useMediaQuery } from '../hooks/useMediaQuery';
import Skeleton from '../components/Skeleton';

const Categories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useDb();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | undefined>(undefined);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryForColorPicker, setCategoryForColorPicker] = useState<Category | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleAddItem = async (item: Partial<Category>) => {
    if (!addCategory) return;
    await addCategory({
      ...item,
      id: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    } as Category);
    setShowForm(false);
    addToast('Category added', 'success');
  };

  const handleEdit = (item: Category) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleUpdateItem = async (item: Partial<Category>) => {
    if (!updateCategory || !editingItem) return;
    await updateCategory(editingItem.id, { ...item, updated_at: new Date().toISOString() });
    setShowForm(false);
    setEditingItem(undefined);
    addToast('Category updated', 'success');
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDeleteId(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCategory || !categoryToDeleteId) return;
    await deleteCategory(categoryToDeleteId);
    setShowConfirmModal(false);
    setCategoryToDeleteId(null);
    addToast('Category deleted', 'success');
  };

  const handleColorSelect = async (color: string) => {
    if (categoryForColorPicker && updateCategory) {
      await updateCategory(categoryForColorPicker.id, { color, updated_at: new Date().toISOString() });
      addToast('Color updated', 'success');
      setCategoryForColorPicker(null);
    }
  };

  const filteredCategories = useMemo(() => {
    return categories?.filter(c => 
      !c.is_deleted && 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [categories, searchQuery]);

  if (categories === undefined) {
    return (
        <CategoriesPageContainer>
            <Toolbar>
                <div className="search-container">
                    <Skeleton height="44px" />
                </div>
                {!isMobile && <Skeleton width="150px" height="44px" />}
            </Toolbar>
            <CardView>
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i}>
                        <div className="category-info">
                            <Skeleton width="32px" height="32px" style={{ borderRadius: '50%' }} />
                            <Skeleton width="120px" height="20px" />
                        </div>
                    </Card>
                ))}
            </CardView>
        </CategoriesPageContainer>
    );
  }

  return (
    <CategoriesPageContainer>
      <Toolbar>
        <div className="search-container">
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {!isMobile && (
          <PrimaryButton onClick={() => {setEditingItem(undefined); setShowForm(true)}}>
            <PlusIcon /> New Category
          </PrimaryButton>
        )}
      </Toolbar>

      {filteredCategories.length > 0 ? (
        <CardView>
          {filteredCategories.map((item: Category) => (
            <Card key={item.id}>
              <div className="category-info">
                <button className="color-swatch" onClick={() => setCategoryForColorPicker(item)} style={{ backgroundColor: item.color || '#cccccc' }} aria-label={`Change color for ${item.name}`}></button>
                <span className="category-name">{item.name}</span>
              </div>
              <div className="actions">
                <ActionButton onClick={() => handleEdit(item)} aria-label={`Edit ${item.name}`}><EditIcon /></ActionButton>
                <DeleteButton onClick={() => handleDeleteClick(item.id)} aria-label={`Delete ${item.name}`}><TrashIcon /></DeleteButton>
              </div>
            </Card>
          ))}
        </CardView>
      ) : (
        <EmptyStateContainer>
          <h3>No Categories Found</h3>
          <EmptyStateMessage>
              {searchQuery ? "Try a different search term." : "Create your first category to organize your stock."}
          </EmptyStateMessage>
        </EmptyStateContainer>
      )}


      {isMobile && (
        <FloatingActionButton onClick={() => {setEditingItem(undefined); setShowForm(true)}} aria-label="Add Category">
          <PlusIcon />
        </FloatingActionButton>
      )}

      <ColorPickerModal isOpen={!!categoryForColorPicker} onClose={() => setCategoryForColorPicker(null)} onColorSelect={handleColorSelect} />
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingItem ? 'Edit Category' : 'Add New Category'}>
        <CategoryForm onSubmit={editingItem ? handleUpdateItem : handleAddItem} initialItem={editingItem} />
      </Modal>
      <ConfirmationModal isOpen={showConfirmModal} onConfirm={handleConfirmDelete} onCancel={() => setShowConfirmModal(false)} title="Confirm Deletion" message="Are you sure you want to delete this category?" />
    </CategoriesPageContainer>
  );
};

export default Categories;