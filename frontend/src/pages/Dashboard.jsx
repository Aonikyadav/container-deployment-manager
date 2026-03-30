import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Play, Settings, Terminal, RefreshCw, Layers, Square, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { LiveLogsModal, HistoryModal } from '../components/Modals';

const Dashboard = () => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [logModal, setLogModal] = useState({ isOpen: false, id: null, name: '' });
  const [histModal, setHistModal] = useState({ isOpen: false, id: null, name: '' });

  const fetchDeployments = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getDeployments();
      setDeployments(res.data.data);
    } catch (err) {
      console.error('Failed to fetch deployments', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments(); 
    const intervalId = setInterval(() => fetchDeployments(true), 3500);
    return () => clearInterval(intervalId);
  }, []);

  const handleDeploy = async (id, name) => {
    const toastId = toast.loading(`Initiating deployment for ${name}...`);
    try {
      await api.triggerDeploy(id);
      toast.success(`Deployment complete for ${name}! Zero downtime swap successful.`, { id: toastId });
      fetchDeployments(true);
    } catch (err) {
      toast.error(`Deploy failed: ${err.response?.data?.error || err.message}`, { id: toastId });
    }
  };

  const handleStop = async (id, name) => {
    const toastId = toast.loading(`Initiating emergency stop for ${name}...`);
    try {
      await api.stopDeploy(id);
      toast.success(`${name} has been securely shut down.`, { id: toastId, icon: '🛑' });
      fetchDeployments(true);
    } catch (err) {
      toast.error(`Stop failed: ${err.response?.data?.error || err.message}`, { id: toastId });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you absolutely sure you want to completely eradicate ${name}, my king? This cannot be undone.`)) return;

    const toastId = toast.loading(`Nuking ${name} from existence...`);
    try {
      await api.deleteDeploy(id);
      toast.success(`${name} has been permanently eradicated.`, { id: toastId, icon: '🗑️' });
      fetchDeployments(true);
    } catch (err) {
      toast.error(`Eradication failed: ${err.response?.data?.error || err.message}`, { id: toastId });
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingTop: '20px' }}>
      
      {/* View Modals */}
      <LiveLogsModal 
        isOpen={logModal.isOpen} 
        onClose={() => setLogModal({ isOpen: false, id: null, name: '' })} 
        deploymentId={logModal.id} 
        name={logModal.name} 
      />
      <HistoryModal 
        isOpen={histModal.isOpen} 
        onClose={() => setHistModal({ isOpen: false, id: null, name: '' })} 
        deploymentId={histModal.id} 
        name={histModal.name} 
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 8px 0' }}>Deployments</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage your container environments.</p>
        </div>
        <button onClick={() => fetchDeployments()} className="btn-secondary" style={{ padding: '8px' }}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading your resources...
        </div>
      ) : deployments.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <Layers size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>No deployments found</h3>
          <p>Create a new deployment configuration to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {deployments.map((dep) => (
            <div key={dep._id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 6px 0' }}>{dep.name}</h3>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <code>{dep.image}:{dep.version}</code>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className={`badge-${dep.status === 'running' ? dep.currentEnvironment : dep.status}`} style={{ textTransform: 'capitalize' }}>
                    {dep.status === 'running' ? `${dep.currentEnvironment} Active` : dep.status}
                  </span>
                  <button 
                    onClick={() => handleDelete(dep._id, dep.name)}
                    title="Eradicate Deployment forever"
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0', opacity: 0.6, transition: '0.2s', marginTop: '2px' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Blue Port</span>
                  <strong>{dep.bluePort}</strong>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Green Port</span>
                  <strong>{dep.greenPort}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '8px' }}>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1, padding: '8px', opacity: dep.status === 'deploying' ? 0.7 : 1 }}
                  onClick={() => handleDeploy(dep._id, dep.name)}
                  disabled={dep.status === 'deploying'}
                >
                  <Play size={16} /> {dep.status === 'deploying' ? 'Deploying...' : 'Deploy'}
                </button>
                <button 
                  className="btn-primary" 
                  style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', opacity: (dep.status === 'stopped' || dep.status === 'pending') ? 0.4 : 1 }}
                  onClick={() => handleStop(dep._id, dep.name)}
                  title="Emergency Stop Container"
                  disabled={dep.status === 'stopped' || dep.status === 'pending' || dep.status === 'deploying'}
                >
                  <Square size={16} fill="currentColor" />
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '8px' }} 
                  onClick={() => setLogModal({ isOpen: true, id: dep._id, name: dep.name })}
                >
                  <Terminal size={16} />
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '8px' }} 
                  onClick={() => setHistModal({ isOpen: true, id: dep._id, name: dep.name })}
                >
                  <Settings size={16} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
