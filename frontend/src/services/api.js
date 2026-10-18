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

// Automatically inject JWT authorization token if stored in localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vanjeevan_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  login: async (email, password) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    try {
      const response = await API.post('/auth/login', { email: cleanEmail, password });
      if (response.data?.token) {
        localStorage.setItem('vanjeevan_auth_token', response.data.token);
        localStorage.setItem('vanjeevan_auth_user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (err) {
      // If backend is temporarily offline, allow standard demo accounts to authenticate so user is never locked out
      if (!err.response && (cleanEmail === 'admin@vanjeevan.org' || cleanEmail === 'user@vanjeevan.org')) {
        const isAdmin = cleanEmail === 'admin@vanjeevan.org';
        const expectedPass = isAdmin ? 'admin123' : 'user123';
        if (password === expectedPass) {
          const fallbackUser = {
            id: isAdmin ? 1 : 2,
            name: isAdmin ? 'Dr. Ramesh Kulkarni (Administrator)' : 'Pooja Sharma (Field Researcher)',
            email: cleanEmail,
            role: isAdmin ? 'admin' : 'user',
            organization: isAdmin ? 'VanJeevan Forestry Board & Tree Authority' : 'KKWIEER Campus Ecological Survey',
            created_at: new Date().toISOString(),
          };
          const fallbackToken = `mock_token_${Date.now()}`;
          localStorage.setItem('vanjeevan_auth_token', fallbackToken);
          localStorage.setItem('vanjeevan_auth_user', JSON.stringify(fallbackUser));
          return { user: fallbackUser, token: fallbackToken, message: `Welcome back, ${fallbackUser.name}!` };
        }
      }
      throw err;
    }
  },

  register: async (payload) => {
    const response = await API.post('/auth/register', payload);
    if (response.data?.token) {
      localStorage.setItem('vanjeevan_auth_token', response.data.token);
      localStorage.setItem('vanjeevan_auth_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getMe: async () => {
    const response = await API.get('/auth/me');
    if (response.data?.user) {
      localStorage.setItem('vanjeevan_auth_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getUsers: async () => {
    const response = await API.get('/auth/users');
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await API.patch(`/auth/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await API.delete(`/auth/users/${userId}`);
    return response.data;
  },

  getQuickAccounts: async () => {
    const response = await API.get('/auth/quick-accounts');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('vanjeevan_auth_token');
    localStorage.removeItem('vanjeevan_auth_user');
  },

  getCurrentUser: () => {
    try {
      const stored = localStorage.getItem('vanjeevan_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('vanjeevan_auth_token');
  },
};

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

  /**
   * Admin-only: Deletes an inventory record from history database.
   */
  deleteHistory: async (id) => {
    const response = await API.delete(`/history/${id}`);
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

export const mapAnalysisApi = {
  getZones: async () => {
    const response = await API.get('/map-analysis/zones');
    return response.data;
  },

  getEnvironmentalComparison: async () => {
    const response = await API.get('/map-analysis/environmental-comparison');
    return response.data;
  },

  analyzeArea: async ({ zoneId, geometry, areaName, customWeights }) => {
    const response = await API.post('/map-analysis/analyze', {
      zoneId,
      geometry,
      areaName,
      customWeights,
    });
    return response.data;
  },

  simulate: async (payload) => {
    const response = await API.post('/map-analysis/simulate', payload);
    return response.data;
  },

  getRecommendations: async ({ zoneId, geometry, areaName }) => {
    const response = await API.post('/map-analysis/recommendations', {
      zoneId,
      geometry,
      areaName,
    });
    return response.data;
  },
};

/**
 * Transparent Tree-Cutting Permits, Verification & Public Voting API
 */
export const treeCuttingApi = {
  getKpi: async () => {
    const response = await API.get('/tree-cutting/kpi');
    return response.data;
  },

  listApplications: async (params = {}) => {
    const response = await API.get('/tree-cutting/applications', { params });
    return response.data;
  },

  getApplication: async (id) => {
    const response = await API.get(`/tree-cutting/applications/${id}`);
    return response.data;
  },

  submitApplication: async (formData) => {
    const response = await API.post('/tree-cutting/applications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadDocument: async (appId, formData) => {
    const response = await API.post(`/tree-cutting/applications/${appId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  verifyDocument: async (appId, docId, payload) => {
    const response = await API.patch(
      `/tree-cutting/applications/${appId}/documents/${docId}/verify`,
      payload
    );
    return response.data;
  },

  getDocumentDownloadUrl: (appId, docId) => {
    return `${API_BASE_URL}/api/tree-cutting/applications/${appId}/documents/${docId}/download`;
  },

  castVote: async (appId, payload) => {
    const response = await API.post(`/tree-cutting/applications/${appId}/vote`, payload);
    return response.data;
  },

  getVotes: async (appId) => {
    const response = await API.get(`/tree-cutting/applications/${appId}/votes`);
    return response.data;
  },

  updateStatus: async (appId, payload) => {
    const response = await API.patch(`/tree-cutting/applications/${appId}/status`, payload);
    return response.data;
  },

  recordDecision: async (appId, payload) => {
    const response = await API.post(`/tree-cutting/applications/${appId}/decision`, payload);
    return response.data;
  },

  reportConcern: async (appId, payload) => {
    const response = await API.post(`/tree-cutting/applications/${appId}/report`, payload);
    return response.data;
  },

  updateInvestigation: async (appId, payload) => {
    const response = await API.post(`/tree-cutting/applications/${appId}/investigate`, payload);
    return response.data;
  },

  getAuditTrail: async (appId) => {
    const response = await API.get(`/tree-cutting/applications/${appId}/audit-trail`);
    return response.data;
  },

  getNotifications: async () => {
    const response = await API.get('/tree-cutting/notifications');
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await API.patch(`/tree-cutting/notifications/${id}/read`);
    return response.data;
  },
};

export default {
  authApi,
  treeApi,
  registeredTreeApi,
  speciesDetectionApi,
  mapAnalysisApi,
  treeCuttingApi,
  API_BASE_URL,
  mediaBaseUrl,
};
