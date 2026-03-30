import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Activity, Terminal as TerminalIcon } from 'lucide-react';
import api from '../api/client';

export const Modal = ({ isOpen, onClose, title, children, icon }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '800px',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', padding: 0
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {icon}
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
          }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const LiveLogsModal = ({ isOpen, onClose, deploymentId, name }) => {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    let interval;
    if (isOpen && deploymentId) {
      const fetchLogs = async () => {
        try {
          const res = await api.getLogs(deploymentId);
          setLogs(res.data.data.split('\n'));
        } catch (e) {
          setLogs(['Error fetching logs...']);
        }
      };
      fetchLogs();
      interval = setInterval(fetchLogs, 3000);
    }
    return () => clearInterval(interval);
  }, [isOpen, deploymentId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Live Logs: ${name}`} icon={<TerminalIcon color="var(--accent-primary)" />}>
      <div style={{
        background: '#050505',
        borderRadius: '8px',
        padding: '16px',
        fontFamily: 'monospace',
        color: '#00ff41',
        height: '400px',
        overflowY: 'auto',
        fontSize: '0.9rem',
        border: '1px solid #333'
      }}>
        {logs.length === 0 ? 'Waiting for container output...' : logs.map((line, i) => (
          <div key={i} style={{ wordBreak: 'break-all', marginBottom: '4px' }}>{line}</div>
        ))}
        {/* Helper to keep scroll at bottom would go here */}
      </div>
    </Modal>
  );
};

export const HistoryModal = ({ isOpen, onClose, deploymentId, name }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen && deploymentId) {
      const fetchHistory = async () => {
        try {
          const res = await api.getHistory(deploymentId);
          setHistory(res.data.data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchHistory();
    }
  }, [isOpen, deploymentId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Deployment History: ${name}`} icon={<Activity color="var(--status-blue)" />}>
      {history.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No historical events found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map((event, i) => (
            <div key={i} style={{ 
              display: 'flex', gap: '16px', padding: '16px', 
              background: 'rgba(255,255,255,0.03)', borderRadius: '8px', 
              borderLeft: `4px solid ${event.environment === 'blue' ? 'var(--status-blue)' : 'var(--status-green)'}`
            }}>
              <div style={{ minWidth: '100px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {new Date(event.startedAt || event.createdAt).toLocaleString()}
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {event.status}
                </strong>
                <span className={`badge-${event.environment}`}>{event.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
