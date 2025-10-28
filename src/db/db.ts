
import Dexie, { type Table } from 'dexie';
import type { Category, Hardware, User, Note, AuditLog } from '../types/database';

export class MySubClassedDexie extends Dexie {
  categories!: Table<Category>;
  hardware!: Table<Hardware>;
  users!: Table<User>;
  notes!: Table<Note>;
  audit_log!: Table<AuditLog>;

  constructor() {
    super('smart-stock-app-db');
    // FIX: Cast `this` to Dexie to resolve a potential TypeScript type resolution issue.
    (this as Dexie).version(3).stores({
      categories: 'id, name, is_deleted, updated_at',
      hardware: 'id, updated_at, description, is_deleted, category_id',
      users: 'id, email',
      notes: 'id, is_deleted, updated_at',
      audit_log: 'id, item_id, created_at, is_synced',
    });
  }
}

export const db = new MySubClassedDexie();
