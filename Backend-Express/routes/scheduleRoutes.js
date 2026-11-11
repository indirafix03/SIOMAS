const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { getUkmFromJobDesc, recordAuditLog } = require('../utils/helpers');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const { triggerScheduleEmails } = require('../services/emailService');

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

router.get(['/api/v1/schedules', '/api/schedules'], requireAuth, async (req, res) => {
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

router.get(['/api/v1/schedules/:id', '/api/schedules/:id'], requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ status: 'error', message: 'ID tidak valid.' });
    const { rows } = await pool.query(
      `SELECT s.*, u."Nama" AS creator_name
       FROM schedules s
       LEFT JOIN users u ON s."Divisi_ID" = u."ID"
       WHERE s."ID" = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Jadwal tidak ditemukan.' });
    res.json({ status: 'success', data: formatScheduleRow(rows[0], rows[0].creator_name) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post(['/api/v1/schedules', '/api/schedules'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
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

    const emailDispatch = await triggerScheduleEmails(rows[0], req.user);

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'INSERT_SCHEDULE',
      modul: 'schedules',
      recordId: rows[0].ID,
      before: null,
      after: formatted,
      summary: `Menambahkan jadwal kegiatan: ${formatted.judul_kegiatan} (Email dikirim ke ${emailDispatch.sent} anggota)`,
      req
    });

    res.status(201).json({
      status: 'success',
      message: 'Jadwal kegiatan berhasil ditambahkan dan notifikasi email telah dikirim ke anggota UKM.',
      email_dispatch: emailDispatch,
      data: formatted
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.put(['/api/v1/schedules/:id', '/api/schedules/:id'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
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

router.delete(['/api/v1/schedules/:id', '/api/schedules/:id'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
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

module.exports = router;

