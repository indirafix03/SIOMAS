const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { hashPassword, getUkmFromJobDesc, getDivisiFromJobDesc, formatUserRow, recordAuditLog } = require('../utils/helpers');
const { requireAuth } = require('../middlewares/authMiddleware');

router.get(['/api/v1/profile', '/api/v1/profile/me', '/api/profile', '/api/profile/me'], requireAuth, async (req, res) => {
  res.json({ status: 'success', data: formatUserRow(req.user) });
});

router.put(['/api/v1/profile', '/api/v1/profile/me', '/api/profile', '/api/profile/me'], requireAuth, async (req, res) => {
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

router.get(['/api/v1/profile/jobdesks', '/api/profile/jobdesks'], requireAuth, async (req, res) => {
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

module.exports = router;

