const express = require('express');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const router = express.Router();
const { pool } = require('../config/database');
const { UPLOAD_DIR, upload } = require('../config/upload');
const { getUkmFromJobDesc, recordAuditLog } = require('../utils/helpers');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

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
router.post(['/api/v1/lpj/upload', '/api/documents/upload'], requireAuth, requireRole('Pengurus', 'Ketua', 'Admin'), upload.single('file'), async (req, res) => {
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
router.put(['/api/v1/lpj/:id'], requireAuth, requireRole('Pengurus', 'Ketua', 'Admin'), upload.single('file'), async (req, res) => {
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
router.get('/api/v1/lpj/my-submissions', requireAuth, async (req, res) => {
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
router.get(['/api/v1/lpj-validation/pending', '/api/documents/pending'], requireAuth, async (req, res) => {
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

async function handleValidateLpj(req, res) {
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
}

router.post(['/api/v1/lpj-validation/:id/validate', '/api/documents/:id/status'], requireAuth, requireRole('Ketua', 'Admin'), handleValidateLpj);
router.patch(['/api/v1/lpj-validation/:id/validate', '/api/documents/:id/status'], requireAuth, requireRole('Ketua', 'Admin'), handleValidateLpj);
router.put(['/api/v1/lpj-validation/:id/validate', '/api/documents/:id/status'], requireAuth, requireRole('Ketua', 'Admin'), handleValidateLpj);

router.get('/api/v1/lpj-validation/history', requireAuth, async (req, res) => {
  try {
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const { rows } = await pool.query(
      `SELECT d.*, u."Nama" AS uploader_name, u."Job_Desc" AS uploader_job, a."Nama" AS approver_name
       FROM documents d
       LEFT JOIN users u ON d."Uploaded_By" = u."ID"
       LEFT JOIN users a ON d."Approved_By" = a."ID"
       WHERE d."Kategori" = 'LPJ' AND d."Status" IN ('Approved', 'Revisi') AND d."Is_Deleted" = FALSE
       ORDER BY d."Updated_At" DESC NULLS LAST, d."ID" DESC`
    );
    const filtered = actorUkm
      ? rows.filter(r => !r.uploader_job || getUkmFromJobDesc(r.uploader_job) === actorUkm)
      : rows;
    res.json({ status: 'success', data: filtered.map(formatDocRow) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// UC-08: Sipakamase Verification
router.get('/api/v1/sipakamase', requireAuth, async (req, res) => {
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

async function handleVerifySipakamase(req, res) {
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
}

router.post('/api/v1/sipakamase/:id/verify', requireAuth, requireRole('Ketua', 'Admin'), handleVerifySipakamase);
router.patch('/api/v1/sipakamase/:id/verify', requireAuth, requireRole('Ketua', 'Admin'), handleVerifySipakamase);
router.put('/api/v1/sipakamase/:id/verify', requireAuth, requireRole('Ketua', 'Admin'), handleVerifySipakamase);

router.post('/api/v1/sipakamase/upload', requireAuth, requireRole('Pengurus', 'Ketua', 'Admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'Berkas Sipakamase wajib diunggah.' });
    const namaBerkas = (req.body.nama_berkas || req.file.originalname).trim();
    const { rows } = await pool.query(
      `INSERT INTO documents ("Nama_Berkas", "Kategori", "Path_File", "Status", "Is_Deleted", "Uploaded_By", "Created_At")
       VALUES ($1, 'Sipakamase', $2, 'Draft', FALSE, $3, NOW()) RETURNING *`,
      [namaBerkas, req.file.filename, req.user.ID]
    );
    res.status(201).json({ status: 'success', message: 'Berkas Sipakamase berhasil diunggah.', data: formatDocRow(rows[0]) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// UC-10: Repository Vault List, Upload, Category Update, Soft-Delete, Download & ZIP Bundle
router.get(['/api/v1/documents', '/api/documents'], requireAuth, async (req, res) => {
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
    // SRS: Anggota hanya dapat melihat dokumen yang sudah divalidasi (Approved)
    if (req.user.Role === 'Anggota') {
      filtered = filtered.filter(r => r.Status === 'Approved');
    }
    if (req.query.kategori && req.query.kategori !== 'Semua') {
      filtered = filtered.filter(r => r.Kategori === req.query.kategori);
    }
    res.json({ status: 'success', data: filtered.map(formatDocRow) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// SRS: Anggota hanya melihat & mengunduh; unggah dokumen dilakukan Pengurus Divisi / Admin
router.post(['/api/v1/documents/upload'], requireAuth, requireRole('Pengurus', 'Ketua', 'Admin'), upload.single('file'), async (req, res) => {
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
router.get(['/api/v1/documents/bundle', '/api/documents/bundle'], requireAuth, async (req, res) => {
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
    if (req.user.Role === 'Anggota') {
      docs = docs.filter(d => d.Status === 'Approved');
    }
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
router.get(['/api/v1/documents/:id/download', '/api/documents/:id/download'], requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await pool.query('SELECT * FROM documents WHERE "ID" = $1 AND "Is_Deleted" = FALSE', [id]);
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan.' });

    const doc = rows[0];
    if (req.user.Role === 'Anggota' && doc.Status !== 'Approved') {
      return res.status(403).json({ status: 'error', message: 'Anggota hanya dapat mengunduh dokumen yang sudah divalidasi.' });
    }
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

async function updateDocCategory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { kategori, nama_berkas } = req.body || {};
    const { rows: oldRows } = await pool.query('SELECT * FROM documents WHERE "ID" = $1', [id]);
    if (!oldRows.length) return res.status(404).json({ status: 'error', message: 'Dokumen tidak ditemukan.' });

    const old = oldRows[0];
    // SRS UC-10: pelabelan arsip oleh Admin/Pengurus Inti.
    // Pengurus Divisi hanya boleh merapikan label/nama draf miliknya sendiri yang belum Approved.
    const isAdmin = req.user.Role === 'Ketua' || req.user.Role === 'Admin';
    const isOwnDraftByPengurus =
      req.user.Role === 'Pengurus' && old.Uploaded_By === req.user.ID && old.Status !== 'Approved';
    if (!isAdmin && !isOwnDraftByPengurus) {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Pelabelan arsip hanya dapat dilakukan Ketua/Admin (atau Pengurus untuk draf miliknya).'
      });
    }
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

router.patch(['/api/v1/documents/:id/category', '/api/v1/documents/:id'], requireAuth, updateDocCategory);
router.put(['/api/v1/documents/:id/kategori', '/api/v1/documents/:id', '/api/documents/:id/kategori'], requireAuth, updateDocCategory);

// UC-10: Soft-Delete Document
router.delete(['/api/v1/documents/:id', '/api/documents/:id'], requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
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

module.exports = router;

