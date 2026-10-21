/**
 * SIOMAS API Service Client
 * Menangani seluruh komunikasi HTTP REST API dengan Backend Flask
 */

export const API_BASE_URL = window.location.origin.includes('5000')
  ? `${window.location.origin}/api/v1`
  : 'http://127.0.0.1:5000/api/v1';

export const getAuthToken = () => {
  return localStorage.getItem('siomas_token') || sessionStorage.getItem('siomas_token') || null;
};

export const setAuthToken = (token, remember = false) => {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('siomas_token', token);
};

export const clearAuth = () => {
  localStorage.removeItem('siomas_token');
  localStorage.removeItem('siomas_refresh_token');
  localStorage.removeItem('siomas_user');
  localStorage.removeItem('siomas_permissions');
  sessionStorage.removeItem('siomas_token');
  sessionStorage.removeItem('siomas_refresh_token');
  sessionStorage.removeItem('siomas_user');
  sessionStorage.removeItem('siomas_permissions');
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 && !endpoint.includes('/login')) {
      clearAuth();
      window.location.hash = '#/unauthorized';
    }

    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    console.warn(`[SIOMAS API Error] ${endpoint}:`, err);
    return { ok: false, status: 0, data: null, error: err };
  }
};

// Auth API Calls
export const authApi = {
  login: async (email, password) => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (userData) => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nama: userData.nama,
        nim: userData.nim,
        ukm: userData.ukm,
        divisi: userData.divisi,
        email: userData.email,
        password: userData.password,
        role: 'Anggota'
      })
    });
  },

  getProfile: async () => {
    return apiFetch('/profile/me');
  },

  updateProfile: async (profileData) => {
    return apiFetch('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
};

// Announcements API Calls (UC-03 / UC-05)
export const announcementsApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/announcements${query ? `?${query}` : ''}`);
  },

  getById: async (id) => {
    return apiFetch(`/announcements/${id}`);
  },

  getUnreadCount: async () => {
    return apiFetch('/announcements/unread-count');
  },

  markRead: async (id, isRead = true) => {
    return apiFetch(`/announcements/${id}/mark-read`, {
      method: 'POST',
      body: JSON.stringify({ is_read: isRead })
    });
  }
};

// Schedules / Calendar API Calls (UC-04)
export const schedulesApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/schedules${query ? `?${query}` : ''}`);
  },

  getById: async (id) => {
    return apiFetch(`/schedules/${id}`);
  }
};

// Documents Archive API Calls (UC-10)
export const documentsApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/documents${query ? `?${query}` : ''}`);
  },

  getDownloadUrl: (id) => {
    return `${API_BASE_URL}/documents/${id}/download`;
  }
};

// Inter-UKM API Calls (UC-11)
export const interUkmApi = {
  getFeed: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/interukm/feed${query ? `?${query}` : ''}`);
  },

  getById: async (id) => {
    return apiFetch(`/interukm/${id}`);
  },

  createPost: async (postData) => {
    return apiFetch('/interukm/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }
};
