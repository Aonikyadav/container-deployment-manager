import React, { useEffect, useState, useRef } from 'react';
import { X, ExternalLink, Activity, Terminal as TerminalIcon, Trash2, RefreshCw } from 'lucide-react';
import api from '../api/client';

export const Modal = ({ isOpen, onClose, title, children, icon, maxWidth = '800px' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', // Center modals vertically
      overflowY: 'auto',
      padding: '20px' // Normalized padding
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: maxWidth,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', padding: 0,
        boxShadow: '0 0 40px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        maxHeight: '90vh' // Ensure modal doesn't exceed viewport height
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(20, 20, 25, 0.95)',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {icon}
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            title="Close Modal"
            style={{
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              borderRadius: '6px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
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
          const { stdout, stderr } = res.data.data;
          if (stdout === '' && stderr === '') {
            setLogs(['Connecting to container output stream...', 'Waiting for initial logs...']);
          } else {
            const combinedLogs = (stdout + '\n' + stderr).split('\n').filter(line => line.trim() !== '');
            setLogs(combinedLogs);
          }
        } catch (e) {
          setLogs(['Scanning for running container...', 'Attempting to establish log stream connection...']);
        }
      };
      fetchLogs();
      interval = setInterval(fetchLogs, 1000); // Snappier 1s interval
    }
    return () => clearInterval(interval);
  }, [isOpen, deploymentId]);

  const logContainerRef = useRef(null);
  
  useEffect(() => {
    if (logContainerRef.current) {
      const container = logContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Live Logs: ${name}`} icon={<TerminalIcon color="var(--accent-primary)" />}>
      <div 
        ref={logContainerRef}
        style={{
          background: '#050505',
        borderRadius: '8px',
        padding: '16px',
        fontFamily: 'monospace',
        color: '#00ff41',
        height: '400px',
        overflowY: 'auto',
        fontSize: '0.9rem',
        border: '1px solid #333',
        scrollBehavior: 'smooth'
      }}>
        {logs.length === 0 ? 'Connecting to terminal stream...' : logs.map((line, i) => (
          <div key={i} style={{ wordBreak: 'break-all', marginBottom: '4px' }}>{line}</div>
        ))}
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

export const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, name, loading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm to delete" icon={<Trash2 color="#ef4444" />} maxWidth="600px">
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          background: 'rgba(239, 68, 68, 0.1)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' 
        }}>
          <Trash2 size={32} color="#ef4444" />
        </div>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Are you absolutely sure?</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
          This will permanently delete <strong>{name}</strong> and all its associated container logs and configurations. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }} disabled={loading}>
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="btn-primary" 
            style={{ flex: 1, padding: '12px', background: '#ef4444', borderColor: '#ef4444' }}
            disabled={loading}
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};




