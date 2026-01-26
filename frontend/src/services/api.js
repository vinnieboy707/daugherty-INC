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

// Reviews API
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  get: (id) => api.get(`/reviews/${id}`),
  create: (data) => {
    // Handle both FormData and regular objects
    const isFormData = data instanceof FormData;
    return api.post('/reviews', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
  },
  update: (id, data) => api.put(`/reviews/${id}`, data),
  approve: (id) => api.put(`/reviews/${id}/approve`),
  feature: (id, featured) => api.put(`/reviews/${id}/feature`, { featured }),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  delete: (id) => api.delete(`/reviews/${id}`),
  getPending: () => api.get('/reviews/admin/pending'),
  getWithPhotos: () => api.get('/reviews/admin/with-photos'),
  approvePhotoForPortfolio: (reviewId, photoIndex, data) => 
    api.post(`/reviews/${reviewId}/photos/${photoIndex}/approve`, data),
};

// Availability API
export const availabilityAPI = {
  getAll: (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return api.get('/availability', { params });
  },
  getByDate: (date) => api.get(`/availability/${date}`),
  getCalendarMonth: (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    return api.get('/availability/calendar/month', { params });
  },
  create: (data) => api.post('/availability', data),
  update: (id, data) => api.put(`/availability/${id}`, data),
  delete: (id) => api.delete(`/availability/${id}`),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
