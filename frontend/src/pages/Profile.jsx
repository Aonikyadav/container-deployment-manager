import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Key } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="animate-fade-in" style={{ paddingTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>User Profile</h2>
      </div>

      <div className="glass-panel" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '100px', height: '100px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-glow))',
            display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px'
          }}>
            <User size={48} color="white" />
          </div>
          <h3 style={{ fontSize: '1.5rem', margin: '0 0 8px 0' }}>{user.name}</h3>
          <span className="badge-running" style={{ textTransform: 'uppercase' }}>{user.role}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <Mail size={24} color="var(--primary-color)" />
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email Address</div>
              <div style={{ fontSize: '1.1rem' }}>{user.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <Shield size={24} color="var(--primary-color)" />
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Account ID</div>
              <div style={{ fontSize: '1.1rem', fontFamily: 'monospace' }}>{user._id}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <Key size={24} color="var(--primary-color)" />
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Access Level</div>
              <div style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>{user.role} Privileges</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
