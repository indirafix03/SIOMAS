const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get(['/', '/api/v1/health'], async (req, res) => {
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

router.get('/apidocs', (req, res) => {
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

router.get('/api/v1/openapi.json', (req, res) => {
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

module.exports = router;

