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
} from './Categories.styles';
import { EditIcon, TrashIcon, PlusIcon, SearchIcon } from '../components/Icons';
import ColorPickerModal from '../components/ColorPickerModal';
import { useMediaQuery } from '../hooks/useMediaQuery';

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
