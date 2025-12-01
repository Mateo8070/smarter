import Dexie from 'dexie';
import { db } from '../db/db';
import { supabase } from '../services/supabase';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';
//added a comment
export const syncWithBackend = async () => {
  console.log('--- Starting Sync ---');
  const syncId = crypto.randomUUID();
  try {
    await db.system_logs.add({
      id: syncId,
      timestamp: new Date().toISOString(),
      log_level: 'INFO',
      error_message: 'Sync with backend started',
      phone_info: navigator.userAgent,
      last_synced_at: localStorage.getItem('lastSyncedAt'),
    });

    const lastSyncedAt = localStorage.getItem('lastSyncedAt') || new Date(0).toISOString();
    console.log('Current UTC time:', new Date().toISOString());
    console.log('Last Synced At:', lastSyncedAt);

    // --- 1. PUSH local changes to remote ---
    console.log('Querying local audit logs created after:', lastSyncedAt);
    const localAuditLogs = await db.audit_log.where('created_at').above(lastSyncedAt).toArray();

    if (localAuditLogs.length === 0) {
      console.log('No local audit logs found created after Last Synced At.');
    } else {
      console.log('Local Audit Logs found:', localAuditLogs.length, localAuditLogs.slice(0, 5)); // Log first 5 for brevity
      localAuditLogs.slice(0, 5).forEach(log => {
          console.log(`  Audit Log created_at: ${log.created_at}, Item ID: ${log.item_id}`);
      });
    }

    const itemIdsToSync = [...new Set(localAuditLogs.map(log => log.item_id))];
    console.log('Item IDs to sync based on audit logs:', itemIdsToSync);
    const localHardwareChanges = itemIdsToSync.length > 0
      ? await db.hardware.where('id').anyOf(itemIdsToSync).toArray()
      : [];

    const localNotesChanges = await db.notes.where('updated_at').above(lastSyncedAt).toArray();
    const localCategoriesChanges = await db.categories.where('updated_at').above(lastSyncedAt).toArray();

    // Fetch all categories for name mapping
    const allCategories = await db.categories.toArray();
    const categoryIdToNameMap = new Map(allCategories.map(cat => [cat.id, cat.name]));

    // Create a map of item_id to its latest audit log created_at
    const latestAuditLogTimestamps = new Map<string, string>();
    for (const log of localAuditLogs) {
        if (!latestAuditLogTimestamps.has(log.item_id) || log.created_at > latestAuditLogTimestamps.get(log.item_id)!) {
            latestAuditLogTimestamps.set(log.item_id, log.created_at);
        }
    }

    const hardwareToPush = localHardwareChanges.map(item => {
      const auditCreatedAt = latestAuditLogTimestamps.get(item.id);
      const categoryName = categoryIdToNameMap.get(item.category_id || '');
      return {
          ...item,
          is_deleted: false, // Ensure it's explicitly false
          updated_at: auditCreatedAt || item.updated_at || new Date(0).toISOString(), // Use audit log's created_at, or item's updated_at, or a default.
          category: categoryName || null // Add category name
      };
    });

    console.log('Local changes to push:', {
      hardware: hardwareToPush.length,
      notes: localNotesChanges.length,
      categories: localCategoriesChanges.length,
      auditLogs: localAuditLogs.length,
    });


    let pushedCount = 0;
    if (hardwareToPush.length > 0) {
      console.log('Pushing hardware:', hardwareToPush);
      const { error } = await supabase.from('hardware').upsert(hardwareToPush as any, { onConflict: 'id' });
      if (error) throw new Error(`Failed to send inventory changes to the cloud. Details: ${error.message}`);
      pushedCount += hardwareToPush.length;
      console.log('Hardware pushed successfully.');
    }
    if (localCategoriesChanges.length > 0) {
      console.log('Pushing categories:', localCategoriesChanges);
      const { error } = await supabase.from('categories').upsert(localCategoriesChanges as any, { onConflict: 'id' });
      if (error) throw new Error(`Failed to send category changes to the cloud. Details: ${error.message}`);
      pushedCount += localCategoriesChanges.length;
      console.log('Categories pushed successfully.');
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
      console.log('Audit logs pushed successfully.');
    }

    // --- 2. PULL remote changes to local ---
    const newSyncedAt = new Date().toISOString();
    let pulledCount = 0;

    console.log('Pulling remote changes from Supabase...');
    const { data: remoteCategories, error: categoriesError } = await supabase.from('categories').select('*');
    if (categoriesError) throw new Error(`Failed to get category updates from the cloud. Details: ${categoriesError.message}`);
    console.log('Fetched remote categories:', remoteCategories?.length, remoteCategories);

    const { data: remoteHardware, error: hardwareError } = await supabase.from('hardware').select('*');
    if (hardwareError) {
      console.error('Supabase hardware fetch error details:', hardwareError);
      throw new Error(`Failed to get inventory updates from the cloud. Details: ${hardwareError.message}`);
    }
    console.log('Fetched remote hardware items:', remoteHardware?.length, remoteHardware);

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

    // --- 4. Update last synced timestamp ---
    // If local audit logs were found and pushed, update lastSyncedAt to the latest created_at of those logs.
    // Otherwise, lastSyncedAt should not change based on current time.
    if (localAuditLogs.length > 0 && pushedCount > 0) {
      const latestPushedAuditLogTime = localAuditLogs.reduce((maxDate, log) => {
        return log.created_at > maxDate ? log.created_at : maxDate;
      }, new Date(0).toISOString());
      localStorage.setItem('lastSyncedAt', latestPushedAuditLogTime);
      console.log('Last Synced At updated to latest pushed audit log time:', latestPushedAuditLogTime);
    } else {
      console.log('No local audit logs were pushed, Last Synced At remains unchanged.');
    }

    await db.system_logs.add({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      log_level: 'INFO',
      error_message: 'Sync with backend completed successfully',
      context: { syncId, pushedCount, pulledCount },
      phone_info: navigator.userAgent,
      last_synced_at: localStorage.getItem('lastSyncedAt'),
    });
    console.log('--- Sync Complete! Pushed:', pushedCount, 'Pulled:', pulledCount, '---');
  } catch (error) {
    await db.system_logs.add({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      log_level: 'ERROR',
      error_message: 'Sync with backend failed',
      full_error_details: { error: error instanceof Error ? error.message : String(error) },
      context: { syncId },
      phone_info: navigator.userAgent,
      last_synced_at: localStorage.getItem('lastSyncedAt'),
    });
    console.error('Error pushing changes to Supabase:', error);
    throw error;
  }
};

  export const syncToLocalBackend = async () => {
    console.log('--- Starting Sync with local backend ---');
    const syncId = crypto.randomUUID();
    try {
      await db.system_logs.add({
        id: syncId,
        timestamp: new Date().toISOString(),
        log_level: 'INFO',
        error_message: 'Sync started',
        phone_info: navigator.userAgent,
        last_synced_at: localStorage.getItem('lastSyncedAt'),
      });

      const categories = await db.categories.toArray();
      const hardware = await db.hardware.toArray();
      const notes = await db.notes.toArray();
      const audit_logs = await db.audit_log.toArray();

                const response = await fetch('https://smart-backend-06fj.onrender.com/api/sync', {        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories, hardware, notes, audit_logs }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync with backend');
      }

      await db.system_logs.add({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        log_level: 'INFO',
        error_message: 'Sync completed successfully',
        context: { syncId },
        phone_info: navigator.userAgent,
        last_synced_at: localStorage.getItem('lastSyncedAt'),
      });
      console.log('--- Sync to local backend Complete! ---');

    } catch (error) {
      await db.system_logs.add({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        log_level: 'ERROR',
        error_message: 'Sync failed',
        full_error_details: { error: error instanceof Error ? error.message : String(error) },
        context: { syncId },
        phone_info: navigator.userAgent,
        last_synced_at: localStorage.getItem('lastSyncedAt'),
      });
      console.error('Error syncing with local backend:', error);
      throw error;
    }
  };
  export const useSync = () => {
  const { addToast } = useToast();
  const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const periodicSync = async () => {
      try {
        await syncToLocalBackend();
        // No success toast for automatic background sync
      } catch (error) {
        console.error('Periodic sync failed:', error);
        addToast('Automatic background sync failed.', 'error');
      }
    };

    const intervalId = setInterval(periodicSync, SYNC_INTERVAL);

    return () => clearInterval(intervalId);
  }, [addToast]);
};
