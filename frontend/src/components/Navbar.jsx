import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Activity, User as UserIcon, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(20, 20, 25, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #c77dff, #9d4edd)',
          padding: '8px', borderRadius: '8px'
        }}>
          <Activity size={20} color="white" />
        </div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
          <span className="text-gradient">Blue</span>Green
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <NavLink 
          to="/dashboard" 
          style={({ isActive }) => ({
            textDecoration: 'none',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: isActive ? '600' : '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'color 0.2s'
          })}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        {user && user.role === 'admin' && (
          <NavLink 
            to="/admin" 
            style={({ isActive }) => ({
              textDecoration: 'none',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? '600' : '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: '0.2s'
            })}
          >
            <Shield size={18} />
            Admin Panel
          </NavLink>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <NavLink to="/create" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.9rem', textDecoration: 'none' }}>
          <PlusCircle size={16} />
          New Deployment
        </NavLink>
        
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px', borderLeft: '1px solid var(--border-color)' }}>
            <NavLink to="/profile" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: '0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='var(--primary-glow)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-primary)'}>
              <UserIcon size={16} color="var(--primary-color)" />
              {user.name}
            </NavLink>
            <button onClick={logout} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0.8, transition: '0.2s' }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.8} title="Log Off">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
