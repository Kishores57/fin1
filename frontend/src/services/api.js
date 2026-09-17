import axios from 'axios';

// Resolve API base URL:
// In production or cloud deployment, VITE_API_URL can be set (e.g. https://api.yourdomain.com).
// In development, defaults to http://localhost:8000.
// If frontend & backend are served together, relative '' is used.
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export const mediaBaseUrl = API_BASE_URL;

// Create configured Axios instance
const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const treeApi = {
  /**
   * Retrieves list of registered tree species constants from database.
   */
  getSpecies: async () => {
    const response = await API.get('/species');
    return response.data;
  },

  /**
   * Sends tree measurements to the backend calculation and RAG pipeline.
   */
  calculateTree: async (species, gbh, height, latitude = null, longitude = null) => {
    const response = await API.post('/calculate', {
      species,
      gbh: parseFloat(gbh),
      height: parseFloat(height),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });
    return response.data;
  },

  /**
   * Retrieves the historical database of logged trees.
   */
  getHistory: async () => {
    const response = await API.get('/history');
    return response.data;
  },
};

/** Additive MongoDB tree-registration API (does not replace treeApi calculator). */
export const registeredTreeApi = {
  analyze: async (payload) => {
    const response = await API.post('/registered-trees/analyze', payload);
    return response.data;
  },

  list: async () => {
    const response = await API.get('/registered-trees');
    return response.data;
  },

  get: async (id) => {
    const response = await API.get(`/registered-trees/${id}`);
    return response.data;
  },

  create: async (formData) => {
    const response = await API.post('/registered-trees', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  remove: async (id) => {
    const response = await API.delete(`/registered-trees/${id}`);
    return response.data;
  },

  regenerateAnalysis: async (id) => {
    const response = await API.post(`/registered-trees/${id}/regenerate-analysis`);
    return response.data;
  },
};

/**
 * Species Detection AI API
 * Supports both:
 * 1. Unified Node.js backend proxy: `${API_BASE_URL}/api/detection/predict` (clean for cloud deployment)
 * 2. Direct Python FastAPI port 5000: `http://localhost:5000/predict` (local development fallback)
 */
const PROXY_DETECTION_URL = `${API_BASE_URL}/api/detection`;
const DIRECT_DETECTION_URL = import.meta.env.VITE_DETECTION_URL || 'http://localhost:5000';

export const speciesDetectionApi = {
  predict: async (imageFile) => {
    const fd = new FormData();
    fd.append('file', imageFile);

    // 1. Try unified backend proxy first
    try {
      const response = await axios.post(`${PROXY_DETECTION_URL}/predict`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000,
      });
      if (response.data && !response.data.fallback && !response.data.error) {
        return response.data;
      }
    } catch (proxyErr) {
      console.warn('Backend detection proxy unavailable, attempting direct model connection:', proxyErr.message);
    }

    // 2. Direct fallback to Python FastAPI server
    const response = await axios.post(`${DIRECT_DETECTION_URL}/predict`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 20000,
    });
    return response.data;
  },

  health: async () => {
    try {
      const res = await axios.get(`${PROXY_DETECTION_URL}/health`, { timeout: 3000 });
      return res.data;
    } catch {
      const res = await axios.get(`${DIRECT_DETECTION_URL}/health`, { timeout: 3000 });
      return res.data;
    }
  },
};

export default {
  treeApi,
  registeredTreeApi,
  speciesDetectionApi,
  API_BASE_URL,
  mediaBaseUrl,
};
