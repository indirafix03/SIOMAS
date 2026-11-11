const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { pool, JWT_SECRET } = require('../config/database');
const { hashPassword, verifyPassword, getUkmFromJobDesc, formatUserRow, recordAuditLog } = require('../utils/helpers');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

router.post(['/api/v1/auth/register', '/api/auth/register', '/api/register'], async (req, res) => {
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

router.post(['/api/v1/auth/login', '/api/auth/login', '/api/login'], async (req, res) => {
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

router.get(['/api/v1/auth/me', '/api/auth/me'], requireAuth, async (req, res) => {
  res.json({ status: 'success', data: formatUserRow(req.user) });
});

router.get(['/api/v1/auth/users', '/api/auth/users'], requireAuth, requireRole('Ketua', 'Admin', 'Pengurus'), async (req, res) => {
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

router.patch(['/api/v1/auth/users/:id/verify', '/api/auth/users/:id/verify'], requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
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

router.put(['/api/v1/auth/users/:id', '/api/auth/users/:id'], requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
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
    const newNama = req.body.nama ? String(req.body.nama).trim() : target.Nama;
    const newEmail = req.body.email ? String(req.body.email).trim().toLowerCase() : target.Email;
    const newRole = req.body.role || target.Role;
    const newStatus = req.body.status_keanggotaan || target.Status_Keanggotaan;
    const newJobDesc = req.body.job_desc !== undefined ? req.body.job_desc : target.Job_Desc;

    const { rows: updated } = await pool.query(
      `UPDATE users SET "Nama" = $1, "Email" = $2, "Role" = $3, "Status_Keanggotaan" = $4, "Job_Desc" = $5, "Updated_By" = $6 WHERE "ID" = $7 RETURNING *`,
      [newNama, newEmail, newRole, newStatus, newJobDesc, req.user.ID, targetId]
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

router.delete(['/api/v1/auth/users/:id', '/api/auth/users/:id'], requireAuth, requireRole('Ketua', 'Admin'), async (req, res) => {
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

module.exports = router;

