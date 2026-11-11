const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { upload } = require('../config/upload');
const { getUkmFromJobDesc, recordAuditLog } = require('../utils/helpers');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const postInterestsMemory = new Map(); // postId -> Set(userId)

function formatInterUkmPost(p, currentUserId) {
  const set = postInterestsMemory.get(p.ID) || new Set();
  const baseLikes = ((p.ID * 7) % 19) + 5;
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

router.get(['/api/v1/interukm/feed', '/api/interukm-posts'], requireAuth, async (req, res) => {
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

router.get('/api/v1/interukm/my-posts', requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT p.*, u."Nama" AS creator_name, u."Job_Desc" AS creator_job
       FROM interukm_posts p
       LEFT JOIN users u ON p."Created_By" = u."ID"
       ORDER BY p."ID" DESC`
    );
    const filtered = rows.filter(
      r =>
        r.Created_By === req.user.ID ||
        (actorUkm && r.creator_job && getUkmFromJobDesc(r.creator_job) === actorUkm)
    );
    res.json({ status: 'success', data: filtered.map(r => formatInterUkmPost(r, req.user.ID)) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get(['/api/v1/interukm/pending', '/api/v1/interukm/posts/pending'], requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT p.*, u."Nama" AS creator_name, u."Job_Desc" AS creator_job
       FROM interukm_posts p
       LEFT JOIN users u ON p."Created_By" = u."ID"
       WHERE p."Status_Persetujuan" IN ('Menunggu Verifikasi', 'Pending')
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

router.get('/api/v1/interukm/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ status: 'error', message: 'ID tidak valid.' });
    const { rows } = await pool.query(
      `SELECT p.*, u."Nama" AS creator_name
       FROM interukm_posts p
       LEFT JOIN users u ON p."Created_By" = u."ID"
       WHERE p."ID" = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Publikasi tidak ditemukan.' });
    res.json({ status: 'success', data: formatInterUkmPost(rows[0], req.user.ID) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post(
  ['/api/v1/interukm/posts', '/api/interukm-posts'],
  requireAuth,
  upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'proposal', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { ukm_pengirim, judul, isi_pengumuman } = req.body || {};
      if (!judul || !isi_pengumuman) {
        return res.status(400).json({ status: 'error', message: 'Judul dan isi pengumuman wajib diisi.' });
      }

      const extraParts = [];
      if (req.files?.foto?.[0]) {
        extraParts.push(`FotoURL: /api/v1/interukm/files/${req.files.foto[0].filename}`);
      }
      if (req.files?.proposal?.[0]) {
        extraParts.push(`FileURL: /api/v1/interukm/files/${req.files.proposal[0].filename}`);
      }
      const fullContent = [isi_pengumuman.trim(), ...extraParts].join(' • ');
      const actorUkm = getUkmFromJobDesc(req.user.Job_Desc) || ukm_pengirim || 'SIOMAS';
      const senderLabel = ukm_pengirim && ukm_pengirim.includes('(') ? ukm_pengirim : `${actorUkm}`;

      // BR-02: If created by Ketua/Admin, auto-approved; if Pengurus, Pending
      const isKetua = req.user.Role === 'Ketua' || req.user.Role === 'Admin';
      const statusPersetujuan = isKetua ? 'Disetujui' : 'Pending';

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

async function handleApproveInterUkm(req, res) {
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
}

router.post('/api/v1/interukm/posts/:id/approve', requireAuth, requireRole('Ketua', 'Admin'), handleApproveInterUkm);
router.patch('/api/v1/interukm/posts/:id/approve', requireAuth, requireRole('Ketua', 'Admin'), handleApproveInterUkm);

async function handleRejectInterUkm(req, res) {
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
}

router.post('/api/v1/interukm/posts/:id/reject', requireAuth, requireRole('Ketua', 'Admin'), handleRejectInterUkm);
router.patch('/api/v1/interukm/posts/:id/reject', requireAuth, requireRole('Ketua', 'Admin'), handleRejectInterUkm);

router.post('/api/v1/interukm/posts/:id/interest', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!postInterestsMemory.has(id)) postInterestsMemory.set(id, new Set());
  const set = postInterestsMemory.get(id);
  if (set.has(req.user.ID)) set.delete(req.user.ID);
  else set.add(req.user.ID);

  const baseLikes = ((id * 7) % 19) + 5;
  res.json({
    status: 'success',
    data: {
      post_id: id,
      is_interested: set.has(req.user.ID),
      interest_count: baseLikes + set.size
    }
  });
});

module.exports = router;

