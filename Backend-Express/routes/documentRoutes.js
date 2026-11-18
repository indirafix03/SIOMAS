const express = require('express');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const router = express.Router();
const { pool } = require('../config/database');
const { UPLOAD_DIR, upload } = require('../config/upload');
const { getUkmFromJobDesc, recordAuditLog } = require('../utils/helpers');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

function removeUploadedTempFile(file) {
  if (file && file.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (_) {}
  }
}

function validateUploadedDocumentByRole(req, res, file) {
  if (!file) return true;
  const ext = path.extname(file.originalname || file.filename || '').toLowerCase();
  const role = req.user?.Role || 'Anggota';

  if (role === 'Pengurus') {
    if (ext !== '.pdf') {
      removeUploadedTempFile(file);
      res.status(400).json({
        status: 'error',
        message: `Format berkas (${ext || 'tanpa ekstensi'}) ditolak. Pengurus Divisi hanya diizinkan mengunggah dokumen berformat PDF (.pdf).`
      });
      return false;
    }
    return true;
  }

  // Ketua / Admin diperbolehkan .pdf dan .zip
  if (!['.pdf', '.zip'].includes(ext)) {
    removeUploadedTempFile(file);
    res.status(400).json({
      status: 'error',
      message: `Format berkas (${ext || 'tanpa ekstensi'}) tidak didukung. Ketua/Admin hanya dapat mengunggah berkas .pdf atau .zip.`
    });
    return false;
  }
  return true;
}

function resolveDocumentFilePath(rawPathFile) {
  if (!rawPathFile) return null;
  const normalizedRel = String(rawPathFile).replace(/^[/\\]+/, '');
  const baseName = path.basename(normalizedRel);

  const candidates = [
    path.join(UPLOAD_DIR, normalizedRel),
    path.join(UPLOAD_DIR, baseName),
    path.join(UPLOAD_DIR, 'lpj', baseName),
    path.join(UPLOAD_DIR, 'sipakamase', baseName),
    path.join(UPLOAD_DIR, 'proposal', baseName),
    path.join(UPLOAD_DIR, 'surat', baseName)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const stat = fs.statSync(candidate);
        // Abaikan stub palsu < 150 byte yang bukan PDF utuh
        if (stat.isFile() && stat.size > 150) {
          return candidate;
        }
      } catch (_) {}
    }
  }
  return null;
}

function buildValidPdfBuffer(doc) {
  const sanitizePdfText = (str) =>
    String(str || '-')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/[()\\]/g, '\\$&');

  const title = sanitizePdfText(doc.Nama_Berkas || 'Dokumen SIOMAS');
  const kategori = sanitizePdfText(doc.Kategori || 'LPJ');
  const status = sanitizePdfText(doc.Status || 'Draft');
  const catatan = sanitizePdfText(doc.Catatan_Revisi || 'Tidak ada catatan revisi');
  const tanggal = sanitizePdfText(
    doc.Created_At ? new Date(doc.Created_At).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );

  const streamContent = [
    'BT',
    '/F1 16 Tf',
    '50 760 Td',
    '(DOKUMEN RESMI SIOMAS - SISTEM ORGANISASI MAHASISWA) Tj',
    '/F1 12 Tf',
    '0 -32 Td',
    `(Judul Dokumen : ${title}) Tj`,
    '0 -20 Td',
    `(Kategori      : ${kategori}) Tj`,
    '0 -20 Td',
    `(Status Berkas : ${status}) Tj`,
    '0 -20 Td',
    `(Tanggal       : ${tanggal}) Tj`,
    '0 -20 Td',
    `(Catatan       : ${catatan}) Tj`,
    '0 -36 Td',
    '(Dokumen ini telah tercatat di dalam basis data SIOMAS Neon Cloud.) Tj',
    'ET'
  ].join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}\nendstream\nendobj\n`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

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
    if (!validateUploadedDocumentByRole(req, res, req.file)) return;
    const namaBerkas = (req.body.nama_berkas || req.file.originalname).trim();
    const kategori = req.body.kategori || 'LPJ';

    // Jika Pengurus memiliki dokumen berstatus 'Revisi' pada kategori yang sama, perbarui dokumen tersebut agar tidak menyisakan status Revisi lama
    const { rows: existingRevisi } = await pool.query(
      `SELECT * FROM documents
       WHERE "Uploaded_By" = $1 AND "Kategori" = $2 AND "Status" = 'Revisi' AND "Is_Deleted" = FALSE
       ORDER BY "ID" DESC LIMIT 1`,
      [req.user.ID, kategori]
    );

    let doc;
    if (existingRevisi.length > 0) {
      const targetRev = existingRevisi[0];
      const { rows: updatedRows } = await pool.query(
        `UPDATE documents
         SET "Nama_Berkas" = $1, "Path_File" = $2, "Status" = 'Draft', "Catatan_Revisi" = '', "Updated_By" = $3, "Updated_At" = NOW()
         WHERE "ID" = $4 RETURNING *`,
        [namaBerkas, req.file.filename, req.user.ID, targetRev.ID]
      );
      doc = updatedRows[0];
    } else {
      const { rows } = await pool.query(
        `INSERT INTO documents ("Nama_Berkas", "Kategori", "Path_File", "Status", "Is_Deleted", "Uploaded_By", "Created_At")
         VALUES ($1, $2, $3, 'Draft', FALSE, $4, NOW()) RETURNING *`,
        [namaBerkas, kategori, req.file.filename, req.user.ID]
      );
      doc = rows[0];
    }
    doc.uploader_name = req.user.Nama;

    await recordAuditLog({
      userId: req.user.ID,
      aksi: existingRevisi.length > 0 ? 'RESUBMIT_LPJ' : `INSERT_${kategori.toUpperCase()}`,
      modul: 'documents',
      recordId: doc.ID,
      before: existingRevisi.length > 0 ? formatDocRow(existingRevisi[0]) : null,
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
    if (req.file && !validateUploadedDocumentByRole(req, res, req.file)) return;
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

    // Jika LPJ disetujui (Approved), bersihkan sisa dokumen berstatus 'Revisi' lama milik pengunggah yang sama agar banner revisi hilang
    if (status === 'Approved' && oldRows[0].Uploaded_By) {
      await pool.query(
        `UPDATE documents
         SET "Is_Deleted" = TRUE, "Updated_By" = $1, "Updated_At" = NOW()
         WHERE "Uploaded_By" = $2 AND "Kategori" = 'LPJ' AND "Status" = 'Revisi' AND "ID" <> $3`,
        [req.user.ID, oldRows[0].Uploaded_By, id]
      );
    }

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
    const finalStatus = status || 'Approved';
    const { rows: updated } = await pool.query(
      `UPDATE documents
       SET "Status" = $1, "Catatan_Revisi" = $2, "Approved_By" = $3, "Updated_By" = $3, "Updated_At" = NOW()
       WHERE "ID" = $4 RETURNING *`,
      [finalStatus, catatan || '', req.user.ID, id]
    );
    const afterData = formatDocRow(updated[0]);

    if (finalStatus === 'Approved' && oldRows[0].Uploaded_By) {
      await pool.query(
        `UPDATE documents
         SET "Is_Deleted" = TRUE, "Updated_By" = $1, "Updated_At" = NOW()
         WHERE "Uploaded_By" = $2 AND "Kategori" = 'Sipakamase' AND "Status" = 'Revisi' AND "ID" <> $3`,
        [req.user.ID, oldRows[0].Uploaded_By, id]
      );
    }

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
    if (!validateUploadedDocumentByRole(req, res, req.file)) return;
    const namaBerkas = (req.body.nama_berkas || req.file.originalname).trim();
    const { rows: existingSipaRevisi } = await pool.query(
      `SELECT * FROM documents
       WHERE "Uploaded_By" = $1 AND "Kategori" = 'Sipakamase' AND "Status" = 'Revisi' AND "Is_Deleted" = FALSE
       ORDER BY "ID" DESC LIMIT 1`,
      [req.user.ID]
    );
    let sipaDoc;
    if (existingSipaRevisi.length > 0) {
      const { rows: updatedRows } = await pool.query(
        `UPDATE documents
         SET "Nama_Berkas" = $1, "Path_File" = $2, "Status" = 'Draft', "Catatan_Revisi" = '', "Updated_By" = $3, "Updated_At" = NOW()
         WHERE "ID" = $4 RETURNING *`,
        [namaBerkas, req.file.filename, req.user.ID, existingSipaRevisi[0].ID]
      );
      sipaDoc = updatedRows[0];
    } else {
      const { rows } = await pool.query(
        `INSERT INTO documents ("Nama_Berkas", "Kategori", "Path_File", "Status", "Is_Deleted", "Uploaded_By", "Created_At")
         VALUES ($1, 'Sipakamase', $2, 'Draft', FALSE, $3, NOW()) RETURNING *`,
        [namaBerkas, req.file.filename, req.user.ID]
      );
      sipaDoc = rows[0];
    }
    res.status(201).json({ status: 'success', message: 'Berkas Sipakamase berhasil diunggah.', data: formatDocRow(sipaDoc) });
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
    if (!validateUploadedDocumentByRole(req, res, req.file)) return;
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

    const manifestLines = [
      '====================================================================',
      'MANIFEST ARSIP DOKUMEN SIOMAS (SISTEM ORGANISASI MAHASISWA)',
      `Kategori Filter : ${kategori && kategori !== 'Semua' ? kategori : 'Semua Dokumen'}`,
      `Diunduh Oleh    : ${req.user.Nama} (${req.user.Role})`,
      `Total Dokumen   : ${docs.length}`,
      `Waktu Unduh     : ${new Date().toISOString()}`,
      '====================================================================',
      ''
    ];

    for (const d of docs) {
      const resolvedPath = resolveDocumentFilePath(d.Path_File);
      const ext = resolvedPath ? path.extname(resolvedPath) : '.pdf';
      const safeName = `${d.ID}_${(d.Nama_Berkas || 'Dokumen').replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`;
      manifestLines.push(`- [ID #${d.ID}] ${d.Nama_Berkas} | Kategori: ${d.Kategori} | Status: ${d.Status} | File: ${safeName}`);
      if (resolvedPath) {
        archive.file(resolvedPath, { name: safeName });
      } else {
        archive.append(buildValidPdfBuffer(d), { name: `${d.ID}_${(d.Nama_Berkas || 'Dokumen').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf` });
      }
    }

    archive.append(manifestLines.join('\n'), { name: 'MANIFEST_ARSIP_SIOMAS.txt' });

    await recordAuditLog({
      userId: req.user.ID,
      aksi: 'DOWNLOAD_ZIP_BUNDLE',
      modul: 'documents',
      recordId: null,
      before: null,
      after: { kategori: kategori || 'Semua', total_files: docs.length, zip_name: zipName },
      summary: `Mengunduh bundel ZIP arsip (${kategori || 'Semua'}): ${docs.length} berkas`,
      req
    });

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

    const resolvedPath = resolveDocumentFilePath(doc.Path_File);
    if (resolvedPath) {
      const ext = path.extname(resolvedPath) || '.pdf';
      const baseClean = (doc.Nama_Berkas || 'Dokumen').replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/\.(pdf|docx|doc|zip)$/i, '');
      const downloadName = `${baseClean}${ext}`;
      return res.download(resolvedPath, downloadName);
    }

    const baseClean = (doc.Nama_Berkas || 'Dokumen').replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/\.(pdf|docx|doc|zip)$/i, '');
    const pdfDownloadName = `${baseClean}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfDownloadName}"`);
    return res.send(buildValidPdfBuffer(doc));
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

