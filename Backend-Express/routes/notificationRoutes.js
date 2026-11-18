const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { getUkmFromJobDesc } = require('../utils/helpers');
const { requireAuth } = require('../middlewares/authMiddleware');
const { processScheduledEmailReminders } = require('../services/emailService');

// Penyimpanan tugas delegasi divisi (sinkron lintas role di memori server + audit log)
const divisionDelegations = [
  { id: 101, title: 'Rundown acara final', assignee: 'Dewi Lestari', deadline: '18 Nov', priority: 'Tinggi', ukm: null, created_at: new Date().toISOString() },
  { id: 102, title: 'Koordinasi vendor', assignee: 'Made Arya', deadline: '19 Nov', priority: 'Normal', ukm: null, created_at: new Date().toISOString() }
];

router.post('/api/v1/notifications/delegation', requireAuth, async (req, res) => {
  try {
    const { judulTugas, deskripsiTugas, delegasikanKepada, prioritas, tenggat } = req.body || {};
    if (!judulTugas || !delegasikanKepada) {
      return res.status(400).json({ status: 'error', message: 'Judul tugas dan penerima delegasi wajib diisi.' });
    }
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);
    const item = {
      id: Date.now(),
      title: String(judulTugas).trim(),
      description: String(deskripsiTugas || '').trim(),
      assignee: String(delegasikanKepada).trim(),
      priority: prioritas || 'Normal',
      deadline: tenggat || 'Segera',
      ukm: actorUkm || null,
      created_by: req.user.Nama || 'Koordinator Divisi',
      created_at: new Date().toISOString()
    };
    divisionDelegations.unshift(item);
    res.status(201).json({ status: 'success', message: 'Notifikasi delegasi tugas berhasil dikirim.', data: item });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/api/v1/notifications/in-app', requireAuth, async (req, res) => {
  try {
    const role = req.user.Role || 'Anggota';
    const actorUkm = getUkmFromJobDesc(req.user.Job_Desc);

    const [usersRes, docsRes, schedRes, annRes, interRes] = await Promise.all([
      pool.query('SELECT * FROM users ORDER BY "ID" DESC LIMIT 30'),
      pool.query(
        `SELECT d.*, u."Nama" AS uploader_name, u."Job_Desc" AS uploader_job, a."Nama" AS approver_name
         FROM documents d
         LEFT JOIN users u ON d."Uploaded_By" = u."ID"
         LEFT JOIN users a ON d."Approved_By" = a."ID"
         WHERE d."Is_Deleted" = FALSE
         ORDER BY COALESCE(d."Updated_At", d."Created_At") DESC NULLS LAST, d."ID" DESC LIMIT 40`
      ),
      pool.query(
        `SELECT s.*, u."Nama" AS creator_name, u."Job_Desc" AS creator_job
         FROM schedules s
         LEFT JOIN users u ON s."Divisi_ID" = u."ID"
         ORDER BY s."ID" DESC LIMIT 20`
      ),
      pool.query(
        `SELECT a.*, u."Nama" AS author_name, u."Job_Desc" AS author_job
         FROM announcements a
         LEFT JOIN users u ON a."Created_By" = u."ID"
         ORDER BY a."ID" DESC LIMIT 20`
      ),
      pool.query(
        `SELECT p.*, u."Nama" AS creator_name, u."Job_Desc" AS creator_job
         FROM interukm_posts p
         LEFT JOIN users u ON p."Created_By" = u."ID"
         ORDER BY p."ID" DESC LIMIT 30`
      )
    ]);

    const ukmUsers = actorUkm
      ? usersRes.rows.filter(u => !u.Job_Desc || getUkmFromJobDesc(u.Job_Desc) === actorUkm)
      : usersRes.rows;
    const ukmDocs = actorUkm
      ? docsRes.rows.filter(d => !d.uploader_job || getUkmFromJobDesc(d.uploader_job) === actorUkm)
      : docsRes.rows;
    const ukmScheds = actorUkm
      ? schedRes.rows.filter(s => !s.creator_job || getUkmFromJobDesc(s.creator_job) === actorUkm)
      : schedRes.rows;
    const ukmAnns = actorUkm
      ? annRes.rows.filter(a => !a.author_job || getUkmFromJobDesc(a.author_job) === actorUkm)
      : annRes.rows;
    const ukmInter = actorUkm
      ? interRes.rows.filter(p => !p.creator_job || getUkmFromJobDesc(p.creator_job) === actorUkm)
      : interRes.rows;

    const notifications = [];

    if (role === 'Ketua' || role === 'Admin') {
      // 1. Akun pengurus/anggota menunggu persetujuan
      ukmUsers
        .filter(u => u.Status_Keanggotaan === 'Menunggu Verifikasi')
        .slice(0, 5)
        .forEach(u => {
          notifications.push({
            id: `user-pending-${u.ID}`,
            type: 'akses',
            badge: 'Manajemen Akses',
            badgeColor: '#D97706',
            badgeBg: '#FEF3C7',
            title: `Menunggu Persetujuan Akun: ${u.Nama}`,
            message: `${u.Role || 'Pengurus/Anggota'} (${u.Job_Desc || 'UKM'}) mendaftar dan menunggu aktivasi akses.`,
            time: 'Menunggu Verifikasi',
            targetView: 'k-manajemen-akses'
          });
        });

      // 2. LPJ menunggu validasi Ketua
      ukmDocs
        .filter(d => d.Kategori === 'LPJ' && d.Status === 'Draft')
        .slice(0, 5)
        .forEach(d => {
          notifications.push({
            id: `lpj-pending-${d.ID}`,
            type: 'lpj',
            badge: 'Validasi LPJ',
            badgeColor: '#4F46E5',
            badgeBg: '#EEF2FF',
            title: `Pengajuan LPJ Baru: ${d.Nama_Berkas}`,
            message: `Diunggah oleh ${d.uploader_name || 'Pengurus Divisi'} — menunggu validasi Ketua.`,
            time: d.Created_At ? new Date(d.Created_At).toLocaleDateString('id-ID') : 'Baru saja',
            targetView: 'k-validasi-lpj'
          });
        });

      // 3. Sipakamase menunggu verifikasi
      ukmDocs
        .filter(d => d.Kategori === 'Sipakamase' && d.Status === 'Draft')
        .slice(0, 4)
        .forEach(d => {
          notifications.push({
            id: `sipa-pending-${d.ID}`,
            type: 'sipakamase',
            badge: 'Sipakamase',
            badgeColor: '#059669',
            badgeBg: '#ECFDF5',
            title: `Berkas Sipakamase: ${d.Nama_Berkas}`,
            message: `Diunggah oleh ${d.uploader_name || 'Pengurus'} — perlu verifikasi Ketua.`,
            time: d.Created_At ? new Date(d.Created_At).toLocaleDateString('id-ID') : 'Baru saja',
            targetView: 'k-verifikasi-sipakamase'
          });
        });

      // 4. Kolaborasi Inter-UKM menunggu persetujuan
      ukmInter
        .filter(p => ['Pending', 'Menunggu Verifikasi'].includes(p.Status_Persetujuan))
        .slice(0, 5)
        .forEach(p => {
          notifications.push({
            id: `inter-pending-${p.ID}`,
            type: 'interukm',
            badge: 'Hub Inter-UKM',
            badgeColor: '#D97706',
            badgeBg: '#FEF3C7',
            title: `Persetujuan Kolaborasi: ${p.Judul}`,
            message: `Diajukan oleh ${p.creator_name || 'Pengurus Divisi'} (${p.UKM_Pengirim}).`,
            time: p.Date ? new Date(p.Date).toLocaleDateString('id-ID') : 'Baru saja',
            targetView: 'k-hub-inter-ukm'
          });
        });
    }

    if (role === 'Pengurus') {
      // 1. LPJ disetujui / diminta revisi oleh Ketua
      ukmDocs
        .filter(d => d.Kategori === 'LPJ' && ['Revisi', 'Approved'].includes(d.Status))
        .slice(0, 6)
        .forEach(d => {
          const isRevisi = d.Status === 'Revisi';
          notifications.push({
            id: `lpj-status-${d.ID}-${d.Status}`,
            type: isRevisi ? 'lpj-revisi' : 'lpj-approved',
            badge: isRevisi ? 'LPJ Perlu Revisi' : 'LPJ Disetujui',
            badgeColor: isRevisi ? '#DC2626' : '#16A34A',
            badgeBg: isRevisi ? '#FEE2E2' : '#DCFCE7',
            title: isRevisi ? `Revisi LPJ: ${d.Nama_Berkas}` : `LPJ Disetujui: ${d.Nama_Berkas}`,
            message: isRevisi
              ? `Catatan Ketua: ${d.Catatan_Revisi || 'Mohon perbaiki sesuai pedoman.'}`
              : `Disetujui oleh ${d.approver_name || 'Ketua UKM'} dan masuk ke Repository Vault.`,
            time: d.Updated_At ? new Date(d.Updated_At).toLocaleDateString('id-ID') : 'Terbaru',
            targetView: 'pd-unggah-lpj'
          });
        });

      // 2. Persetujuan / Penolakan Kolaborasi Inter-UKM
      ukmInter
        .filter(p => ['Disetujui', 'Approved', 'Ditolak', 'Pending'].includes(p.Status_Persetujuan))
        .slice(0, 5)
        .forEach(p => {
          const st = p.Status_Persetujuan;
          const isRejected = st === 'Ditolak';
          const isPending = st === 'Pending';
          notifications.push({
            id: `inter-status-${p.ID}-${st}`,
            type: 'interukm',
            badge: isRejected ? 'Kolaborasi Ditolak' : isPending ? 'Menunggu Ketua' : 'Kolaborasi Disetujui',
            badgeColor: isRejected ? '#DC2626' : isPending ? '#D97706' : '#4F46E5',
            badgeBg: isRejected ? '#FEE2E2' : isPending ? '#FEF3C7' : '#EEF2FF',
            title: `Hub Inter-UKM: ${p.Judul}`,
            message: isRejected
              ? 'Pengajuan kolaborasi ditolak oleh Ketua/Admin dan tidak dipublikasikan.'
              : isPending
              ? 'Pengajuan kolaborasi sedang menunggu persetujuan Ketua UKM.'
              : 'Pengajuan kolaborasi telah disetujui Ketua dan tayang di Hub Inter-UKM.',
            time: p.Date ? new Date(p.Date).toLocaleDateString('id-ID') : 'Terbaru',
            targetView: 'pd-hub-inter'
          });
        });

      // 3. Delegasi Tugas Divisi
      divisionDelegations
        .filter(t => !t.ukm || !actorUkm || t.ukm === actorUkm)
        .slice(0, 4)
        .forEach(t => {
          notifications.push({
            id: `delegasi-pd-${t.id}`,
            type: 'delegasi',
            badge: 'Delegasi Tugas',
            badgeColor: '#0284C7',
            badgeBg: '#E0F2FE',
            title: `Tugas Divisi: ${t.title}`,
            message: `Didelegasikan kepada ${t.assignee} • Tenggat: ${t.deadline}`,
            time: 'Aktif',
            targetView: 'pd-delegasi'
          });
        });
    }

    if (role === 'Anggota') {
      // 1. Delegasi Tugas untuk Anggota
      divisionDelegations
        .filter(t => !t.ukm || !actorUkm || t.ukm === actorUkm)
        .slice(0, 4)
        .forEach(t => {
          notifications.push({
            id: `delegasi-ag-${t.id}`,
            type: 'delegasi',
            badge: 'Delegasi Tugas',
            badgeColor: '#0284C7',
            badgeBg: '#E0F2FE',
            title: `Delegasi Tugas Baru: ${t.title}`,
            message: `Penerima: ${t.assignee} • Tenggat: ${t.deadline}`,
            time: 'Tugas Divisi',
            targetView: 'agenda'
          });
        });

      // 2. Kolaborasi Inter-UKM yang disetujui
      interRes.rows
        .filter(p => ['Disetujui', 'Approved'].includes(p.Status_Persetujuan))
        .slice(0, 3)
        .forEach(p => {
          notifications.push({
            id: `inter-ag-${p.ID}`,
            type: 'interukm',
            badge: 'Kolaborasi Inter-UKM',
            badgeColor: '#7C3AED',
            badgeBg: '#F3E8FF',
            title: `Kolaborasi Kampus: ${p.Judul}`,
            message: `Dipublikasikan oleh ${p.UKM_Pengirim}.`,
            time: p.Date ? new Date(p.Date).toLocaleDateString('id-ID') : 'Terbaru',
            targetView: 'hub-inter'
          });
        });
    }

    // Untuk SEMUA Role: Pengumuman Baru & Agenda Baru
    const annView = role === 'Ketua' || role === 'Admin' ? 'k-beranda' : role === 'Pengurus' ? 'pd-dashboard' : 'dashboard';
    const schedView = role === 'Ketua' || role === 'Admin' ? 'k-kalender-agenda' : role === 'Pengurus' ? 'pd-agenda' : 'agenda';

    ukmAnns.slice(0, 4).forEach(a => {
      notifications.push({
        id: `ann-${a.ID}`,
        type: 'pengumuman',
        badge: a.Is_Important ? 'Pengumuman Penting' : 'Pengumuman Baru',
        badgeColor: a.Is_Important ? '#DC2626' : '#4F46E5',
        badgeBg: a.Is_Important ? '#FEE2E2' : '#EEF2FF',
        title: a.Judul,
        message: (a.Isi || '').slice(0, 90) + ((a.Isi || '').length > 90 ? '...' : ''),
        time: a.Created_At ? new Date(a.Created_At).toLocaleDateString('id-ID') : 'Terbaru',
        targetView: annView
      });
    });

    ukmScheds.slice(0, 4).forEach(s => {
      notifications.push({
        id: `sched-${s.ID}`,
        type: 'agenda',
        badge: 'Agenda Baru',
        badgeColor: '#059669',
        badgeBg: '#ECFDF5',
        title: s.Judul_Kegiatan,
        message: `Lokasi: ${s.Lokasi || 'Kampus'} • Kategori: ${s.Kategori || 'Agenda UKM'}`,
        time: s.Waktu ? new Date(s.Waktu).toLocaleDateString('id-ID') : 'Terjadwal',
        targetView: schedView
      });
    });

    res.json({
      status: 'success',
      data: notifications
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

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
    const force = Boolean(req.body?.force || req.body?.force_next_attempt);
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

