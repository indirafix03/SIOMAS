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
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
  },

  create: async (payload) => {
    return apiFetch('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  update: async (id, payload) => {
    return apiFetch(`/admin/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  delete: async (id) => {
    return apiFetch(`/admin/announcements/${id}`, {
      method: 'DELETE'
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
  },

  create: async (payload) => {
    return apiFetch('/schedules', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  update: async (id, payload) => {
    return apiFetch(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  delete: async (id) => {
    return apiFetch(`/schedules/${id}`, {
      method: 'DELETE'
    });
  }
};

// Documents Archive API Calls (UC-10)
export const documentsApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/documents${query ? `?${query}` : ''}`);
  },

  upload: async (file, namaBerkas, kategori = 'LPJ') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nama_berkas', namaBerkas);
    formData.append('kategori', kategori);
    return apiFetch('/documents/upload', {
      method: 'POST',
      body: formData
    });
  },

  updateCategory: async (id, kategori, namaBerkas) => {
    return apiFetch(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ kategori, nama_berkas: namaBerkas })
    });
  },

  delete: async (id) => {
    return apiFetch(`/documents/${id}`, {
      method: 'DELETE'
    });
  },

  download: async (id, fallbackName = 'dokumen.pdf') => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fallbackName.toLowerCase().endsWith('.pdf') ? fallbackName : `${fallbackName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  },

  downloadBundle: async (kategori = '') => {
    const token = getAuthToken();
    const q = kategori && kategori !== 'Semua' ? `?kategori=${encodeURIComponent(kategori)}` : '';
    const res = await fetch(`${API_BASE_URL}/documents/bundle${q}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const label = kategori && kategori !== 'Semua' ? kategori : 'Semua_Dokumen';
    a.download = `Bundel_${label}_SIOMAS.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  },

  getDownloadUrl: (id) => {
    return `${API_BASE_URL}/documents/${id}/download`;
  }
};

// LPJ Upload & Validation API Calls (UC-06 & UC-09)
export const lpjApi = {
  uploadDraft: async (file, namaBerkas) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nama_berkas', namaBerkas);
    return apiFetch('/lpj/upload', {
      method: 'POST',
      body: formData
    });
  },

  updateDraft: async (documentId, file, namaBerkas) => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (namaBerkas) formData.append('nama_berkas', namaBerkas);
    return apiFetch(`/lpj/${documentId}`, {
      method: 'PUT',
      body: formData
    });
  },

  getMySubmissions: async () => {
    return apiFetch('/lpj/my-submissions');
  },

  getPendingValidation: async (search = '') => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiFetch(`/lpj-validation/pending${q}`);
  },

  validate: async (documentId, status, catatanRevisi = '') => {
    return apiFetch(`/lpj-validation/${documentId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ status, catatan_revisi: catatanRevisi })
    });
  },

  getHistory: async () => {
    return apiFetch('/lpj-validation/history');
  }
};

// Sipakamase API Calls (UC-08)
export const sipakamaseApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/sipakamase${query ? `?${query}` : ''}`);
  },

  upload: async (file, namaBerkas) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nama_berkas', namaBerkas);
    return apiFetch('/sipakamase/upload', {
      method: 'POST',
      body: formData
    });
  },

  verify: async (documentId, status, catatan = '') => {
    return apiFetch(`/sipakamase/${documentId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ status, catatan })
    });
  }
};

// Inter-UKM API Calls (UC-11)
export const parseInterUkmPost = (item) => {
  const isPending = item.status_persetujuan === 'Pending';
  const dateStr = item.date
    ? new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Baru saja';

  const rawOrg = item.ukm_pengirim || 'SIOMAS';
  const cleanWords = rawOrg.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const initials = cleanWords.length >= 2
    ? (cleanWords[0][0] + cleanWords[1][0]).toUpperCase()
    : (cleanWords[0] || 'UK').slice(0, 2).toUpperCase();

  const rawIsi = item.isi_pengumuman || '';
  const parts = rawIsi.split(' • ').map(s => s.trim()).filter(Boolean);

  let pelaksanaan = dateStr;
  let tempat = 'Kampus SIOMAS';
  let contactPerson = item.created_by_name || 'Pengurus UKM';
  let contactWa = '-';
  let fileName = '';
  let fileSize = '';
  let fotoUrl = '';
  let fileUrl = '';
  const descParts = [];

  const backendOrigin = API_BASE_URL.replace(/\/api\/v1$/, '');

  for (const part of parts) {
    if (part.startsWith('Pelaksanaan:')) {
      pelaksanaan = part.replace('Pelaksanaan:', '').trim();
    } else if (part.startsWith('Lokasi:')) {
      tempat = part.replace('Lokasi:', '').trim();
    } else if (part.startsWith('PIC:') || part.startsWith('Narahubung:')) {
      const picRaw = part.replace(/^(PIC|Narahubung):/, '').trim();
      const match = picRaw.match(/^(.+?)\s*\((.+)\)$/);
      if (match) {
        contactPerson = match[1].trim();
        contactWa = match[2].trim();
      } else {
        contactPerson = picRaw;
      }
    } else if (part.startsWith('Lampiran:')) {
      const lampRaw = part.replace('Lampiran:', '').trim();
      const match = lampRaw.match(/^(.+?)\s*\((.+)\)$/);
      if (match) {
        fileName = match[1].trim();
        fileSize = match[2].trim();
      } else {
        fileName = lampRaw;
      }
    } else if (part.startsWith('FotoURL:')) {
      const p = part.replace('FotoURL:', '').trim();
      fotoUrl = p.startsWith('http') ? p : `${backendOrigin}${p}`;
    } else if (part.startsWith('FileURL:')) {
      const p = part.replace('FileURL:', '').trim();
      fileUrl = p.startsWith('http') ? p : `${backendOrigin}${p}`;
    } else {
      descParts.push(part);
    }
  }

  const cleanDesc = descParts.length > 0 ? descParts.join(' • ') : rawIsi;

  return {
    id: item.id,
    org: rawOrg,
    orgName: rawOrg,
    publishedBy: rawOrg,
    orgInitial: initials,
    orgCode: initials,
    orgBadgeClass: 'org-blue',
    orgColor: isPending ? '#F59E0B' : '#4F46E5',
    orgType: 'Organisasi mahasiswa kampus',
    waktu: dateStr,
    timeAgo: dateStr,
    kategori: isPending ? 'Menunggu Verifikasi' : 'Kolaborasi',
    category: isPending ? 'Menunggu Verifikasi' : 'Kolaborasi',
    tagClass: isPending ? 'tag-gray' : 'tag-purple',
    kategoriColor: '#4F46E5',
    judul: item.judul,
    headline: item.judul,
    konten: item.judul,
    img: fotoUrl,
    image: fotoUrl,
    bannerImage: fotoUrl,
    desc: cleanDesc,
    deskripsi: cleanDesc,
    detail: cleanDesc,
    tertarik: item.interest_count || 0,
    likes: item.interest_count || 0,
    isLiked: Boolean(item.is_interested),
    status: isPending ? 'pending' : 'approved',
    isPublished: !isPending,
    contactName: contactPerson,
    contactPerson: contactPerson,
    contactRole: rawOrg,
    contactWa: contactWa,
    tanggal: pelaksanaan,
    pelaksanaan: pelaksanaan,
    tempat: tempat,
    proposal: fileName,
    fileName: fileName,
    proposalSize: fileSize || 'Dokumen',
    fileSize: fileSize || 'Dokumen',
    fileUrl: fileUrl,
    followers: 'Aktif'
  };
};

export const interUkmApi = {
  getFeed: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/interukm/feed${query ? `?${query}` : ''}`);
  },

  getPending: async () => {
    return apiFetch('/interukm/posts/pending');
  },

  getMyPosts: async () => {
    return apiFetch('/interukm/my-posts');
  },

  getById: async (id) => {
    return apiFetch(`/interukm/${id}`);
  },

  createPost: async (postData) => {
    if (postData.foto instanceof File || postData.proposal instanceof File) {
      const fd = new FormData();
      fd.append('ukm_pengirim', postData.ukm_pengirim || 'SIOMAS');
      fd.append('judul', postData.judul || '');
      fd.append('isi_pengumuman', postData.isi_pengumuman || '');
      if (postData.foto instanceof File) {
        fd.append('foto', postData.foto);
      }
      if (postData.proposal instanceof File) {
        fd.append('proposal', postData.proposal);
      }
      return apiFetch('/interukm/posts', {
        method: 'POST',
        body: fd
      });
    }
    return apiFetch('/interukm/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  },

  approve: async (id) => {
    return apiFetch(`/interukm/posts/${id}/approve`, {
      method: 'POST'
    });
  },

  reject: async (id, alasan = '') => {
    return apiFetch(`/interukm/posts/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ alasan_penolakan: alasan })
    });
  },

  toggleInterest: async (id) => {
    return apiFetch(`/interukm/posts/${id}/interest`, {
      method: 'POST'
    });
  }
};

// Notifications / Email Logs API Calls (UC-12)
export const notificationsApi = {
  getEmailLogs: async () => {
    return apiFetch('/notifications/email/logs');
  },

  runScheduler: async (forceNextAttempt = true, announcementId = null) => {
    return apiFetch('/notifications/email/run-scheduler', {
      method: 'POST',
      body: JSON.stringify({
        force_next_attempt: forceNextAttempt,
        ...(announcementId ? { announcement_id: announcementId } : {})
      })
    });
  },

  triggerWebhook: async (emailLogId, status) => {
    return apiFetch('/notifications/email/webhook', {
      method: 'POST',
      body: JSON.stringify({ email_log_id: emailLogId, status_pengiriman: status })
    });
  }
};
