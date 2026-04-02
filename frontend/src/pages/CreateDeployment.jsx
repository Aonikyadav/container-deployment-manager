import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Container, Save, ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateDeployment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    version: 'latest',
    targetPort: 80,
    repoUrl: '',
    postStartScript: ''
  });

  const [envVars, setEnvVars] = useState([{ key: '', value: '' }]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEnvChange = (index, field, value) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  const addEnvVar = () => setEnvVars([...envVars, { key: '', value: '' }]);
  
  const removeEnvVar = (index) => {
    const newEnvVars = [...envVars];
    newEnvVars.splice(index, 1);
    setEnvVars(newEnvVars);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Convert envVars array to object
    const envVarsObj = {};
    envVars.forEach((env) => {
      if (env.key.trim() !== '') {
        envVarsObj[env.key.trim()] = env.value;
      }
    });

    try {
      await api.createDeployment({
        ...formData,
        targetPort: parseInt(formData.targetPort, 10),
        envVars: Object.keys(envVarsObj).length > 0 ? envVarsObj : undefined
      });
      navigate('/dashboard');
      toast.success('System deployment initiated successfully.');
    } catch (err) {
      console.error('Failed to create deployment', err);
      let msg = err.response?.data?.error || err.message || 'Error creating deployment';
      if (msg.includes('E11000') || msg.includes('duplicate')) {
        msg = 'That Application Name is already in use by another deployment. Please choose a unique name.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingTop: '20px', maxWidth: '800px', margin: '0 auto' }}>
      
      <button 
        onClick={() => navigate('/dashboard')} 
        className="btn-secondary" 
        style={{ padding: '8px 12px', marginBottom: '24px', border: 'none', background: 'rgba(255,255,255,0.05)' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 8px 0' }}>Launch Deployment</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Configure and initialize a new container environment.</p>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Application Name</label>
              <input 
                required 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. my-web-app" 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Docker Image</label>
              <input 
                required 
                name="image" 
                value={formData.image} 
                onChange={handleChange} 
                placeholder="e.g. nginx" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Version / Tag</label>
              <input 
                required 
                name="version" 
                value={formData.version} 
                onChange={handleChange} 
                placeholder="e.g. latest, 1.0.0" 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Container Target Port</label>
              <input 
                required 
                type="number" 
                name="targetPort" 
                value={formData.targetPort} 
                onChange={handleChange} 
                placeholder="80" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Git Repository URL</label>
              <input 
                name="repoUrl" 
                value={formData.repoUrl} 
                onChange={handleChange} 
                placeholder="https://github.com/user/repo" 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Post-Start Shell Script</label>
            <textarea 
              name="postStartScript" 
              value={formData.postStartScript} 
              onChange={handleChange} 
              placeholder="e.g. touch /app/ready.txt && echo 'Hello' > /app/hello.txt" 
              style={{ minHeight: '80px', fontFamily: 'monospace' }}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Environment Variables (Optional)</label>
              <button type="button" onClick={addEnvVar} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8ren' }}>
                <Plus size={14} /> Add Var
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {envVars.map((env, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    placeholder="KEY" 
                    value={env.key} 
                    onChange={(e) => handleEnvChange(index, 'key', e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <input 
                    placeholder="VALUE" 
                    value={env.value} 
                    onChange={(e) => handleEnvChange(index, 'value', e.target.value)} 
                    style={{ flex: 2 }}
                  />
                  <button type="button" onClick={() => removeEnvVar(index)} className="btn-danger" style={{ padding: '8px 12px' }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : 'Deploy Configuration'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default CreateDeployment;
