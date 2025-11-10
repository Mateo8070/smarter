import styled from 'styled-components';

export const SettingsPageContainer = styled.div`
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  
  @media (max-width: 768px) {
    padding: 24px;
  }
`;

export const SettingsCard = styled.div`
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
`;

export const SettingsTitle = styled.h2`
  font-size: 20px;
  margin-top: 0;
  margin-bottom: 8px;
`;

export const SettingsParagraph = styled.p`
  color: var(--text-secondary);
  margin-bottom: 24px;
  font-size: 15px;
  line-height: 1.6;
`;

export const ClearDatabaseButton = styled.button`
  background-color: var(--danger);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
`;

export const SyncButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.9;
  }
`;
