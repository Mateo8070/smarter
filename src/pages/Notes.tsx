import React, { useState } from 'react';
import {
  NotesPageContainer,
  CardView,
  Card,
  FloatingActionButton,
  ActionButton,
  DeleteButton,
  Toolbar,
  PrimaryButton
} from './Notes.styles';
import { useDb } from '../hooks/useDb';
import type { Note } from '../types/database';
import Modal from '../components/Modal';
import NoteForm from '../components/NoteForm';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../components/Toast';
import { EditIcon, TrashIcon, PlusIcon } from '../components/Icons';
import { useMediaQuery } from '../hooks/useMediaQuery';

const Notes: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote } = useDb();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Note | undefined>(undefined);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const { addToast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleAddItem = async (item: Partial<Note>) => {
    if (!addNote) return;
    await addNote({
      ...item,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    } as Note);
    setShowForm(false);
    addToast('Note added', 'success');
  };

  const handleEdit = (item: Note) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleUpdateItem = async (item: Partial<Note>) => {
    if (!updateNote || !editingItem) return;
    await updateNote(editingItem.id, { ...item, updated_at: new Date().toISOString() });
    setShowForm(false);
    setEditingItem(undefined);
    addToast('Note updated', 'success');
  };

  const handleDeleteClick = (id: string) => {
    setNoteToDeleteId(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteNote || !noteToDeleteId) return;
    await deleteNote(noteToDeleteId);
    setShowConfirmModal(false);
    setNoteToDeleteId(null);
    addToast('Note deleted', 'success');
  };

  return (
    <NotesPageContainer>
      <Toolbar>
        <div /> {/* Spacer */}
        {!isMobile && (
          <PrimaryButton onClick={() => { setEditingItem(undefined); setShowForm(true); }}>
            <PlusIcon /> Add Note
          </PrimaryButton>
        )}
      </Toolbar>

      <CardView>
        {notes?.filter((n) => !n.is_deleted).map((item) => (
          <Card key={item.id}>
            <div className="card-content">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
            <div className="card-footer">
              <ActionButton onClick={() => handleEdit(item)}><EditIcon /></ActionButton>
              <DeleteButton onClick={() => handleDeleteClick(item.id)}><TrashIcon /></DeleteButton>
            </div>
          </Card>
        ))}
      </CardView>

      {isMobile && (
        <FloatingActionButton onClick={() => { setEditingItem(undefined); setShowForm(true); }} aria-label="Add Note">
          <PlusIcon />
        </FloatingActionButton>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingItem ? 'Edit Note' : 'Add Note'}>
        <NoteForm onSubmit={editingItem ? handleUpdateItem : handleAddItem} initialItem={editingItem} />
      </Modal>

      <ConfirmationModal isOpen={showConfirmModal} onConfirm={handleConfirmDelete} onCancel={() => setShowConfirmModal(false)} title="Confirm Deletion" message="Are you sure you want to delete this note?" />
    </NotesPageContainer>
  );
};

export default Notes;
