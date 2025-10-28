import styled from 'styled-components';

export const AuditLogPageContainer = styled.div`
  padding: 24px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const AuditTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    border-bottom: 1px solid var(--border);
    padding: 14px 16px;
    text-align: left;
    color: var(--text-primary);
  }
  
  td:nth-child(2) {
    white-space: normal;
    word-break: break-word;
    min-width: 300px;
  }

  th {
    background-color: var(--background);
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  tbody tr:nth-of-type(even) {
    background-color: var(--background);
  }

  tbody tr:hover {
    background-color: var(--surface-variant);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

export const AuditCardContainer = styled.div`
  display: grid;
  gap: 12px;
`;

export const AuditCard = styled.div`
  padding: 16px;
  background: var(--surface);
  border-radius: 8px;
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  .description {
    font-size: 15px;
    color: var(--text-primary);
    word-break: break-word;
    margin-bottom: 8px;
  }

  .meta {
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;
