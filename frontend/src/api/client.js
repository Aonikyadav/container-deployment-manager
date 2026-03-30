import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default {
  // Deployments
  getDeployments: () => apiClient.get('/deployments'),
  createDeployment: (data) => apiClient.post('/deployments', data),
  triggerDeploy: (id, version) => apiClient.post(`/deployments/${id}/deploy`, version ? { version } : {}),
  stopDeploy: (id) => apiClient.post(`/deployments/${id}/stop`),
  deleteDeploy: (id) => apiClient.delete(`/deployments/${id}`),
  
  // Details
  getHistory: (id) => apiClient.get(`/deployments/${id}/history`),
  getLogs: (id) => apiClient.get(`/deployments/${id}/logs`),
  
  // Scaling
  scaleDeployment: (id, replicas) => apiClient.put(`/deployments/${id}/scale`, { replicas })
};
