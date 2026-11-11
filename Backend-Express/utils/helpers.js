const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, storedHash) {
  if (!storedHash || !plain) return false;
  // 1. Standard Bcrypt ($2a$, $2b$, $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compareSync(plain, storedHash);
  }
  // 2. Werkzeug pbkdf2:sha256:iterations$salt$hash
  if (storedHash.startsWith('pbkdf2:sha256:')) {
    try {
      const parts = storedHash.split('$');
      const iterPart = parts[0].split(':')[2];
      const iterations = parseInt(iterPart, 10) || 260000;
      const salt = parts[1];
      const expectedHex = parts[2];
      const derived = crypto.pbkdf2Sync(plain, salt, iterations, 32, 'sha256').toString('hex');
      return derived === expectedHex;
    } catch (_) {
      return false;
    }
  }
  // 3. Werkzeug scrypt:N:r:p$salt$hash
  if (storedHash.startsWith('scrypt:')) {
    try {
      const parts = storedHash.split('$');
      const params = parts[0].split(':');
      const N = parseInt(params[1], 10) || 32768;
      const r = parseInt(params[2], 10) || 8;
      const p = parseInt(params[3], 10) || 1;
      const salt = parts[1];
      const expectedHex = parts[2];
      const derived = crypto.scryptSync(plain, salt, 64, { N, r, p, maxmem: 128 * N * r * 2 }).toString('hex');
      return derived === expectedHex;
    } catch (_) {
      return false;
    }
  }
  return plain === storedHash;
}

const VALID_UKM_LIST = [
  'UKM Seni & Budaya',
  'UKM Olahraga',
  'UKM Penalaran & Penelitian',
  'UKM KSR - PMI',
  'UKM Pers Mahasiswa',
  'UKM Mapala',
  'UKM Robotika & Teknologi'
];

function getUkmFromJobDesc(jobDesc) {
  const raw = (jobDesc || '').trim();
  if (!raw) return '';
  for (const ukmName of VALID_UKM_LIST) {
    if (raw.toLowerCase().startsWith(ukmName.toLowerCase())) {
      return ukmName;
    }
  }
  if (raw.includes('•')) return raw.split('•')[0].trim();
  if (raw.includes(' - ')) {
    const prefix = raw.split(' - ')[0].trim();
    if (prefix.toUpperCase().startsWith('UKM')) return prefix;
  }
  if (raw.toUpperCase().startsWith('UKM ')) return raw;
  return '';
}

function getDivisiFromJobDesc(jobDesc, role = 'Anggota') {
  const raw = (jobDesc || '').trim();
  if (!raw) return role;
  for (const ukmName of VALID_UKM_LIST) {
    if (raw.toLowerCase().startsWith(ukmName.toLowerCase())) {
      const rest = raw.slice(ukmName.length).replace(/^[\s\-•]+/, '').trim();
      return rest || role;
    }
  }
  if (raw.includes('•')) {
    const parts = raw.split('•');
    return parts.slice(1).join('•').trim() || role;
  }
  if (raw.includes(' - ')) {
    const parts = raw.split(' - ');
    if (parts[0].trim().toUpperCase().startsWith('UKM')) {
      return parts.slice(1).join(' - ').trim() || role;
    }
  }
  if (raw.toUpperCase().startsWith('UKM ')) return role;
  return raw || role;
}

function formatUserRow(u) {
  if (!u) return null;
  return {
    id: u.ID,
    nama: u.Nama,
    nim: u.NIM,
    email: u.Email,
    role: u.Role,
    job_desc: u.Job_Desc,
    ukm: getUkmFromJobDesc(u.Job_Desc),
    divisi: getDivisiFromJobDesc(u.Job_Desc, u.Role),
    status_keanggotaan: u.Status_Keanggotaan,
    created_at: u.Created_At ? new Date(u.Created_At).toISOString().replace('T', ' ').slice(0, 19) : null,
    created_by: u.Created_By,
    updated_by: u.Updated_By
  };
}

async function recordAuditLog({ userId, aksi, modul, recordId = null, before = null, after = null, summary = '', req = null }) {
  try {
    const detailJson = JSON.stringify({
      before,
      after,
      summary: summary || `${aksi} pada tabel ${modul}`
    });
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const ua = req ? (req.headers['user-agent'] || 'Express-Client').slice(0, 250) : 'System-Scheduler';
    await pool.query(
      `INSERT INTO audit_logs ("User_ID", "Aksi", "Modul", "Record_ID", "Detail", "IP_Address", "User_Agent", "Created_At")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [userId || null, aksi, modul, recordId, detailJson, String(ip).slice(0, 45), ua]
    );
  } catch (err) {
    console.error('[AuditLog Error]:', err.message);
  }
}

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_FULL_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatDateOnlyId(rawDateStr, fallbackDateObj = null) {
  if (rawDateStr && String(rawDateStr).trim()) {
    const clean = String(rawDateStr).trim();
    // If YYYY-MM-DD
    const d = new Date(clean.length === 10 ? `${clean}T00:00:00` : clean);
    if (!isNaN(d.getTime())) {
      return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_FULL_ID[d.getMonth()]} ${d.getFullYear()}`;
    }
    return clean;
  }
  const d = fallbackDateObj ? new Date(fallbackDateObj) : new Date();
  if (!isNaN(d.getTime())) {
    return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_FULL_ID[d.getMonth()]} ${d.getFullYear()}`;
  }
  return '-';
}

function formatTimeOnlyWita(rawTimeStr, fallbackDateObj = null) {
  if (rawTimeStr && String(rawTimeStr).trim()) {
    const clean = String(rawTimeStr).trim();
    if (clean.toUpperCase().includes('WITA')) return clean;
    return `${clean} WITA`;
  }
  const d = fallbackDateObj ? new Date(fallbackDateObj) : new Date();
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm} WITA`;
  }
  return '09:00 WITA';
}

module.exports = {
  hashPassword,
  verifyPassword,
  VALID_UKM_LIST,
  getUkmFromJobDesc,
  getDivisiFromJobDesc,
  formatUserRow,
  recordAuditLog,
  formatDateOnlyId,
  formatTimeOnlyWita
};

