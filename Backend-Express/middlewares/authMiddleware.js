const jwt = require('jsonwebtoken');
const { pool, JWT_SECRET } = require('../config/database');

function parseCookies(cookieHeader = '') {
  const list = {};
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const key = parts.shift()?.trim();
    if (key) list[key] = decodeURIComponent(parts.join('='));
  });
  return list;
}

async function requireAuth(req, res, next) {
  try {
    let token = '';
    const authHeader = req.headers.authorization || '';
    const cookies = parseCookies(req.headers.cookie || '');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.query && req.query.token) {
      token = String(req.query.token).trim();
    } else if (cookies.siomas_token) {
      token = cookies.siomas_token.trim();
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token autentikasi tidak ditemukan. Silakan login terlebih dahulu di /apidocs atau aplikasi frontend.'
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = parseInt(decoded.sub || decoded.id, 10);
    const { rows } = await pool.query('SELECT * FROM users WHERE "ID" = $1', [userId]);
    if (!rows.length) {
      return res.status(401).json({ status: 'error', message: 'Pengguna tidak ditemukan.' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Token tidak valid atau telah kedaluwarsa.' });
  }
}

function requireRole(...allowedRoles) {
  const expanded = new Set(allowedRoles);
  if (expanded.has('Ketua') || expanded.has('Admin')) {
    expanded.add('Ketua');
    expanded.add('Admin');
  }
  return (req, res, next) => {
    if (!req.user || !expanded.has(req.user.Role)) {
      return res.status(403).json({
        status: 'error',
        message: `Akses ditolak. Peran '${req.user?.Role || 'Anonim'}' tidak memiliki izin ke fitur ini.`
      });
    }
    next();
  };
}

module.exports = {
  parseCookies,
  requireAuth,
  requireRole
};

