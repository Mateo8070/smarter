import Dexie from 'dexie';
import { db } from '../db/db';
import { supabase } from '../services/supabase';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';

export const syncWithBackend = async () => {
  console.log('--- Starting Sync ---');
  const lastSyncedAt = localStorage.getItem('lastSyncedAt') || new Date(0).toISOString();
  console.log('Last Synced At:', lastSyncedAt);

  // --- 1. PUSH local changes to remote ---
  const localHardwareChanges = await db.hardware.where('updated_at').above(lastSyncedAt).toArray();
  const localNotesChanges = await db.notes.where('updated_at').above(lastSyncedAt).toArray();
  const localCategoriesChanges = await db.categories.where('updated_at').above(lastSyncedAt).toArray();
  const localAuditLogs = await db.audit_log.where('is_synced').equals(0).toArray();

  console.log('Local changes to push:', {
    hardware: localHardwareChanges.length,
    notes: localNotesChanges.length,
    categories: localCategoriesChanges.length,
    auditLogs: localAuditLogs.length,
  });

  let pushedCount = 0;
  try {
    if (localCategoriesChanges.length > 0) {
      console.log('Pushing categories:', localCategoriesChanges);
      const { error } = await supabase.from('categories').upsert(localCategoriesChanges as any, { onConflict: 'id' });
      if (error) throw new Error(`Failed to send category changes to the cloud. Details: ${error.message}`);
      pushedCount += localCategoriesChanges.length;
      console.log('Categories pushed successfully.');
    }
    if (localHardwareChanges.length > 0) {
      console.log('Pushing hardware:', localHardwareChanges);
      const { error } = await supabase.from('hardware').upsert(localHardwareChanges as any, { onConflict: 'id' });
      if (error) throw new Error(`Failed to send inventory changes to the cloud. Details: ${error.message}`);
      pushedCount += localHardwareChanges.length;
      console.log('Hardware pushed successfully.');
    }
    if (localNotesChanges.length > 0) {
      console.log('Pushing notes:', localNotesChanges);
      const { error } = await supabase.from('notes').upsert(localNotesChanges as any, { onConflict: 'id' });
      if (error) throw new Error(`Failed to send note changes to the cloud. Details: ${error.message}`);
      pushedCount += localNotesChanges.length;
      console.log('Notes pushed successfully.');
    }
    if (localAuditLogs.length > 0) {
      console.log('Pushing audit logs:', localAuditLogs);
      // Create a new array of log objects without the 'is_synced' property
      const logsToInsert = localAuditLogs.map(({ is_synced, ...rest }) => rest);
      const { error } = await supabase.from('audit_log').insert(logsToInsert as any);
      if (error) throw new Error(`Failed to send audit logs to the cloud. Details: ${error.message}`);
      pushedCount += localAuditLogs.length;
      // Mark audit logs as synced locally
      await db.audit_log.bulkUpdate(localAuditLogs.map(log => ({ key: log.id, changes: { is_synced: 1 } })));
      console.log('Audit logs pushed and marked as synced successfully.');
    }
  } catch (error) {
    console.error('Error pushing changes to Supabase:', error);
    throw error;
  }

  // --- 2. PULL remote changes to local ---
  const newSyncedAt = new Date().toISOString();
  let pulledCount = 0;

  try {
    console.log('Pulling remote changes from Supabase...');
    const { data: remoteCategories, error: categoriesError } = await supabase.from('categories').select('*');
    if (categoriesError) throw new Error(`Failed to get category updates from the cloud. Details: ${categoriesError.message}`);
    console.log('Fetched remote categories:', remoteCategories?.length, remoteCategories);

    const { data: remoteHardware, error: hardwareError } = await supabase.from('hardware').select('*');
    if (hardwareError) {
      console.error('Supabase hardware fetch error details:', hardwareError);
      throw new Error(`Failed to get inventory updates from the cloud. Details: ${hardwareError.message}`);
    }
    console.log('Fetched remote hardware:', remoteHardware?.length, remoteHardware);

    const { data: remoteNotes, error: notesError } = await supabase.from('notes').select('*');
    if (notesError) {
      console.error('Supabase notes fetch error details:', notesError);
      throw new Error(`Failed to get note updates from the cloud. Details: ${notesError.message}`);
    }
    console.log('Fetched remote notes:', remoteNotes?.length, remoteNotes);

    const { data: remoteAuditLogs, error: auditLogError } = await supabase.from('audit_log').select('*');
    if (auditLogError) {
      console.error('Supabase audit log fetch error details:', auditLogError);
      throw new Error(`Failed to get audit log updates from the cloud. Details: ${auditLogError.message}`);
    }
    console.log('Fetched remote audit logs:', remoteAuditLogs?.length, remoteAuditLogs);

    pulledCount = (remoteCategories?.length || 0) + (remoteHardware?.length || 0) + (remoteNotes?.length || 0) + (remoteAuditLogs?.length || 0);

    // --- 3. RECONCILE and save pulled data locally ---
    console.log('Reconciling and saving pulled data locally...');
    // FIX: Cast `db` to Dexie to resolve a potential TypeScript type resolution issue.
    await (db as Dexie).transaction('rw', db.categories, db.hardware, db.notes, db.audit_log, async () => {
      for (const category of remoteCategories || []) {
        try {
          await db.categories.put(category);
        } catch (e) {
          console.error('Error putting remote category to local DB:', category, e);
        }
      }

      for (const item of remoteHardware || []) {
        try {
          const localItem = await db.hardware.get(item.id);
          if (!localItem || new Date(item.updated_at || '') > new Date(localItem.updated_at || '')) {
            await db.hardware.put(item);
          }
        } catch (e) {
          console.error('Error putting remote hardware to local DB:', item, e);
        }
      }

      for (const note of remoteNotes || []) {
        try {
          const localNote = await db.notes.get(note.id);
          if (!localNote || new Date(note.updated_at || '') > new Date(localNote.updated_at || '')) {
            await db.notes.put(note);
          }
        } catch (e) {
          console.error('Error putting remote note to local DB:', note, e);
        }
      }

      for (const log of remoteAuditLogs || []) {
        try {
          await db.audit_log.put({ ...log, is_synced: 1 });
        } catch (e) {
          console.error('Error putting remote audit log to local DB:', log, e);
        }
      }
    });
    console.log('Local reconciliation complete.');

  } catch (error) {
    console.error('Error pulling or reconciling changes from Supabase:', error);
    throw error;
  }

  // --- 4. Update last synced timestamp ---
  localStorage.setItem('lastSyncedAt', newSyncedAt);
  console.log('Last Synced At updated to:', newSyncedAt);

      console.log('--- Sync Complete! Pushed:', pushedCount, 'Pulled:', pulledCount, '---');
  };

  export const syncToLocalBackend = async () => {
    console.log('--- Starting Sync with local backend ---');

    try {
      const categories = await db.categories.toArray();
      const hardware = await db.hardware.toArray();
      const notes = await db.notes.toArray();
      const audit_logs = await db.audit_log.toArray();

                const response = await fetch('http://16.170.212.254:3004/api/sync', {        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories, hardware, notes, audit_logs }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync with backend');
      }

      console.log('--- Sync to local backend Complete! ---');

    } catch (error) {
      console.error('Error syncing with local backend:', error);
      throw error;
    }
  };
  const SYNC_INTERVAL = 5000; // Sync every 5 seconds

  export const useSync = () => {
    const { addToast } = useToast();
    const lastSyncRef = useRef<number>(0);

    const categories = useLiveQuery(() => db.categories.where('is_deleted').equals(0).toArray(), []);
    const hardware = useLiveQuery(() => db.hardware.where('is_deleted').equals(0).toArray(), []);
    const notes = useLiveQuery(() => db.notes.where('is_deleted').equals(0).toArray(), []);
    const auditLogs = useLiveQuery(() => db.audit_log.where('is_synced').equals(0).toArray(), []);

    useEffect(() => {
      const syncData = async () => {
        const now = Date.now();
        if (now - lastSyncRef.current < SYNC_INTERVAL) {
          return; // Too soon to sync again
        }

        const dataToSync: { [key: string]: any[] } = {};

        if (categories && categories.length > 0) {
          dataToSync.categories = categories;
        }
        if (hardware && hardware.length > 0) {
          dataToSync.hardware = hardware;
        }
        if (notes && notes.length > 0) {
          dataToSync.notes = notes;
        }
        if (auditLogs && auditLogs.length > 0) {
          dataToSync.audit_logs = auditLogs;
        }

        if (Object.keys(dataToSync).length === 0) {
          // console.log("No data to sync.");
          return;
        }

        try {
      const response = await fetch('http://16.170.212.254:3004/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSync),
          });

          if (response.ok) {
            // Mark audit logs as synced after successful sync
            if (dataToSync.audit_logs) {
              const syncedLogIds = dataToSync.audit_logs.map(log => log.id);
              await db.audit_log.where('id').anyOf(syncedLogIds).modify({ is_synced: 1 });
            }
            // addToast('Sync successful', 'success');
            lastSyncRef.current = now;
          } else {
            addToast('Sync failed', 'error');
          }
        } catch (error) {
          console.error('Sync error:', error);
          addToast('Sync error', 'error');
        }
      };

      const intervalId = setInterval(syncData, SYNC_INTERVAL);

      return () => clearInterval(intervalId);
    }, [categories, hardware, notes, auditLogs, addToast]);
  };
