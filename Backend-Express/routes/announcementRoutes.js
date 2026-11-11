const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { getUkmFromJobDesc, recordAuditLog } = require('../utils/helpers');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const { triggerAnnouncementEmails } = require('../services/emailService');

router.get(['/api/v1/announcements/feed', '/api/v1/announcements/manage', '/api/announcements'], requireAuth, async (req, res) => {
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

router.patch(['/api/v1/announcements/feed/:id/read', '/api/announcements/:id/read'], requireAuth, markAnnouncementRead);
router.put(['/api/v1/announcements/feed/:id/read', '/api/announcements/:id/read'], requireAuth, markAnnouncementRead);

router.post(['/api/v1/announcements/manage', '/api/announcements'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
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

router.delete(['/api/v1/announcements/manage/:id', '/api/announcements/:id'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM announcements WHERE "ID" = $1', [id]);
    res.json({ status: 'success', message: 'Pengumuman berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;

