require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const archiver = require('archiver');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { Pool } = require('pg');
const { Sequelize } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'jwt-secret-siomas-access-refresh-token-key-2026';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4fKULoCWqDc0@ep-damp-sea-a10ojkxy-pooler.ap-southeast-1.aws.neon.tech/siomas_db?uselibpqcompat=true&sslmode=require';

// Ensure uploads directory exists (shared with Backend/uploads)
const UPLOAD_DIR = path.resolve(__dirname, process.env.UPLOAD_FOLDER || '../Backend/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// PostgreSQL Pool & Sequelize ORM Instance (Connected to Neon Cloud PostgreSQL)
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
});

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

// Middleware
app.use(cors({ origin: '*', exposedHeaders: ['Content-Disposition'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/api/v1/interukm/files', express.static(UPLOAD_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer Configuration (Max 10 MB, PDF/DOC/DOCX/JPG/PNG/ZIP)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uid = crypto.randomBytes(16).toString('hex');
    cb(null, `${uid}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ============================================================================
// Helper Functions: Password Hashing (Bcrypt + Legacy Werkzeug PBKDF2/Scrypt),
// UKM Extraction, Audit Logger, and Nodemailer Service
// ============================================================================

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

// ============================================================================
// JWT Authentication & RBAC Middleware
// ============================================================================

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

// ============================================================================
// Nodemailer & UC-12 Scheduled Email Reminder Engine (Attempt 1, 2 [24h], 3 [48h])
// ============================================================================

const smtpTransporter = process.env.SMTP_USER && process.env.SMTP_PASSWORD
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })
  : null;

async function sendSmtpEmail(toEmail, subject, textBody) {
  if (!toEmail || !toEmail.includes('@')) return false;
  if (!smtpTransporter) {
    // Development simulation mode (Mailtrap/SendGrid fallback as per SRS)
    return true;
  }
  for (let retry = 1; retry <= 3; retry++) {
    try {
      await smtpTransporter.sendMail({
        from: process.env.SMTP_DEFAULT_SENDER || '"SIOMAS Notification" <no-reply@siomas.ac.id>',
        to: toEmail,
        subject,
        text: textBody
      });
      return true;
    } catch (err) {
      if (retry === 3) return false;
    }
  }
  return false;
}

async function triggerAnnouncementEmails(announcement, creatorUser) {
  const creatorUkm = getUkmFromJobDesc(creatorUser?.Job_Desc);
  const { rows: activeUsers } = await pool.query(
    `SELECT * FROM users WHERE "Status_Keanggotaan" = 'Aktif'`
  );
  const recipients = creatorUkm
    ? activeUsers.filter(u => getUkmFromJobDesc(u.Job_Desc) === creatorUkm)
    : activeUsers;

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    // Ensure announcement_reads row exists (Is_Read = false)
    const { rows: existingRead } = await pool.query(
      `SELECT * FROM announcement_reads WHERE "Announcement_ID" = $1 AND "User_ID" = $2`,
      [announcement.ID, recipient.ID]
    );
    if (!existingRead.length) {
      await pool.query(
        `INSERT INTO announcement_reads ("Announcement_ID", "User_ID", "Is_Read", "Read_At")
         VALUES ($1, $2, FALSE, NULL)`,
        [announcement.ID, recipient.ID]
      );
    }

    const ok = await sendSmtpEmail(
      recipient.Email,
      `[SIOMAS - PENGUMUMAN PENTING] ${announcement.Judul}`,
      `Halo ${recipient.Nama},\n\nPengumuman penting baru:\n\nJudul: ${announcement.Judul}\n${announcement.Isi}`
    );
    const statusStr = ok ? 'Terkirim' : 'Gagal';
    if (ok) sent++;
    else failed++;

    await pool.query(
      `INSERT INTO email_logs ("Announcement_ID", "User_ID", "Attempt_Number", "Sent_At", "Status_Pengiriman")
       VALUES ($1, $2, 1, NOW(), $3)`,
      [announcement.ID, recipient.ID, statusStr]
    );
  }
  return { total_recipients: recipients.length, sent, failed };
}

async function processScheduledEmailReminders(forceNow = false) {
  const { rows: importantAnns } = await pool.query(
    `SELECT * FROM announcements WHERE "Is_Important" = TRUE ORDER BY "ID" DESC`
  );
  const { rows: activeUsers } = await pool.query(
    `SELECT * FROM users WHERE "Status_Keanggotaan" = 'Aktif'`
  );
  const usersById = new Map(activeUsers.map(u => [u.ID, u]));

  let triggeredCount = 0;
  let skippedReadCount = 0;
  let skippedMaxAttemptCount = 0;
  const details = [];

  for (const ann of importantAnns) {
    const creator = usersById.get(ann.Created_By);
    const creatorUkm = creator ? getUkmFromJobDesc(creator.Job_Desc) : '';
    const targetUsers = creatorUkm
      ? activeUsers.filter(u => getUkmFromJobDesc(u.Job_Desc) === creatorUkm)
      : activeUsers;

    for (const user of targetUsers) {
      const { rows: readRows } = await pool.query(
        `SELECT * FROM announcement_reads WHERE "Announcement_ID" = $1 AND "User_ID" = $2`,
        [ann.ID, user.ID]
      );
      if (readRows.length && readRows[0].Is_Read) {
        skippedReadCount++;
        continue;
      }

      const { rows: userLogs } = await pool.query(
        `SELECT * FROM email_logs WHERE "Announcement_ID" = $1 AND "User_ID" = $2 ORDER BY "Attempt_Number" ASC, "ID" ASC`,
        [ann.ID, user.ID]
      );

      if (!userLogs.length) {
        const ok = await sendSmtpEmail(user.Email, `[SIOMAS] ${ann.Judul}`, ann.Isi);
        await pool.query(
          `INSERT INTO email_logs ("Announcement_ID", "User_ID", "Attempt_Number", "Sent_At", "Status_Pengiriman")
           VALUES ($1, $2, 1, NOW(), $3)`,
          [ann.ID, user.ID, ok ? 'Terkirim' : 'Gagal']
        );
        triggeredCount++;
        details.push({ announcement_id: ann.ID, user_email: user.Email, attempt_number: 1, status: ok ? 'Terkirim' : 'Gagal' });
        continue;
      }

      const lastLog = userLogs[userLogs.length - 1];
      const maxAttempt = Math.max(...userLogs.map(l => l.Attempt_Number || 1));

      if (lastLog.Status_Pengiriman === 'Gagal') continue;
      if (maxAttempt >= 3) {
        skippedMaxAttemptCount++;
        continue;
      }

      const firstSentAt = new Date(userLogs[0].Sent_At || ann.Created_At || Date.now());
      const elapsedHours = (Date.now() - firstSentAt.getTime()) / (1000 * 3600);

      let nextAttempt = null;
      if (maxAttempt === 1 && (elapsedHours >= 24 || forceNow)) {
        nextAttempt = 2;
      } else if (maxAttempt === 2 && (elapsedHours >= 48 || forceNow)) {
        nextAttempt = 3;
      }

      if (nextAttempt) {
        const ok = await sendSmtpEmail(
          user.Email,
          `[PENGINGAT KE-${nextAttempt} SIOMAS] Belum Dibaca: ${ann.Judul}`,
          `Halo ${user.Nama}, Anda belum membaca pengumuman penting: ${ann.Judul}`
        );
        const statusStr = ok ? 'Terkirim' : 'Gagal';
        await pool.query(
          `INSERT INTO email_logs ("Announcement_ID", "User_ID", "Attempt_Number", "Sent_At", "Status_Pengiriman")
           VALUES ($1, $2, $3, NOW(), $4)`,
          [ann.ID, user.ID, nextAttempt, statusStr]
        );
        triggeredCount++;
        details.push({ announcement_id: ann.ID, user_email: user.Email, attempt_number: nextAttempt, status: statusStr });
      }
    }
  }

  return {
    checked_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    emails_triggered: triggeredCount,
    skipped_already_read: skippedReadCount,
    skipped_max_attempt_reached: skippedMaxAttemptCount,
    details
  };
}

// Schedule UC-12 Cron Job every hour (node-cron as specified in SRS Gambar 6.1)
cron.schedule('0 * * * *', async () => {
  try {
    await processScheduledEmailReminders(false);
  } catch (err) {
    console.error('[node-cron UC-12 Error]:', err.message);
  }
});

// ============================================================================
// Health Check
// ============================================================================

app.get(['/', '/api/v1/health'], async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT current_database() AS db, COUNT(*) AS users_count FROM users');
    res.json({
      status: 'success',
      engine: 'Node.js + Express.js REST API',
      orm: 'Sequelize + pg Pool',
      database: `Neon Cloud PostgreSQL (${rows[0].db})`,
      users_count: parseInt(rows[0].users_count, 10),
      docs_url: 'http://127.0.0.1:5000/apidocs',
      message: 'SIOMAS Express.js Backend API is running.'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/apidocs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>SIOMAS Express.js REST API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>body { margin: 0; background: #F8FAFC; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true
      });
    };
  </script>
</body>
</html>`);
});

app.get('/api/v1/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'SIOMAS Node.js + Express.js REST API (Neon Cloud PostgreSQL)',
      version: '2.0.0',
      description: 'Dokumentasi REST API SIOMAS sesuai SRS Fase 2 (UC-01 s/d UC-12).'
    },
    servers: [{ url: 'http://127.0.0.1:5000', description: 'Local Express Server (Connected to Neon Cloud DB)' }],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ BearerAuth: [] }],
    paths: {
      '/api/v1/health': { get: { tags: ['System'], summary: 'Cek status server Express.js & koneksi Neon DB', responses: { 200: { description: 'OK' } } } },
      '/api/v1/auth/login': {
        post: {
          tags: ['UC-02 Auth & RBAC'],
          summary: 'Login JWT & Bcrypt',
          requestBody: { required: true, content: { 'application/json': { example: { email: 'ketua.robotika@siomas.com', password: 'password123' } } } },
          responses: { 200: { description: 'Token JWT diterbitkan' } }
        }
      },
      '/api/v1/auth/register': { post: { tags: ['UC-02 Auth & RBAC'], summary: 'Registrasi Anggota Baru', responses: { 201: { description: 'Created' } } } },
      '/api/v1/auth/users': { get: { tags: ['UC-02 Auth & RBAC'], summary: 'Daftar anggota sesuai UKM Ketua', responses: { 200: { description: 'OK' } } } },
      '/api/v1/profile': {
        get: { tags: ['UC-01 Profil & Jobdesk'], summary: 'Lihat profil & jobdesk pengguna login', responses: { 200: { description: 'OK' } } },
        put: { tags: ['UC-01 Profil & Jobdesk'], summary: 'Perbarui profil & jobdesk', responses: { 200: { description: 'OK' } } }
      },
      '/api/v1/schedules': {
        get: { tags: ['UC-04 Kalender Agenda'], summary: 'Daftar jadwal kegiatan UKM', responses: { 200: { description: 'OK' } } },
        post: { tags: ['UC-04 Kalender Agenda'], summary: 'Tambah jadwal kegiatan baru', responses: { 201: { description: 'Created' } } }
      },
      '/api/v1/announcements/feed': { get: { tags: ['UC-03 & UC-05 Pengumuman'], summary: 'Daftar pengumuman & status unread', responses: { 200: { description: 'OK' } } } },
      '/api/v1/announcements/manage': { post: { tags: ['UC-03 & UC-05 Pengumuman'], summary: 'Buat pengumuman & picu email penting (Attempt-1)', responses: { 201: { description: 'Created' } } } },
      '/api/v1/lpj/upload': { post: { tags: ['UC-06 & UC-09 LPJ'], summary: 'Unggah draf LPJ (Maks 10 MB)', responses: { 201: { description: 'Created' } } } },
      '/api/v1/lpj-validation/pending': { get: { tags: ['UC-06 & UC-09 LPJ'], summary: 'Antrean LPJ menunggu validasi Ketua', responses: { 200: { description: 'OK' } } } },
      '/api/v1/sipakamase': { get: { tags: ['UC-08 Sipakamase'], summary: 'Daftar dokumen Sipakamase', responses: { 200: { description: 'OK' } } } },
      '/api/v1/documents': { get: { tags: ['UC-10 Repository Vault'], summary: 'Daftar arsip dokumen Vault', responses: { 200: { description: 'OK' } } } },
      '/api/v1/documents/bundle': { get: { tags: ['UC-10 Repository Vault'], summary: 'Unduh Bundel Dokumen (.ZIP)', parameters: [{ name: 'kategori', in: 'query', schema: { type: 'string', example: 'Semua' } }], responses: { 200: { description: 'ZIP Stream' } } } },
      '/api/v1/interukm/feed': { get: { tags: ['UC-11 Hub Inter-UKM'], summary: 'Feed kolaborasi lintas UKM (Published)', responses: { 200: { description: 'OK' } } } },
      '/api/v1/notifications/email/logs': { get: { tags: ['UC-12 Email Cron & Audit'], summary: 'Riwayat pengiriman email (Attempt 1-3)', responses: { 200: { description: 'OK' } } } },
      '/api/v1/notifications/email/run-scheduler': { post: { tags: ['UC-12 Email Cron & Audit'], summary: 'Picu scheduler pengingat 24j/48j', responses: { 200: { description: 'OK' } } } },
      '/api/v1/notifications/audit-logs': { get: { tags: ['UC-12 Email Cron & Audit'], summary: 'Daftar System Audit Logs (JSON Before/After)', responses: { 200: { description: 'OK' } } } }
    }
  });
});

// ============================================================================
// UC-02: Authentication & RBAC User Management (/api/v1/auth & /api/auth)
// ============================================================================

app.post(['/api/v1/auth/register', '/api/auth/register', '/api/register'], async (req, res) => {
  try {
    const { nama, nim, email, password, ukm, divisi, job_desc } = req.body || {};
    if (!nama || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Nama, email, dan kata sandi wajib diisi.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const { rows: existing } = await pool.query('SELECT "ID" FROM users WHERE LOWER("Email") = $1', [cleanEmail]);
    if (existing.length) {
      return res.status(409).json({ status: 'error', message: 'Email sudah terdaftar.' });
    }

    const ukmStr = (ukm || '').trim();
    const divStr = (divisi || job_desc || 'Anggota').trim();
    const fullJobDesc = ukmStr ? `${ukmStr} • ${divStr}` : divStr;
    const pwdHash = hashPassword(password);

    const { rows } = await pool.query(
      `INSERT INTO users ("Nama", "NIM", "Email", "Password_Hash", "Role", "Job_Desc", "Status_Keanggotaan", "Created_At")
       VALUES ($1, $2, $3, $4, 'Anggota', $5, 'Menunggu Verifikasi', NOW())
       RETURNING *`,
      [nama.trim(), nim ? String(nim).trim() : null, cleanEmail, pwdHash, fullJobDesc]
    );

    const newUser = rows[0];
    await recordAuditLog({
      userId: newUser.ID,
      aksi: 'REGISTER_USER',
      modul: 'users',
      recordId: newUser.ID,
      after: formatUserRow(newUser),
      summary: `Registrasi anggota baru: ${newUser.Email} (${fullJobDesc})`,
      req
    });

    res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil. Menunggu verifikasi Ketua/Admin UKM.',
      data: formatUserRow(newUser)
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post(['/api/v1/auth/login', '/api/auth/login', '/api/login'], async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email dan kata sandi wajib diisi.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE LOWER("Email") = $1 OR LOWER("NIM") = $1 LIMIT 1`,
      [cleanEmail]
    );
    if (!rows.length || !verifyPassword(password, rows[0].Password_Hash)) {
      return res.status(401).json({ status: 'error', message: 'Email atau kata sandi salah.' });
    }

    const user = rows[0];
    // Upgrade legacy hash to Bcrypt automatically on login
    if (!user.Password_Hash.startsWith('$2')) {
      const newBcrypt = hashPassword(password);
      await pool.query('UPDATE users SET "Password_Hash" = $1 WHERE "ID" = $2', [newBcrypt, user.ID]);
    }

    const accessToken = jwt.sign(
      { sub: String(user.ID), id: user.ID, role: user.Role, email: user.Email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    const refreshToken = jwt.sign(
      { sub: String(user.ID), type: 'refresh' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    await recordAuditLog({
      userId: user.ID,
      aksi: 'LOGIN_JWT',
      modul: 'users',
      recordId: user.ID,
      after: { email: user.Email, role: user.Role },
      summary: `Login berhasil (${user.Role}): ${user.Email}`,
      req
    });

    res.setHeader('Set-Cookie', `siomas_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    res.json({
      status: 'success',
      message: 'Login berhasil.',
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: formatUserRow(user)
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get(['/api/v1/auth/me', '/api/auth/me'], requireAuth, async (req, res) => {
  res.json({ status: 'success', data: formatUserRow(req.user) });
});

app.get(['/api/v1/auth/users', '/api/auth/users'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query('SELECT * FROM users ORDER BY "ID" DESC');
    const filtered = rows.filter(u => {
      if (u.ID === req.user.ID) return false;
      if (u.Role === 'Ketua' || u.Role === 'Admin') return false;
      if (actorUkm) return getUkmFromJobDesc(u.Job_Desc) === actorUkm;
      return true;
    });

    res.json({
      status: 'success',
      managed_ukm: actorUkm || null,
      data: filtered.map(formatUserRow)
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.patch(['/api/v1/auth/users/:id/verify', '/api/auth/users/:id/verify'], requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { rows } = await pool.query('SELECT * FROM users WHERE "ID" = $1', [targetId]);
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan.' });

    const target = rows[0];
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    if (actorUkm && getUkmFromJobDesc(target.Job_Desc) !== actorUkm) {
      return res.status(403).json({ status: 'error', message: `Anda hanya berwenang memverifikasi anggota dari ${actorUkm}.` });
    }

    const beforeData = formatUserRow(target);
    const { rows: updated } = await pool.query(
      `UPDATE users SET "Status_Keanggotaan" = 'Aktif', "Updated_By" = $1 WHERE "ID" = $2 RETURNING *`,
      [req.user.ID, targetId]
    );
    const afterData = formatUserRow(updated[0]);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'VERIFY_MEMBER',
      modul: 'users',
      recordId: targetId,
      before: beforeData,
      after: afterData,
      summary: `Verifikasi keanggotaan ${afterData.nama} menjadi Aktif`,
      req
    });

    res.json({ status: 'success', message: 'Akun anggota berhasil diverifikasi dan diaktifkan.', data: afterData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.put(['/api/v1/auth/users/:id', '/api/auth/users/:id'], requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { rows } = await pool.query('SELECT * FROM users WHERE "ID" = $1', [targetId]);
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan.' });

    const target = rows[0];
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    if (actorUkm && getUkmFromJobDesc(target.Job_Desc) !== actorUkm) {
      return res.status(403).json({ status: 'error', message: `Anda hanya berwenang mengelola anggota dari ${actorUkm}.` });
    }

    const beforeData = formatUserRow(target);
    const newRole = req.body.role || target.Role;
    const newStatus = req.body.status_keanggotaan || target.Status_Keanggotaan;
    const newJobDesc = req.body.job_desc !== undefined ? req.body.job_desc : target.Job_Desc;

    const { rows: updated } = await pool.query(
      `UPDATE users SET "Role" = $1, "Status_Keanggotaan" = $2, "Job_Desc" = $3, "Updated_By" = $4 WHERE "ID" = $5 RETURNING *`,
      [newRole, newStatus, newJobDesc, req.user.ID, targetId]
    );
    const afterData = formatUserRow(updated[0]);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'UPDATE_USER_RBAC',
      modul: 'users',
      recordId: targetId,
      before: beforeData,
      after: afterData,
      summary: `Perubahan RBAC ${afterData.nama}: Role=${newRole}, Status=${newStatus}`,
      req
    });

    res.json({ status: 'success', message: 'Data pengguna berhasil diperbarui.', data: afterData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.delete(['/api/v1/auth/users/:id', '/api/auth/users/:id'], requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { rows } = await pool.query('SELECT * FROM users WHERE "ID" = $1', [targetId]);
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan.' });

    const target = rows[0];
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    if (actorUkm && getUkmFromJobDesc(target.Job_Desc) !== actorUkm) {
      return res.status(403).json({ status: 'error', message: `Anda hanya berwenang menghapus anggota dari ${actorUkm}.` });
    }

    const beforeData = formatUserRow(target);
    await pool.query('DELETE FROM users WHERE "ID" = $1', [targetId]);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'DELETE_USER',
      modul: 'users',
      recordId: targetId,
      before: beforeData,
      after: null,
      summary: `Menghapus akun anggota ${beforeData.nama}`,
      req
    });

    res.json({ status: 'success', message: 'Anggota berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============================================================================
// UC-01: Profile & Jobdesk (/api/v1/profile & /api/profile)
// ============================================================================

app.get(['/api/v1/profile', '/api/profile'], requireAuth, async (req, res) => {
  res.json({ status: 'success', data: formatUserRow(req.user) });
});

app.put(['/api/v1/profile', '/api/profile'], requireAuth, async (req, res) => {
  try {
    const beforeData = formatUserRow(req.user);
    const { nama, nim, email, password, ukm, divisi, job_desc } = req.body || {};

    const nextNama = nama ? String(nama).trim() : req.user.Nama;
    const nextNim = nim !== undefined ? String(nim).trim() : req.user.NIM;
    const nextEmail = email ? String(email).trim().toLowerCase() : req.user.Email;

    let nextJobDesc = req.user.Job_Desc;
    if (ukm !== undefined || divisi !== undefined) {
      const ukmVal = ukm !== undefined ? String(ukm).trim() : getUkmFromJobDesc(req.user.Job_Desc);
      const divVal = divisi !== undefined ? String(divisi).trim() : getDivisiFromJobDesc(req.user.Job_Desc, req.user.Role);
      nextJobDesc = ukmVal ? `${ukmVal} • ${divVal}` : divVal;
    } else if (job_desc !== undefined) {
      nextJobDesc = String(job_desc).trim();
    }

    const nextPwdHash = password ? hashPassword(password) : req.user.Password_Hash;

    const { rows: updated } = await pool.query(
      `UPDATE users
       SET "Nama" = $1, "NIM" = $2, "Email" = $3, "Job_Desc" = $4, "Password_Hash" = $5, "Updated_By" = $6
       WHERE "ID" = $7 RETURNING *`,
      [nextNama, nextNim, nextEmail, nextJobDesc, nextPwdHash, req.user.ID, req.user.ID]
    );
    const afterData = formatUserRow(updated[0]);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'UPDATE_PROFILE',
      modul: 'users',
      recordId: req.user.ID,
      before: beforeData,
      after: afterData,
      summary: `Memperbarui profil & jobdesk: ${afterData.nama}`,
      req
    });

    res.json({ status: 'success', message: 'Profil berhasil diperbarui.', data: afterData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get(['/api/v1/profile/jobdesks', '/api/profile/jobdesks'], requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE "Status_Keanggotaan" = 'Aktif' ORDER BY "Role" ASC, "Nama" ASC`
    );
    const filtered = actorUkm
      ? rows.filter(u => getUkmFromJobDesc(u.Job_Desc) === actorUkm)
      : rows;
    res.json({ status: 'success', data: filtered.map(formatUserRow) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============================================================================
// UC-04: Schedules / Kalender Agenda (/api/v1/schedules & /api/schedules)
// ============================================================================

function formatScheduleRow(s, creatorName) {
  return {
    id: s.ID,
    judul_kegiatan: s.Judul_Kegiatan,
    kategori: s.Kategori || 'Umum',
    waktu: s.Waktu ? new Date(s.Waktu).toISOString().replace('T', ' ').slice(0, 19) : null,
    lokasi: s.Lokasi,
    keterangan: s.Keterangan,
    divisi_id: s.Divisi_ID,
    divisi_nama: creatorName || 'Pengurus UKM',
    updated_by: s.Updated_By
  };
}

app.get(['/api/v1/schedules', '/api/schedules'], requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT s.*, u."Nama" AS creator_name, u."Job_Desc" AS creator_job
       FROM schedules s
       LEFT JOIN users u ON s."Divisi_ID" = u."ID"
       ORDER BY s."Waktu" ASC`
    );
    const filtered = actorUkm
      ? rows.filter(r => !r.creator_job || getUkmFromJobDesc(r.creator_job) === actorUkm)
      : rows;
    res.json({
      status: 'success',
      data: filtered.map(r => formatScheduleRow(r, r.creator_name))
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post(['/api/v1/schedules', '/api/schedules'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
  try {
    const { judul_kegiatan, kategori, waktu, lokasi, keterangan } = req.body || {};
    if (!judul_kegiatan || !waktu) {
      return res.status(400).json({ status: 'error', message: 'Judul kegiatan dan waktu wajib diisi.' });
    }
    const { rows } = await pool.query(
      `INSERT INTO schedules ("Judul_Kegiatan", "Kategori", "Waktu", "Lokasi", "Keterangan", "Divisi_ID", "Updated_By")
       VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
      [judul_kegiatan.trim(), kategori || 'Umum', waktu, lokasi || 'Kampus', keterangan || '', req.user.ID]
    );
    const formatted = formatScheduleRow(rows[0], req.user.Nama);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'INSERT_SCHEDULE',
      modul: 'schedules',
      recordId: rows[0].ID,
      before: null,
      after: formatted,
      summary: `Menambahkan jadwal kegiatan: ${formatted.judul_kegiatan}`,
      req
    });

    res.status(201).json({ status: 'success', message: 'Jadwal kegiatan berhasil ditambahkan.', data: formatted });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.put(['/api/v1/schedules/:id', '/api/schedules/:id'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows: oldRows } = await pool.query('SELECT * FROM schedules WHERE "ID" = $1', [id]);
    if (!oldRows.length) return res.status(404).json({ status: 'error', message: 'Jadwal tidak ditemukan.' });

    const old = oldRows[0];
    const { judul_kegiatan, kategori, waktu, lokasi, keterangan } = req.body || {};
    const { rows: updated } = await pool.query(
      `UPDATE schedules
       SET "Judul_Kegiatan" = $1, "Kategori" = $2, "Waktu" = $3, "Lokasi" = $4, "Keterangan" = $5, "Updated_By" = $6
       WHERE "ID" = $7 RETURNING *`,
      [
        judul_kegiatan || old.Judul_Kegiatan,
        kategori || old.Kategori,
        waktu || old.Waktu,
        lokasi !== undefined ? lokasi : old.Lokasi,
        keterangan !== undefined ? keterangan : old.Keterangan,
        req.user.ID,
        id
      ]
    );
    const afterFormatted = formatScheduleRow(updated[0], req.user.Nama);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'UPDATE_SCHEDULE',
      modul: 'schedules',
      recordId: id,
      before: formatScheduleRow(old),
      after: afterFormatted,
      summary: `Memperbarui jadwal kegiatan: ${afterFormatted.judul_kegiatan}`,
      req
    });

    res.json({ status: 'success', message: 'Jadwal berhasil diperbarui.', data: afterFormatted });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.delete(['/api/v1/schedules/:id', '/api/schedules/:id'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows: oldRows } = await pool.query('SELECT * FROM schedules WHERE "ID" = $1', [id]);
    if (!oldRows.length) return res.status(404).json({ status: 'error', message: 'Jadwal tidak ditemukan.' });

    await pool.query('DELETE FROM schedules WHERE "ID" = $1', [id]);
    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'DELETE_SCHEDULE',
      modul: 'schedules',
      recordId: id,
      before: formatScheduleRow(oldRows[0]),
      after: null,
      summary: `Menghapus jadwal kegiatan: ${oldRows[0].Judul_Kegiatan}`,
      req
    });

    res.json({ status: 'success', message: 'Jadwal berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============================================================================
// UC-03 & UC-05: Announcements Read & Manage (/api/v1/announcements/*)
// ============================================================================

app.get(['/api/v1/announcements/feed', '/api/v1/announcements/manage', '/api/announcements'], requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT a.*, u."Nama" AS author_name, u."Job_Desc" AS author_job,
              ar."Is_Read" AS user_is_read, ar."Read_At" AS user_read_at,
              (SELECT COUNT(*) FROM announcement_reads r WHERE r."Announcement_ID" = a."ID" AND r."Is_Read" = TRUE) AS read_count
       FROM announcements a
       LEFT JOIN users u ON a."Created_By" = u."ID"
       LEFT JOIN announcement_reads ar ON ar."Announcement_ID" = a."ID" AND ar."User_ID" = $1
       ORDER BY a."Created_At" DESC, a."ID" DESC`,
      [req.user.ID]
    );

    const filtered = actorUkm
      ? rows.filter(r => !r.author_job || getUkmFromJobDesc(r.author_job) === actorUkm)
      : rows;

    const data = filtered.map(a => ({
      id: a.ID,
      judul: a.Judul,
      isi: a.Isi,
      is_important: Boolean(a.Is_Important),
      created_by: a.Created_By,
      author_name: a.author_name || 'Admin UKM',
      created_at: a.Created_At ? new Date(a.Created_At).toISOString().replace('T', ' ').slice(0, 19) : null,
      is_read: Boolean(a.user_is_read),
      read_at: a.user_read_at ? new Date(a.user_read_at).toISOString().replace('T', ' ').slice(0, 19) : null,
      read_count: parseInt(a.read_count || 0, 10)
    }));

    const unreadCount = data.filter(d => !d.is_read).length;
    res.json({ status: 'success', unread_count: unreadCount, data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.patch(['/api/v1/announcements/feed/:id/read', '/api/announcements/:id/read'], requireAuth, async (req, res) => {
  return markAnnouncementRead(req, res);
});
app.put(['/api/v1/announcements/feed/:id/read', '/api/announcements/:id/read'], requireAuth, async (req, res) => {
  return markAnnouncementRead(req, res);
});

async function markAnnouncementRead(req, res) {
  try {
    const annId = parseInt(req.params.id, 10);
    const { rows: existing } = await pool.query(
      `SELECT * FROM announcement_reads WHERE "Announcement_ID" = $1 AND "User_ID" = $2`,
      [annId, req.user.ID]
    );
    if (existing.length) {
      await pool.query(
        `UPDATE announcement_reads SET "Is_Read" = TRUE, "Read_At" = NOW() WHERE "ID" = $1`,
        [existing[0].ID]
      );
    } else {
      await pool.query(
        `INSERT INTO announcement_reads ("Announcement_ID", "User_ID", "Is_Read", "Read_At")
         VALUES ($1, $2, TRUE, NOW())`,
        [annId, req.user.ID]
      );
    }
    res.json({
      status: 'success',
      message: 'Pengumuman ditandai sudah dibaca (pengingat email otomatis dihentikan untuk akun Anda).'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

app.post(['/api/v1/announcements/manage', '/api/announcements'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
  try {
    const { judul, isi, is_important } = req.body || {};
    if (!judul || !isi) {
      return res.status(400).json({ status: 'error', message: 'Judul dan isi pengumuman wajib diisi.' });
    }
    const importantFlag = Boolean(is_important);
    const { rows } = await pool.query(
      `INSERT INTO announcements ("Judul", "Isi", "Is_Important", "Created_By", "Created_At", "Updated_By")
       VALUES ($1, $2, $3, $4, NOW(), $4) RETURNING *`,
      [judul.trim(), isi.trim(), importantFlag, req.user.ID]
    );
    const ann = rows[0];

    let emailResult = null;
    if (importantFlag) {
      emailResult = await triggerAnnouncementEmails(ann, req.user);
    }

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'CREATE_ANNOUNCEMENT',
      modul: 'announcements',
      recordId: ann.ID,
      before: null,
      after: { id: ann.ID, judul: ann.Judul, is_important: importantFlag },
      summary: `Membuat pengumuman: ${ann.Judul} (Penting: ${importantFlag})`,
      req
    });

    res.status(201).json({
      status: 'success',
      message: importantFlag
        ? 'Pengumuman penting berhasil dipublikasikan dan notifikasi email pertama (Attempt-1) telah dikirim.'
        : 'Pengumuman berhasil dipublikasikan.',
      email_dispatch: emailResult,
      data: {
        id: ann.ID,
        judul: ann.Judul,
        isi: ann.Isi,
        is_important: Boolean(ann.Is_Important),
        created_by: ann.Created_By,
        author_name: req.user.Nama
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.delete(['/api/v1/announcements/manage/:id', '/api/announcements/:id'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM announcements WHERE "ID" = $1', [id]);
    res.json({ status: 'success', message: 'Pengumuman berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============================================================================
// UC-06, UC-08, UC-09, UC-10: Documents, LPJ, Sipakamase & Vault (.ZIP Bundle)
// ============================================================================

function formatDocRow(d) {
  return {
    id: d.ID,
    nama_berkas: d.Nama_Berkas,
    kategori: d.Kategori,
    path_file: d.Path_File,
    status: d.Status,
    catatan_revisi: d.Catatan_Revisi || '',
    is_deleted: Boolean(d.Is_Deleted),
    uploaded_by: d.Uploaded_By,
    uploader_name: d.uploader_name || 'Pengurus',
    approved_by: d.Approved_By,
    approver_name: d.approver_name || null,
    created_at: d.Created_At ? new Date(d.Created_At).toISOString().replace('T', ' ').slice(0, 19) : null,
    updated_at: d.Updated_At ? new Date(d.Updated_At).toISOString().replace('T', ' ').slice(0, 19) : null
  };
}

// UC-06: Upload Draft LPJ
app.post(['/api/v1/lpj/upload', '/api/documents/upload'], requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Berkas wajib diunggah.' });
    }
    const namaBerkas = (req.body.nama_berkas || req.file.originalname).trim();
    const kategori = req.body.kategori || 'LPJ';
    const { rows } = await pool.query(
      `INSERT INTO documents ("Nama_Berkas", "Kategori", "Path_File", "Status", "Is_Deleted", "Uploaded_By", "Created_At")
       VALUES ($1, $2, $3, 'Draft', FALSE, $4, NOW()) RETURNING *`,
      [namaBerkas, kategori, req.file.filename, req.user.ID]
    );
    const doc = rows[0];
    doc.uploader_name = req.user.Nama;

    await recordAuditLog({
      userId: req.user.ID,
      aksi: `INSERT_${kategori.toUpperCase()}`,
      modul: 'documents',
      recordId: doc.ID,
      before: null,
      after: formatDocRow(doc),
      summary: `Mengunggah berkas ${kategori}: ${namaBerkas}`,
      req
    });

    res.status(201).json({ status: 'success', message: 'Berkas berhasil diunggah.', data: formatDocRow(doc) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// UC-06: Update / Resubmit Revised LPJ
app.put(['/api/v1/lpj/:id'], requireAuth, upload.single('file'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows: oldRows } = await pool.query('SELECT * FROM documents WHERE "ID" = $1', [id]);
    if (!oldRows.length) return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan.' });

    const old = oldRows[0];
    const nextName = req.body.nama_berkas ? req.body.nama_berkas.trim() : old.Nama_Berkas;
    const nextFile = req.file ? req.file.filename : old.Path_File;

    const { rows: updated } = await pool.query(
      `UPDATE documents
       SET "Nama_Berkas" = $1, "Path_File" = $2, "Status" = 'Draft', "Updated_By" = $3, "Updated_At" = NOW()
       WHERE "ID" = $4 RETURNING *`,
      [nextName, nextFile, req.user.ID, id]
    );

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'RESUBMIT_LPJ',
      modul: 'documents',
      recordId: id,
      before: formatDocRow(old),
      after: formatDocRow(updated[0]),
      summary: `Mengunggah ulang perbaikan LPJ: ${nextName}`,
      req
    });

    res.json({ status: 'success', message: 'Perbaikan LPJ berhasil diunggah ulang.', data: formatDocRow(updated[0]) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// UC-06: My LPJ Submissions
app.get('/api/v1/lpj/my-submissions', requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT d.*, u."Nama" AS uploader_name, u."Job_Desc" AS uploader_job, a."Nama" AS approver_name
       FROM documents d
       LEFT JOIN users u ON d."Uploaded_By" = u."ID"
       LEFT JOIN users a ON d."Approved_By" = a."ID"
       WHERE d."Kategori" = 'LPJ' AND d."Is_Deleted" = FALSE
       ORDER BY d."ID" DESC`
    );
    const filtered = actorUkm
      ? rows.filter(r => !r.uploader_job || getUkmFromJobDesc(r.uploader_job) === actorUkm)
      : rows;
    res.json({ status: 'success', data: filtered.map(formatDocRow) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// UC-09: Pending LPJ Queue & Validation
app.get(['/api/v1/lpj-validation/pending', '/api/documents/pending'], requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT d.*, u."Nama" AS uploader_name, u."Job_Desc" AS uploader_job
       FROM documents d
       LEFT JOIN users u ON d."Uploaded_By" = u."ID"
       WHERE d."Kategori" = 'LPJ' AND d."Status" = 'Draft' AND d."Is_Deleted" = FALSE
       ORDER BY d."ID" DESC`
    );
    const filtered = actorUkm
      ? rows.filter(r => !r.uploader_job || getUkmFromJobDesc(r.uploader_job) === actorUkm)
      : rows;
    res.json({ status: 'success', data: filtered.map(formatDocRow) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.patch(['/api/v1/lpj-validation/:id/validate', '/api/documents/:id/status'], requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, catatan_revisi } = req.body || {};
    if (!['Approved', 'Revisi'].includes(status)) {
      return res.status(400).json({ status: 'error', message: "Status harus 'Approved' atau 'Revisi'." });
    }
    const { rows: oldRows } = await pool.query('SELECT * FROM documents WHERE "ID" = $1', [id]);
    if (!oldRows.length) return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan.' });

    const beforeData = formatDocRow(oldRows[0]);
    const { rows: updated } = await pool.query(
      `UPDATE documents
       SET "Status" = $1, "Catatan_Revisi" = $2, "Approved_By" = $3, "Updated_By" = $3, "Updated_At" = NOW()
       WHERE "ID" = $4 RETURNING *`,
      [status, catatan_revisi || '', req.user.ID, id]
    );
    const afterData = formatDocRow(updated[0]);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: status === 'Approved' ? 'APPROVE_LPJ' : 'REVISE_LPJ',
      modul: 'documents',
      recordId: id,
      before: beforeData,
      after: afterData,
      summary: `Validasi LPJ "${afterData.nama_berkas}" -> ${status}`,
      req
    });

    res.json({ status: 'success', message: `Status LPJ diperbarui menjadi ${status}.`, data: afterData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// UC-08: Sipakamase Verification
app.get('/api/v1/sipakamase', requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const statusFilter = req.query.status;
    const { rows } = await pool.query(
      `SELECT d.*, u."Nama" AS uploader_name, u."Job_Desc" AS uploader_job
       FROM documents d
       LEFT JOIN users u ON d."Uploaded_By" = u."ID"
       WHERE d."Kategori" = 'Sipakamase' AND d."Is_Deleted" = FALSE
       ORDER BY d."ID" DESC`
    );
    let filtered = actorUkm
      ? rows.filter(r => !r.uploader_job || getUkmFromJobDesc(r.uploader_job) === actorUkm)
      : rows;
    if (statusFilter) {
      filtered = filtered.filter(r => r.Status === statusFilter);
    }
    res.json({ status: 'success', data: filtered.map(formatDocRow) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.patch('/api/v1/sipakamase/:id/verify', requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, catatan } = req.body || {};
    const { rows: oldRows } = await pool.query('SELECT * FROM documents WHERE "ID" = $1', [id]);
    if (!oldRows.length) return res.status(404).json({ status: 'error', message: 'Dokumen Sipakamase tidak ditemukan.' });

    const beforeData = formatDocRow(oldRows[0]);
    const { rows: updated } = await pool.query(
      `UPDATE documents
       SET "Status" = $1, "Catatan_Revisi" = $2, "Approved_By" = $3, "Updated_By" = $3, "Updated_At" = NOW()
       WHERE "ID" = $4 RETURNING *`,
      [status || 'Approved', catatan || '', req.user.ID, id]
    );
    const afterData = formatDocRow(updated[0]);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'VERIFY_SIPAKAMASE',
      modul: 'documents',
      recordId: id,
      before: beforeData,
      after: afterData,
      summary: `Verifikasi Sipakamase "${afterData.nama_berkas}" -> ${afterData.status}`,
      req
    });

    res.json({ status: 'success', message: 'Dokumen Sipakamase berhasil diverifikasi.', data: afterData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// UC-10: Repository Vault List, Upload, Category Update, Soft-Delete, Download & ZIP Bundle
app.get(['/api/v1/documents', '/api/documents'], requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT d.*, u."Nama" AS uploader_name, u."Job_Desc" AS uploader_job, a."Nama" AS approver_name
       FROM documents d
       LEFT JOIN users u ON d."Uploaded_By" = u."ID"
       LEFT JOIN users a ON d."Approved_By" = a."ID"
       WHERE d."Is_Deleted" = FALSE
       ORDER BY d."ID" DESC`
    );
    let filtered = actorUkm
      ? rows.filter(r => !r.uploader_job || getUkmFromJobDesc(r.uploader_job) === actorUkm)
      : rows;
    if (req.query.kategori && req.query.kategori !== 'Semua') {
      filtered = filtered.filter(r => r.Kategori === req.query.kategori);
    }
    res.json({ status: 'success', data: filtered.map(formatDocRow) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post(['/api/v1/documents/upload'], requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'Berkas wajib dipilih.' });
    const namaBerkas = (req.body.nama_berkas || req.file.originalname).trim();
    const kategori = req.body.kategori || 'Surat';
    const initStatus = req.user.Role === 'Ketua' || req.user.Role === 'Admin' ? 'Approved' : 'Draft';

    const { rows } = await pool.query(
      `INSERT INTO documents ("Nama_Berkas", "Kategori", "Path_File", "Status", "Is_Deleted", "Uploaded_By", "Approved_By", "Created_At")
       VALUES ($1, $2, $3, $4, FALSE, $5, $6, NOW()) RETURNING *`,
      [namaBerkas, kategori, req.file.filename, initStatus, req.user.ID, initStatus === 'Approved' ? req.user.ID : null]
    );
    const afterData = formatDocRow(rows[0]);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'UPLOAD_VAULT_DOC',
      modul: 'documents',
      recordId: afterData.id,
      before: null,
      after: afterData,
      summary: `Mengunggah dokumen ke Vault: ${namaBerkas} (${kategori})`,
      req
    });

    res.status(201).json({ status: 'success', message: 'Dokumen berhasil diunggah ke Vault.', data: afterData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// UC-10: Download ZIP Bundle (Sequence Diagram 5)
app.get(['/api/v1/documents/bundle', '/api/documents/bundle'], requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const kategori = req.query.kategori;
    const { rows } = await pool.query(
      `SELECT d.*, u."Job_Desc" AS uploader_job
       FROM documents d
       LEFT JOIN users u ON d."Uploaded_By" = u."ID"
       WHERE d."Is_Deleted" = FALSE
       ORDER BY d."ID" DESC`
    );
    let docs = actorUkm
      ? rows.filter(r => !r.uploader_job || getUkmFromJobDesc(r.uploader_job) === actorUkm)
      : rows;
    if (kategori && kategori !== 'Semua') {
      docs = docs.filter(d => d.Kategori === kategori);
    }

    const zipName = `Bundel_${kategori && kategori !== 'Semua' ? kategori : 'Semua_Dokumen'}_SIOMAS.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const d of docs) {
      const fullPath = path.join(UPLOAD_DIR, path.basename(d.Path_File || ''));
      const ext = path.extname(d.Path_File || '') || '.pdf';
      const safeName = `${d.ID}_${(d.Nama_Berkas || 'Dokumen').replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`;
      if (fs.existsSync(fullPath)) {
        archive.file(fullPath, { name: safeName });
      } else {
        archive.append(
          `Dokumen SIOMAS\nID: ${d.ID}\nNama Berkas: ${d.Nama_Berkas}\nKategori: ${d.Kategori}\nStatus: ${d.Status}\n`,
          { name: safeName }
        );
      }
    }

    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
});

// UC-10: Single Document Download
app.get(['/api/v1/documents/:id/download', '/api/documents/:id/download'], requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await pool.query('SELECT * FROM documents WHERE "ID" = $1 AND "Is_Deleted" = FALSE', [id]);
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan.' });

    const doc = rows[0];
    const fullPath = path.join(UPLOAD_DIR, path.basename(doc.Path_File || ''));
    const ext = path.extname(doc.Path_File || '') || '.pdf';
    const downloadName = `${(doc.Nama_Berkas || 'Dokumen').replace(/[^a-zA-Z0-9_.-]/g, '_')}${ext}`;

    if (fs.existsSync(fullPath)) {
      return res.download(fullPath, downloadName);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    return res.send(Buffer.from(`%PDF-1.4\n% Dokumen SIOMAS: ${doc.Nama_Berkas}\n`));
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// UC-10: Update Category
app.patch(['/api/v1/documents/:id/category'], requireAuth, async (req, res) => {
  return updateDocCategory(req, res);
});
app.put(['/api/v1/documents/:id/kategori', '/api/documents/:id/kategori'], requireAuth, async (req, res) => {
  return updateDocCategory(req, res);
});

async function updateDocCategory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { kategori, nama_berkas } = req.body || {};
    const { rows: oldRows } = await pool.query('SELECT * FROM documents WHERE "ID" = $1', [id]);
    if (!oldRows.length) return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan.' });

    const old = oldRows[0];
    const { rows: updated } = await pool.query(
      `UPDATE documents SET "Kategori" = $1, "Nama_Berkas" = $2, "Updated_By" = $3, "Updated_At" = NOW() WHERE "ID" = $4 RETURNING *`,
      [kategori || old.Kategori, nama_berkas || old.Nama_Berkas, req.user.ID, id]
    );

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'UPDATE_DOC_CATEGORY',
      modul: 'documents',
      recordId: id,
      before: formatDocRow(old),
      after: formatDocRow(updated[0]),
      summary: `Mengubah kategori dokumen #${id} ke ${kategori}`,
      req
    });

    res.json({ status: 'success', message: 'Kategori dokumen berhasil diperbarui.', data: formatDocRow(updated[0]) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

// UC-10: Soft-Delete Document
app.delete(['/api/v1/documents/:id', '/api/documents/:id'], requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows: oldRows } = await pool.query('SELECT * FROM documents WHERE "ID" = $1', [id]);
    if (!oldRows.length) return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan.' });

    const { rows: updated } = await pool.query(
      `UPDATE documents SET "Is_Deleted" = TRUE, "Updated_By" = $1, "Updated_At" = NOW() WHERE "ID" = $2 RETURNING *`,
      [req.user.ID, id]
    );

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'SOFT_DELETE_DOCUMENT',
      modul: 'documents',
      recordId: id,
      before: formatDocRow(oldRows[0]),
      after: formatDocRow(updated[0]),
      summary: `Soft-delete dokumen "${oldRows[0].Nama_Berkas}" (Is_Deleted=true)`,
      req
    });

    res.json({ status: 'success', message: 'Dokumen berhasil diarsipkan (soft-delete).' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============================================================================
// UC-11: Hub Inter-UKM & Kolaborasi (BR-02)
// ============================================================================

const postInterestsMemory = new Map(); // postId -> Set(userId)

function formatInterUkmPost(p, currentUserId) {
  const set = postInterestsMemory.get(p.ID) || new Set();
  const baseLikes = (p.ID * 7) % 19 + 5;
  return {
    id: p.ID,
    ukm_pengirim: p.UKM_Pengirim,
    judul: p.Judul,
    isi_pengumuman: p.Isi_Pengumuman,
    status_persetujuan: p.Status_Persetujuan,
    date: p.Date ? new Date(p.Date).toISOString().replace('T', ' ').slice(0, 19) : null,
    created_by: p.Created_By,
    creator_name: p.creator_name || 'Pengurus UKM',
    approved_by: p.Approved_By,
    interest_count: baseLikes + set.size,
    is_interested: currentUserId ? set.has(currentUserId) : false
  };
}

app.get(['/api/v1/interukm/feed', '/api/interukm-posts'], requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u."Nama" AS creator_name
       FROM interukm_posts p
       LEFT JOIN users u ON p."Created_By" = u."ID"
       WHERE p."Status_Persetujuan" = 'Disetujui'
       ORDER BY p."ID" DESC`
    );
    res.json({ status: 'success', data: rows.map(r => formatInterUkmPost(r, req.user.ID)) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/v1/interukm/my-posts', requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT p.*, u."Nama" AS creator_name, u."Job_Desc" AS creator_job
       FROM interukm_posts p
       LEFT JOIN users u ON p."Created_By" = u."ID"
       ORDER BY p."ID" DESC`
    );
    const filtered = rows.filter(r =>
      r.Created_By === req.user.ID ||
      (actorUkm && r.creator_job && getUkmFromJobDesc(r.creator_job) === actorUkm)
    );
    res.json({ status: 'success', data: filtered.map(r => formatInterUkmPost(r, req.user.ID)) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/v1/interukm/pending', requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT p.*, u."Nama" AS creator_name, u."Job_Desc" AS creator_job
       FROM interukm_posts p
       LEFT JOIN users u ON p."Created_By" = u."ID"
       WHERE p."Status_Persetujuan" = 'Menunggu Verifikasi'
       ORDER BY p."ID" DESC`
    );
    const filtered = actorUkm
      ? rows.filter(r => !r.creator_job || getUkmFromJobDesc(r.creator_job) === actorUkm)
      : rows;
    res.json({ status: 'success', data: filtered.map(r => formatInterUkmPost(r, req.user.ID)) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post(
  ['/api/v1/interukm/posts', '/api/interukm-posts'],
  requireAuth,
  upload.fields([{ name: 'foto', maxCount: 1 }, { name: 'proposal', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { ukm_pengirim, judul, isi_pengumuman } = req.body || {};
      if (!judul || !isi_pengumuman) {
        return res.status(400).json({ status: 'error', message: 'Judul dan isi pengumuman wajib diisi.' });
      }

      const extraParts = [];
      if (req.files?.foto?.[0]) {
        extraParts.push(`BannerURL: /api/v1/interukm/files/${req.files.foto[0].filename}`);
      }
      if (req.files?.proposal?.[0]) {
        extraParts.push(`FileURL: /api/v1/interukm/files/${req.files.proposal[0].filename}`);
      }
      const fullContent = [isi_pengumuman.trim(), ...extraParts].join(' • ');
      const actorUkm = getUkmFromJobDesc(req.user.Job_Desc) || ukm_pengirim || 'SIOMAS';
      const senderLabel = ukm_pengirim && ukm_pengirim.includes('(') ? ukm_pengirim : `${actorUkm}`;

      // BR-02: If created by Ketua/Admin, can be auto-approved or pending; if Pengurus, Menunggu Verifikasi
      const isKetua = req.user.Role === 'Ketua' || req.user.Role === 'Admin';
      const statusPersetujuan = isKetua ? 'Disetujui' : 'Menunggu Verifikasi';

      const { rows } = await pool.query(
        `INSERT INTO interukm_posts ("UKM_Pengirim", "Judul", "Isi_Pengumuman", "Status_Persetujuan", "Date", "Created_By", "Approved_By")
         VALUES ($1, $2, $3, $4, NOW(), $5, $6) RETURNING *`,
        [senderLabel, judul.trim(), fullContent, statusPersetujuan, req.user.ID, isKetua ? req.user.ID : null]
      );
      const post = formatInterUkmPost(rows[0], req.user.ID);

      await recordAuditLog({
        userId: req.user.ID,
        aksi: 'CREATE_INTERUKM_POST',
        modul: 'interukm_posts',
        recordId: post.id,
        before: null,
        after: post,
        summary: `Membuat publikasi Inter-UKM: ${post.judul} (${statusPersetujuan})`,
        req
      });

      res.status(201).json({ status: 'success', message: 'Publikasi Inter-UKM berhasil disimpan.', data: post });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

app.patch('/api/v1/interukm/posts/:id/approve', requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows: oldRows } = await pool.query('SELECT * FROM interukm_posts WHERE "ID" = $1', [id]);
    if (!oldRows.length) return res.status(404).json({ status: 'error', message: 'Publikasi tidak ditemukan.' });

    const { rows: updated } = await pool.query(
      `UPDATE interukm_posts
       SET "Status_Persetujuan" = 'Disetujui', "Approved_By" = $1, "Updated_By" = $1, "Updated_At" = NOW()
       WHERE "ID" = $2 RETURNING *`,
      [req.user.ID, id]
    );
    const afterData = formatInterUkmPost(updated[0], req.user.ID);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'APPROVE_POST',
      modul: 'interukm_posts',
      recordId: id,
      before: formatInterUkmPost(oldRows[0]),
      after: afterData,
      summary: `Menyetujui publikasi Inter-UKM (BR-02): ${afterData.judul}`,
      req
    });

    res.json({ status: 'success', message: 'Publikasi Inter-UKM disetujui dan disiarkan.', data: afterData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.patch('/api/v1/interukm/posts/:id/reject', requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows: updated } = await pool.query(
      `UPDATE interukm_posts
       SET "Status_Persetujuan" = 'Ditolak', "Updated_By" = $1, "Updated_At" = NOW()
       WHERE "ID" = $2 RETURNING *`,
      [req.user.ID, id]
    );
    if (!updated.length) return res.status(404).json({ status: 'error', message: 'Publikasi tidak ditemukan.' });
    res.json({ status: 'success', message: 'Publikasi Inter-UKM ditolak.', data: formatInterUkmPost(updated[0], req.user.ID) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/v1/interukm/posts/:id/interest', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!postInterestsMemory.has(id)) postInterestsMemory.set(id, new Set());
  const set = postInterestsMemory.get(id);
  if (set.has(req.user.ID)) set.delete(req.user.ID);
  else set.add(req.user.ID);

  const baseLikes = (id * 7) % 19 + 5;
  res.json({
    status: 'success',
    data: {
      post_id: id,
      is_interested: set.has(req.user.ID),
      interest_count: baseLikes + set.size
    }
  });
});

// ============================================================================
// UC-07 & UC-12: Attendance Summary, Email Logs, Scheduler, Webhook & Audit Logs
// ============================================================================

app.get('/api/v1/attendance/summary', requireAuth, async (req, res) => {
  res.json({
    status: 'success',
    data: { total_pertemuan: 12, rata_rata_kehadiran: 92, hadir: 22, izin: 2 }
  });
});

app.get('/api/v1/notifications/email/logs', requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT el.*, a."Judul" AS announcement_title, u."Nama" AS recipient_name, u."Email" AS recipient_email, u."Job_Desc" AS recipient_job
       FROM email_logs el
       LEFT JOIN announcements a ON el."Announcement_ID" = a."ID"
       LEFT JOIN users u ON el."User_ID" = u."ID"
       ORDER BY el."ID" DESC LIMIT 200`
    );
    const filtered = actorUkm
      ? rows.filter(r => !r.recipient_job || getUkmFromJobDesc(r.recipient_job) === actorUkm)
      : rows;
    res.json({
      status: 'success',
      data: filtered.map(l => ({
        id: l.ID,
        announcement_id: l.Announcement_ID,
        announcement_title: l.announcement_title || 'Notifikasi SIOMAS',
        user_id: l.User_ID,
        recipient_name: l.recipient_name || 'Anggota',
        recipient_email: l.recipient_email || '-',
        attempt_number: l.Attempt_Number || 1,
        sent_at: l.Sent_At ? new Date(l.Sent_At).toISOString().replace('T', ' ').slice(0, 19) : null,
        status_pengiriman: l.Status_Pengiriman
      }))
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/v1/notifications/email/run-scheduler', requireAuth, async (req, res) => {
  try {
    const force = Boolean(req.body?.force);
    const summary = await processScheduledEmailReminders(force);
    res.json({
      status: 'success',
      message: `Scheduler pengingat selesai: ${summary.emails_triggered} email pengingat dikirim.`,
      data: summary
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post(['/api/v1/notifications/email/webhook', '/api/webhooks/email-status'], async (req, res) => {
  try {
    const { email_log_id, event, status_pengiriman } = req.body || {};
    if (!email_log_id) return res.status(400).json({ status: 'error', message: 'email_log_id wajib disertakan.' });

    const rawEvt = String(status_pengiriman || event || 'Terkirim').toUpperCase();
    const mappedStatus = ['BOUNCED', 'FAILED', 'DROPPED', 'GAGAL'].includes(rawEvt) ? 'Gagal' : 'Terkirim';

    const { rows: updated } = await pool.query(
      `UPDATE email_logs SET "Status_Pengiriman" = $1 WHERE "ID" = $2 RETURNING *`,
      [mappedStatus, parseInt(email_log_id, 10)]
    );
    if (!updated.length) return res.status(404).json({ status: 'error', message: 'Log email tidak ditemukan.' });

    res.json({
      status: 'success',
      message: `Status EmailLog #${email_log_id} diperbarui ke ${mappedStatus}.`,
      data: { id: updated[0].ID, status_pengiriman: updated[0].Status_Pengiriman }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/v1/notifications/audit-logs', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT al.*, u."Nama" AS user_name, u."Email" AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON al."User_ID" = u."ID"
       ORDER BY al."ID" DESC LIMIT 150`
    );
    const data = rows.map(item => {
      let beforeData = null;
      let afterData = null;
      let summary = item.Detail || '';
      if (item.Detail && item.Detail.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(item.Detail);
          beforeData = parsed.before || null;
          afterData = parsed.after || null;
          summary = parsed.summary || item.Detail;
        } catch (_) {}
      }
      return {
        id: item.ID,
        user_id: item.User_ID,
        user_name: item.user_name || 'System',
        user_email: item.user_email || '-',
        aksi: item.Aksi,
        modul: item.Modul,
        nama_tabel: item.Modul,
        record_id: item.Record_ID,
        detail: summary,
        before_data: beforeData,
        after_data: afterData,
        ip_address: item.IP_Address,
        created_at: item.Created_At ? new Date(item.Created_At).toISOString().replace('T', ' ').slice(0, 19) : null
      };
    });
    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/v1/notifications/dashboard-stats', requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const [usersRes, docsRes, schedRes, annRes] = await Promise.all([
      pool.query('SELECT * FROM users'),
      pool.query('SELECT d.*, u."Job_Desc" AS uploader_job FROM documents d LEFT JOIN users u ON d."Uploaded_By" = u."ID" WHERE d."Is_Deleted" = FALSE'),
      pool.query('SELECT s.*, u."Job_Desc" AS creator_job FROM schedules s LEFT JOIN users u ON s."Divisi_ID" = u."ID"'),
      pool.query('SELECT a.*, u."Job_Desc" AS author_job FROM announcements a LEFT JOIN users u ON a."Created_By" = u."ID"')
    ]);

    const ukmUsers = actorUkm ? usersRes.rows.filter(u => getUkmFromJobDesc(u.Job_Desc) === actorUkm && u.Role !== 'Ketua') : usersRes.rows;
    const ukmDocs = actorUkm ? docsRes.rows.filter(d => !d.uploader_job || getUkmFromJobDesc(d.uploader_job) === actorUkm) : docsRes.rows;
    const ukmScheds = actorUkm ? schedRes.rows.filter(s => !s.creator_job || getUkmFromJobDesc(s.creator_job) === actorUkm) : schedRes.rows;
    const ukmAnns = actorUkm ? annRes.rows.filter(a => !a.author_job || getUkmFromJobDesc(a.author_job) === actorUkm) : annRes.rows;

    res.json({
      status: 'success',
      data: {
        ukm: actorUkm || 'Seluruh UKM',
        total_anggota: ukmUsers.filter(u => u.Status_Keanggotaan === 'Aktif').length,
        menunggu_verifikasi_akun: ukmUsers.filter(u => u.Status_Keanggotaan === 'Menunggu Verifikasi').length,
        total_dokumen_vault: ukmDocs.length,
        lpj_pending: ukmDocs.filter(d => d.Kategori === 'LPJ' && d.Status === 'Draft').length,
        lpj_approved: ukmDocs.filter(d => d.Kategori === 'LPJ' && d.Status === 'Approved').length,
        sipakamase_pending: ukmDocs.filter(d => d.Kategori === 'Sipakamase' && d.Status === 'Draft').length,
        total_jadwal: ukmScheds.length,
        total_pengumuman: ukmAnns.length
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============================================================================
// Start Express Server
// ============================================================================

app.listen(PORT, '0.0.0.0', async () => {
  try {
    await sequelize.authenticate();
    console.log(`======================================================================`);
    console.log(`🚀 SIOMAS Node.js + Express.js REST API running on http://127.0.0.1:${PORT}`);
    console.log(`☁️  Connected to Neon Cloud PostgreSQL (siomas_db) via Sequelize + pg`);
    console.log(`⏰ UC-12 node-cron Email Reminder Scheduler active (every 1 hour)`);
    console.log(`======================================================================`);
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
});
