
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Hardware, Category, Note, AuditLog } from '../types/database';

export function useDb() {
  const hardware = useLiveQuery(() => db.hardware.toArray());
  const notes = useLiveQuery(() => db.notes.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const auditLog = useLiveQuery(() => db.audit_log.toArray());

  const addHardware = async (item: Hardware) => {
    return await db.hardware.add(item);
  };

  const updateHardware = async (id: string, updates: Partial<Hardware>) => {
    return await db.hardware.update(id, updates);
  };

  const deleteHardware = async (id: string) => {
    return await db.hardware.update(id, {
      is_deleted: true,
      updated_at: new Date().toISOString(),
    });
  };

  const addNote = async (note: Note) => {
    return await db.notes.add(note);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    return await db.notes.update(id, updates);
  };

  const deleteNote = async (id: string) => {
    return await db.notes.update(id, {
      is_deleted: true,
      updated_at: new Date().toISOString(),
    });
  };

  const addCategory = async (category: Category) => {
    return await db.categories.add(category);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    return await db.categories.update(id, updates);
  };

  const deleteCategory = async (id: string) => {
    return await db.categories.update(id, {
      is_deleted: true,
      updated_at: new Date().toISOString(),
    });
  };

  const addAuditLog = async (log: AuditLog) => {
    return await db.audit_log.add(log);
  };

  const clearDatabase = async () => {
    await Promise.all([
      db.hardware.clear(),
      db.notes.clear(),
      db.categories.clear(),
      db.audit_log.clear(),
    ]);
  };

  return {
    hardware,
    notes,
    categories,
    auditLog,
    addHardware,
    updateHardware,
    deleteHardware,
    addNote,
    updateNote,
    deleteNote,
    addCategory,
    updateCategory,
    deleteCategory,
    addAuditLog,
    clearDatabase,
  };
}