const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { getUkmFromJobDesc } = require('../utils/helpers');
const { requireAuth } = require('../middlewares/authMiddleware');
const { processScheduledEmailReminders } = require('../services/emailService');

router.get('/api/v1/attendance/summary', requireAuth, async (req, res) => {
  res.json({
    status: 'success',
    data: { total_pertemuan: 12, rata_rata_kehadiran: 92, hadir: 22, izin: 2 }
  });
});

router.get('/api/v1/notifications/email/logs', requireAuth, async (req, res) => {
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

router.post('/api/v1/notifications/email/run-scheduler', requireAuth, async (req, res) => {
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

router.post(['/api/v1/notifications/email/webhook', '/api/webhooks/email-status'], async (req, res) => {
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

router.get('/api/v1/notifications/audit-logs', requireAuth, async (req, res) => {
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

router.get('/api/v1/notifications/dashboard-stats', requireAuth, async (req, res) => {
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

module.exports = router;

