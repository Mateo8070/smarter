import React, { useMemo } from 'react';
import { useDb } from '../hooks/useDb';
import {
  AuditLogPageContainer,
  AuditTable,
  AuditCardContainer,
  AuditCard,
} from './AuditLog.styles';
import { useMediaQuery } from '../hooks/useMediaQuery';

const AuditLog: React.FC<{ itemId?: string | null }> = ({ itemId }) => {
  const { auditLog, hardware } = useDb();
  
  const filteredLog = useMemo(() => {
    if (!auditLog || !hardware) return [];

    const logs = (itemId ? auditLog.filter(l => l.item_id === itemId) : auditLog)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return logs.filter(log => {
      const associatedHardware = hardware.find(h => h.id === log.item_id);
      // If no associated hardware, or if hardware exists and is not deleted, include the log
      return !associatedHardware || !associatedHardware.is_deleted;
    });
  }, [auditLog, hardware, itemId]);

  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <AuditLogPageContainer>
      {isMobile ? (
        <AuditCardContainer>
          {filteredLog?.map(log => (
            <AuditCard key={log.id}>
              <div className="description">{log.change_description}</div>
              <div className="meta">
                <span>{hardware?.find(h => h.id === log.item_id)?.description || 'System'}</span>
                <span>•</span>
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </AuditCard>
          ))}
        </AuditCardContainer>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <AuditTable>
            <thead>
              <tr>
                <th>Item</th>
                <th>Change Description</th>
                <th>User</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLog?.map((log) => (
                <tr key={log.id}>
                  <td>{hardware?.find(h => h.id === log.item_id)?.description || log.item_id}</td>
                  <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{log.change_description}</td>
                  <td>{log.username || 'System'}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </AuditTable>
        </div>
      )}
    </AuditLogPageContainer>
  );
};

export default AuditLog;
