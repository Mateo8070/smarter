import React, { useState } from 'react';
import { useDb } from '../hooks/useDb';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../components/Toast';
import { syncToLocalBackend } from '../utils/sync';
import {
  SettingsPageContainer,
  SettingsCard,
  SettingsTitle,
  SettingsParagraph,
  ClearDatabaseButton,
  SyncButton,
} from './Settings.styles';

interface SettingsProps {
  setPage: (page: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ setPage }) => {
  const { clearDatabase } = useDb();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { addToast } = useToast();

  const handleConfirmClearDatabase = async () => {
    if (!clearDatabase) return;
    try {
      await clearDatabase();
      addToast('Local database cleared!', 'success');
    } catch (error) {
      addToast('Failed to clear database.', 'error');
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleSync = async () => {
    try {
      await syncToLocalBackend();
      addToast('Sync with backend successful!', 'success');
    } catch (error) {
      addToast('Failed to sync with backend.', 'error');
    }
  };

  return (
    <SettingsPageContainer>
      <SettingsCard>
        <SettingsTitle>Local Data Management</SettingsTitle>
        <SettingsParagraph>
          This action will permanently delete all local data stored in your browser, including stock items, notes, and categories. This cannot be undone. Your data on the server will not be affected.
        </SettingsParagraph>
        <ClearDatabaseButton onClick={() => setShowConfirmModal(true)}>
          Clear Local Database
        </ClearDatabaseButton>
      </SettingsCard>

      <SettingsCard>
        <SettingsTitle>Backend Synchronization</SettingsTitle>
        <SettingsParagraph>
          Manually sync your local data with the backend server. This is useful if you suspect your local data is out of date.
        </SettingsParagraph>
        <SyncButton onClick={handleSync}>
          Sync with Backend
        </SyncButton>
      </SettingsCard>

      <SettingsCard>
        <SettingsTitle>System</SettingsTitle>
        <SettingsParagraph>
          View system logs to diagnose issues.
        </SettingsParagraph>
        <SyncButton onClick={() => setPage('system-logs')}>
          System Logs
        </SyncButton>
      </SettingsCard>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmClearDatabase}
        onCancel={() => setShowConfirmModal(false)}
        title="Confirm Database Clear"
        message="Are you sure you want to delete all local data? This is irreversible."
      />
    </SettingsPageContainer>
  );
};

export default Settings;
