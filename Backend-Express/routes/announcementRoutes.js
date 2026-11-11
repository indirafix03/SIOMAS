const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { getUkmFromJobDesc, recordAuditLog, formatDateOnlyId, formatTimeOnlyWita } = require('../utils/helpers');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const { triggerAnnouncementEmails } = require('../services/emailService');

function mapAnnouncementRow(a) {
  return {
    id: a.ID,
    judul: a.Judul,
    isi: a.Isi,
    is_important: Boolean(a.Is_Important),
    kategori: a.Kategori || (a.Is_Important ? 'Manajemen' : 'Umum'),
    tanggal: formatDateOnlyId(a.Tanggal_Kegiatan, a.Created_At),
    waktu: formatTimeOnlyWita(a.Waktu_Kegiatan, a.Created_At),
    lokasi: a.Lokasi || 'Kampus SIOMAS',
    created_by: a.Created_By,
    author_name: a.author_name || 'Admin UKM',
    created_at: a.Created_At ? new Date(a.Created_At).toISOString().replace('T', ' ').slice(0, 19) : null,
    is_read: Boolean(a.user_is_read),
    read_at: a.user_read_at ? new Date(a.user_read_at).toISOString().replace('T', ' ').slice(0, 19) : null,
    read_count: parseInt(a.read_count || 0, 10)
  };
}

// GET All Announcements
router.get(
  ['/api/v1/announcements', '/api/v1/announcements/feed', '/api/v1/announcements/manage', '/api/announcements'],
  requireAuth,
  async (req, res) => {
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

      const data = filtered.map(mapAnnouncementRow);
      const unreadCount = data.filter(d => !d.is_read).length;
      res.json({ status: 'success', unread_count: unreadCount, data });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

// GET Unread Count
router.get(['/api/v1/announcements/unread-count', '/api/announcements/unread-count'], requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT a."ID", u."Job_Desc" AS author_job, ar."Is_Read" AS user_is_read
       FROM announcements a
       LEFT JOIN users u ON a."Created_By" = u."ID"
       LEFT JOIN announcement_reads ar ON ar."Announcement_ID" = a."ID" AND ar."User_ID" = $1`,
      [req.user.ID]
    );
    const filtered = actorUkm
      ? rows.filter(r => !r.author_job || getUkmFromJobDesc(r.author_job) === actorUkm)
      : rows;
    const unreadCount = filtered.filter(r => !r.user_is_read).length;
    res.json({ status: 'success', data: { unread_count: unreadCount }, unread_count: unreadCount });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET Single Announcement by ID
router.get(['/api/v1/announcements/:id', '/api/announcements/:id'], requireAuth, async (req, res) => {
  try {
    const annId = parseInt(req.params.id, 10);
    if (isNaN(annId)) return res.status(400).json({ status: 'error', message: 'ID tidak valid.' });
    const { rows } = await pool.query(
      `SELECT a.*, u."Nama" AS author_name, ar."Is_Read" AS user_is_read, ar."Read_At" AS user_read_at,
              (SELECT COUNT(*) FROM announcement_reads r WHERE r."Announcement_ID" = a."ID" AND r."Is_Read" = TRUE) AS read_count
       FROM announcements a
       LEFT JOIN users u ON a."Created_By" = u."ID"
       LEFT JOIN announcement_reads ar ON ar."Announcement_ID" = a."ID" AND ar."User_ID" = $1
       WHERE a."ID" = $2`,
      [req.user.ID, annId]
    );
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Pengumuman tidak ditemukan.' });
    res.json({
      status: 'success',
      data: mapAnnouncementRow(rows[0])
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Mark Announcement Read (POST/PUT/PATCH)
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

router.post(
  ['/api/v1/announcements/:id/mark-read', '/api/v1/announcements/feed/:id/read', '/api/announcements/:id/read'],
  requireAuth,
  markAnnouncementRead
);
router.patch(
  ['/api/v1/announcements/:id/mark-read', '/api/v1/announcements/feed/:id/read', '/api/announcements/:id/read'],
  requireAuth,
  markAnnouncementRead
);
router.put(
  ['/api/v1/announcements/:id/mark-read', '/api/v1/announcements/feed/:id/read', '/api/announcements/:id/read'],
  requireAuth,
  markAnnouncementRead
);

// Create / Publish Announcement (Supports both /api/v1/admin/announcements and /api/v1/announcements/manage)
router.post(
  ['/api/v1/admin/announcements', '/api/v1/announcements/manage', '/api/v1/announcements', '/api/announcements'],
  requireAuth,
  requireRole('Ketua', 'Admin', 'Pengurus'),
  async (req, res) => {
    try {
      const { judul, isi, is_important, notify_email, kategori, tanggal_kegiatan, waktu_kegiatan, lokasi } = req.body || {};
      if (!judul || !isi) {
        return res.status(400).json({ status: 'error', message: 'Judul dan isi pengumuman wajib diisi.' });
      }
      const importantFlag = Boolean(is_important || notify_email || kategori === 'Penting');
      const kategoriVal = kategori || (importantFlag ? 'Manajemen' : 'Umum');
      const tanggalVal = tanggal_kegiatan ? formatDateOnlyId(tanggal_kegiatan, new Date()) : formatDateOnlyId(null, new Date());
      const waktuVal = waktu_kegiatan ? formatTimeOnlyWita(waktu_kegiatan, new Date()) : formatTimeOnlyWita(null, new Date());
      const lokasiVal = lokasi || 'Kampus SIOMAS';

      const { rows } = await pool.query(
        `INSERT INTO announcements ("Judul", "Isi", "Is_Important", "Kategori", "Tanggal_Kegiatan", "Waktu_Kegiatan", "Lokasi", "Created_By", "Created_At", "Updated_By")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $8) RETURNING *`,
        [judul.trim(), isi.trim(), importantFlag, kategoriVal, tanggalVal, waktuVal, lokasiVal, req.user.ID]
      );
      const ann = rows[0];
      ann.author_name = req.user.Nama;

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
        after: { id: ann.ID, judul: ann.Judul, is_important: importantFlag, tanggal: tanggalVal, waktu: waktuVal },
        summary: `Membuat pengumuman: ${ann.Judul} (Penting: ${importantFlag})`,
        req
      });

      res.status(201).json({
        status: 'success',
        message: importantFlag
          ? 'Pengumuman penting berhasil dipublikasikan dan notifikasi email pertama (Attempt-1) telah dikirim.'
          : 'Pengumuman berhasil dipublikasikan.',
        email_dispatch: emailResult,
        data: mapAnnouncementRow(ann)
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

// Update Announcement
router.put(
  ['/api/v1/admin/announcements/:id', '/api/v1/announcements/manage/:id', '/api/announcements/:id'],
  requireAuth,
  requireRole('Ketua', 'Admin', 'Pengurus'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { judul, isi, is_important } = req.body || {};
      const { rows: oldRows } = await pool.query('SELECT * FROM announcements WHERE "ID" = $1', [id]);
      if (!oldRows.length) return res.status(404).json({ status: 'error', message: 'Pengumuman tidak ditemukan.' });
      const old = oldRows[0];

      const { rows: updated } = await pool.query(
        `UPDATE announcements SET "Judul" = $1, "Isi" = $2, "Is_Important" = $3, "Updated_By" = $4 WHERE "ID" = $5 RETURNING *`,
        [
          judul ? judul.trim() : old.Judul,
          isi ? isi.trim() : old.Isi,
          is_important !== undefined ? Boolean(is_important) : old.Is_Important,
          req.user.ID,
          id
        ]
      );
      res.json({ status: 'success', message: 'Pengumuman berhasil diperbarui.', data: mapAnnouncementRow(updated[0]) });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

// Delete Announcement
router.delete(
  ['/api/v1/admin/announcements/:id', '/api/v1/announcements/manage/:id', '/api/v1/announcements/:id', '/api/announcements/:id'],
  requireAuth,
  requireRole('Ketua', 'Admin', 'Pengurus'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await pool.query('DELETE FROM announcements WHERE "ID" = $1', [id]);
      res.json({ status: 'success', message: 'Pengumuman berhasil dihapus.' });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  }
);

module.exports = router;
