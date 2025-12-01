
import React, { useState, useEffect } from 'react';
import { db } from '../db/db';
import type { SystemLog } from '../types/database';
import { Container, LogTable, LogRow, LogCell } from './SystemLogs.styles';

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const allLogs = await db.system_logs.toArray();
      setLogs(allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };

    fetchLogs();
  }, []);

  return (
    <Container>
      <h1>System Logs</h1>
      <LogTable>
        <thead>
          <LogRow>
            <LogCell as="th">Timestamp</LogCell>
            <LogCell as="th">Level</LogCell>
            <LogCell as="th">Message</LogCell>
            <LogCell as="th">Phone Info</LogCell>
            <LogCell as="th">Last Synced At</LogCell>
            <LogCell as="th">Context</LogCell>
            <LogCell as="th">Error Details</LogCell>
          </LogRow>
        </thead>
        <tbody>
          {logs.map((log) => (
            <LogRow key={log.id}>
              <LogCell>{new Date(log.timestamp).toLocaleString()}</LogCell>
              <LogCell>{log.log_level}</LogCell>
              <LogCell>{log.error_message}</LogCell>
              <LogCell>{log.phone_info}</LogCell>
              <LogCell>{log.last_synced_at ? new Date(log.last_synced_at).toLocaleString() : '-'}</LogCell>
              <LogCell>{log.context ? JSON.stringify(log.context) : '-'}</LogCell>
              <LogCell>{log.full_error_details ? JSON.stringify(log.full_error_details) : '-'}</LogCell>
            </LogRow>
          ))}
        </tbody>
      </LogTable>
    </Container>
  );
};

export default SystemLogs;
