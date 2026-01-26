import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Portfolio API
export const portfolioAPI = {
  getAll: (visibleOnly = true) => api.get(`/portfolio?visibleOnly=${visibleOnly}`),
  upload: (formData) => api.post('/portfolio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/portfolio/${id}`, data),
  updateOrder: (orders) => api.put('/portfolio/order/update', { orders }),
  delete: (id) => api.delete(`/portfolio/${id}`),
};

// Consultation API
export const consultationAPI = {
  create: (formData) => api.post('/consultations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (status) => api.get(`/consultations${status ? `?status=${status}` : ''}`),
  getOne: (id) => api.get(`/consultations/${id}`),
  update: (id, data) => api.put(`/consultations/${id}`, data),
  generatePreview: (id) => api.post(`/consultations/${id}/preview`),
  aiChat: (message, consultationId) => api.post('/consultations/ai/chat', { 
    message, 
    consultationId 
  }),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
