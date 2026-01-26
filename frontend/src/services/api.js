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

// Social Media API
export const socialMediaAPI = {
  initialize: () => api.post('/social-media/initialize'),
  getAll: () => api.get('/social-media'),
  get: (platform) => api.get(`/social-media/${platform}`),
  update: (platform, data) => api.put(`/social-media/${platform}`, data),
  disconnect: (platform) => api.post(`/social-media/${platform}/disconnect`),
  sync: (platform) => api.post(`/social-media/${platform}/sync`),
  importGooglePhotos: (photoIds) => api.post('/social-media/google_photos/import', { photoIds }),
};

// Donations API
export const donationsAPI = {
  create: (data) => api.post('/donations', data),
  getAll: (params) => api.get('/donations', { params }),
  getStats: (params) => api.get('/donations/stats', { params }),
  createPaymentIntent: (amount) => api.post('/donations/create-payment-intent', { amount }),
};

// Payment Settings API
export const paymentSettingsAPI = {
  getPublic: () => api.get('/payment-settings/public'),
  get: () => api.get('/payment-settings'),
  update: (data) => api.put('/payment-settings', data),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
