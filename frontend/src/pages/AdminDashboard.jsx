import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Users, Layout, ShieldCheck, User as UserIcon, Activity, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalDeployments: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers()
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      toast.error(`Admin telemetry error: ${errorMsg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Retrieving system-wide analytics...
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingTop: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ShieldCheck size={28} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Administrative Control</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>System-wide monitoring and user management.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(157, 78, 221, 0.1)', padding: '16px', borderRadius: '12px' }}>
            <Users size={32} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Registered Users</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalUsers}</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(58, 134, 255, 0.1)', padding: '16px', borderRadius: '12px' }}>
            <Layout size={32} color="#3a86ff" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Active Global Deployments</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalDeployments}</div>
          </div>
        </div>
      </div>

      {/* Users Detail Section */}
      <h3 style={{ marginBottom: '20px', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Activity size={20} color="var(--accent-primary)" /> Detailed User Activity
      </h3>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600 }}>User Identity</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600 }}>Deployments</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600 }}>Application Names</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                    <UserIcon size={16} style={{ opacity: 0.5 }} /> {u.name}
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{u.email}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    background: 'rgba(157, 78, 221, 0.1)', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    color: 'var(--accent-primary)',
                    fontWeight: 600
                  }}>
                    {u.deploymentCount} Active
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {u.deployments.length > 0 ? u.deployments.map((d, i) => (
                      <span key={i} style={{ 
                        fontSize: '0.75rem', 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {d.name}
                      </span>
                    )) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>None</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminDashboard;
