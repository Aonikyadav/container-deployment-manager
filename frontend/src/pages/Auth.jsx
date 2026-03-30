import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Mail, Key, User } from 'lucide-react';

const Auth = ({ mode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(isLogin ? 'Authenticating...' : 'Creating profile...');
    
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Login successful', { id: toastId });
      } else {
        await register(name, email, password);
        toast.success('Registration successful', { id: toastId });
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <Shield size={48} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 8px 0' }}>
          {isLogin ? 'Command Center' : 'System Registration'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {isLogin ? 'Authenticate to access your deployments.' : 'Create an administrative profile.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Admin Name" 
                className="input-base" 
                style={{ paddingLeft: '40px' }}
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
            <input 
              type="email" 
              placeholder="System Email" 
              className="input-base" 
              style={{ paddingLeft: '40px' }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Key size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              placeholder="Encryption Key (Password)" 
              className="input-base" 
              style={{ paddingLeft: '40px' }}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Processing...' : isLogin ? 'Initialize Uplink' : 'Register Core'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have a clearance? " : "Already an Admin? "}
          <span 
            style={{ color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate(isLogin ? '/register' : '/login')}
          >
            {isLogin ? 'Register Here' : 'Login Here'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
