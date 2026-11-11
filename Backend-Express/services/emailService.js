const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { pool } = require('../config/database');
const { getUkmFromJobDesc, formatDateOnlyId, formatTimeOnlyWita } = require('../utils/helpers');

const SMTP_USER = process.env.SMTP_USER || 'indiraramayani10@gmail.com';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || 'khliriyzqsoqtmmc';

const smtpTransporter =
  SMTP_USER && SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: false,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD
        }
      })
    : null;

async function sendSmtpEmail(toEmail, subject, textBody) {
  if (!toEmail || !toEmail.includes('@')) return false;
  const cleanEmail = String(toEmail).trim().toLowerCase();

  // Skip real SMTP dispatch for dummy demo domains (@siomas.com / @siomas.ac.id)
  // so the sender inbox is not flooded with bounce-back messages from Google
  if (
    cleanEmail.endsWith('@siomas.com') ||
    cleanEmail.endsWith('@siomas.ac.id') ||
    cleanEmail.endsWith('@example.com')
  ) {
    return true;
  }

  if (!smtpTransporter) {
    return true;
  }

  const htmlBody = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      <div style="background: #2563EB; color: #FFFFFF; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 18px;">SIOMAS — Sistem Informasi Operasional UKM</h2>
        <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">Notifikasi Otomatis Pengumuman Penting (UC-12)</p>
      </div>
      <div style="padding: 24px; background: #FFFFFF; color: #0F172A; line-height: 1.6; font-size: 14px;">
        ${String(textBody).replace(/\n/g, '<br/>')}
      </div>
      <div style="padding: 14px 24px; background: #F8FAFC; color: #64748B; font-size: 12px; border-top: 1px solid #E2E8F0;">
        Silakan login ke portal SIOMAS dan tandai pengumuman sebagai <b>Sudah Dibaca</b> untuk menghentikan pengingat email otomatis (24 jam / 48 jam).
      </div>
    </div>
  `;

  for (let retry = 1; retry <= 3; retry++) {
    try {
      await smtpTransporter.sendMail({
        from: process.env.SMTP_DEFAULT_SENDER || `"SIOMAS Notification" <${SMTP_USER}>`,
        to: cleanEmail,
        subject,
        text: textBody,
        html: htmlBody
      });
      console.log(`📧 [SMTP Terkirim] -> ${cleanEmail} | ${subject}`);
      return true;
    } catch (err) {
      console.error(`⚠️ [SMTP Retry ${retry}/3 Gagal] -> ${cleanEmail}:`, err.message);
      if (retry === 3) return false;
    }
  }
  return false;
}

async function triggerAnnouncementEmails(announcement, creatorUser) {
  const creatorUkm = getUkmFromJobDesc(creatorUser?.Job_Desc);
  const { rows: activeUsers } = await pool.query(`SELECT * FROM users WHERE "Status_Keanggotaan" = 'Aktif'`);
  const recipients = creatorUkm
    ? activeUsers.filter(u => getUkmFromJobDesc(u.Job_Desc) === creatorUkm)
    : activeUsers;

  const tanggalStr = formatDateOnlyId(announcement.Tanggal_Kegiatan, announcement.Created_At);
  const waktuStr = formatTimeOnlyWita(announcement.Waktu_Kegiatan, announcement.Created_At);
  const lokasiStr = announcement.Lokasi || 'Kampus SIOMAS';
  const kategoriStr = announcement.Kategori || (announcement.Is_Important ? 'Penting / Manajemen' : 'Umum');
  const pengirimStr = `${creatorUser?.Nama || 'Pengurus UKM'}${creatorUkm ? ` (${creatorUkm})` : ''}`;

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const { rows: existingRead } = await pool.query(
      `SELECT * FROM announcement_reads WHERE "Announcement_ID" = $1 AND "User_ID" = $2`,
      [announcement.ID, recipient.ID]
    );
    if (!existingRead.length) {
      await pool.query(
        `INSERT INTO announcement_reads ("Announcement_ID", "User_ID", "Is_Read", "Read_At")
         VALUES ($1, $2, FALSE, NULL)`,
        [announcement.ID, recipient.ID]
      );
    }

    const emailText =
      `Halo ${recipient.Nama},\n\n` +
      `Terdapat pengumuman penting baru dari ${pengirimStr}:\n\n` +
      `• Judul Pengumuman : ${announcement.Judul}\n` +
      `• Kategori         : ${kategoriStr}\n` +
      `• Tanggal Kegiatan : ${tanggalStr}\n` +
      `• Waktu Kegiatan   : ${waktuStr}\n` +
      `• Lokasi           : ${lokasiStr}\n\n` +
      `Deskripsi / Isi Pengumuman:\n${announcement.Isi}`;

    const ok = await sendSmtpEmail(
      recipient.Email,
      `[SIOMAS - PENGUMUMAN PENTING] ${announcement.Judul}`,
      emailText
    );
    const statusStr = ok ? 'Terkirim' : 'Gagal';
    if (ok) sent++;
    else failed++;

    await pool.query(
      `INSERT INTO email_logs ("Announcement_ID", "User_ID", "Attempt_Number", "Sent_At", "Status_Pengiriman")
       VALUES ($1, $2, 1, NOW(), $3)`,
      [announcement.ID, recipient.ID, statusStr]
    );
  }
  return { total_recipients: recipients.length, sent, failed };
}

async function triggerScheduleEmails(scheduleRow, creatorUser) {
  const creatorUkm = getUkmFromJobDesc(creatorUser?.Job_Desc);
  const { rows: activeUsers } = await pool.query(`SELECT * FROM users WHERE "Status_Keanggotaan" = 'Aktif'`);
  const recipients = creatorUkm
    ? activeUsers.filter(u => getUkmFromJobDesc(u.Job_Desc) === creatorUkm)
    : activeUsers;

  const tanggalStr = formatDateOnlyId(null, scheduleRow.Waktu);
  const waktuStr = formatTimeOnlyWita(null, scheduleRow.Waktu);
  const lokasiStr = scheduleRow.Lokasi || 'Kampus SIOMAS';
  const kategoriStr = scheduleRow.Kategori || 'Agenda Kegiatan';

  const judulAnn = `[Agenda ${creatorUkm || 'UKM'}] ${scheduleRow.Judul_Kegiatan}`;
  const isiAnn =
    `Agenda Kegiatan Baru telah dijadwalkan:\n` +
    `• Kegiatan: ${scheduleRow.Judul_Kegiatan}\n` +
    `• Kategori: ${kategoriStr}\n` +
    `• Tanggal: ${tanggalStr}\n` +
    `• Waktu: ${waktuStr}\n` +
    `• Lokasi: ${lokasiStr}\n` +
    `• Keterangan: ${scheduleRow.Keterangan || '-'}`;

  // Insert companion announcement with separated Tanggal & Waktu metadata
  const { rows: annRows } = await pool.query(
    `INSERT INTO announcements ("Judul", "Isi", "Is_Important", "Kategori", "Tanggal_Kegiatan", "Waktu_Kegiatan", "Lokasi", "Created_By", "Created_At", "Updated_By")
     VALUES ($1, $2, TRUE, $3, $4, $5, $6, $7, NOW(), $7) RETURNING *`,
    [judulAnn, scheduleRow.Keterangan || `Pelaksanaan agenda kegiatan ${scheduleRow.Judul_Kegiatan}.`, kategoriStr, tanggalStr, waktuStr, lokasiStr, creatorUser.ID]
  );
  const ann = annRows[0];

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    await pool.query(
      `INSERT INTO announcement_reads ("Announcement_ID", "User_ID", "Is_Read", "Read_At")
       VALUES ($1, $2, FALSE, NULL)`,
      [ann.ID, recipient.ID]
    );

    const ok = await sendSmtpEmail(
      recipient.Email,
      `[SIOMAS - AGENDA KEGIATAN] ${scheduleRow.Judul_Kegiatan}`,
      `Halo ${recipient.Nama} (${creatorUkm || 'Anggota UKM'}),\n\n${isiAnn}\n\nHarap hadir tepat waktu.`
    );
    const statusStr = ok ? 'Terkirim' : 'Gagal';
    if (ok) sent++;
    else failed++;

    await pool.query(
      `INSERT INTO email_logs ("Announcement_ID", "User_ID", "Attempt_Number", "Sent_At", "Status_Pengiriman")
       VALUES ($1, $2, 1, NOW(), $3)`,
      [ann.ID, recipient.ID, statusStr]
    );
  }

  return { announcement_id: ann.ID, total_recipients: recipients.length, sent, failed };
}

async function processScheduledEmailReminders(forceNow = false) {
  const { rows: importantAnns } = await pool.query(
    `SELECT * FROM announcements WHERE "Is_Important" = TRUE ORDER BY "ID" DESC`
  );
  const { rows: activeUsers } = await pool.query(
    `SELECT * FROM users WHERE "Status_Keanggotaan" = 'Aktif'`
  );
  const usersById = new Map(activeUsers.map(u => [u.ID, u]));

  let triggeredCount = 0;
  let skippedReadCount = 0;
  let skippedMaxAttemptCount = 0;
  const details = [];

  for (const ann of importantAnns) {
    const creator = usersById.get(ann.Created_By);
    const creatorUkm = creator ? getUkmFromJobDesc(creator.Job_Desc) : '';
    const targetUsers = creatorUkm
      ? activeUsers.filter(u => getUkmFromJobDesc(u.Job_Desc) === creatorUkm)
      : activeUsers;

    for (const user of targetUsers) {
      const { rows: readRows } = await pool.query(
        `SELECT * FROM announcement_reads WHERE "Announcement_ID" = $1 AND "User_ID" = $2`,
        [ann.ID, user.ID]
      );
      if (readRows.length && readRows[0].Is_Read) {
        skippedReadCount++;
        continue;
      }

      const { rows: userLogs } = await pool.query(
        `SELECT * FROM email_logs WHERE "Announcement_ID" = $1 AND "User_ID" = $2 ORDER BY "Attempt_Number" ASC, "ID" ASC`,
        [ann.ID, user.ID]
      );

      if (!userLogs.length) {
        const ok = await sendSmtpEmail(user.Email, `[SIOMAS] ${ann.Judul}`, ann.Isi);
        await pool.query(
          `INSERT INTO email_logs ("Announcement_ID", "User_ID", "Attempt_Number", "Sent_At", "Status_Pengiriman")
           VALUES ($1, $2, 1, NOW(), $3)`,
          [ann.ID, user.ID, ok ? 'Terkirim' : 'Gagal']
        );
        triggeredCount++;
        details.push({
          announcement_id: ann.ID,
          user_email: user.Email,
          attempt_number: 1,
          status: ok ? 'Terkirim' : 'Gagal'
        });
        continue;
      }

      const lastLog = userLogs[userLogs.length - 1];
      const maxAttempt = Math.max(...userLogs.map(l => l.Attempt_Number || 1));

      if (lastLog.Status_Pengiriman === 'Gagal') continue;
      if (maxAttempt >= 3) {
        skippedMaxAttemptCount++;
        continue;
      }

      const firstSentAt = new Date(userLogs[0].Sent_At || ann.Created_At || Date.now());
      const elapsedHours = (Date.now() - firstSentAt.getTime()) / (1000 * 3600);

      let nextAttempt = null;
      if (maxAttempt === 1 && (elapsedHours >= 24 || forceNow)) {
        nextAttempt = 2;
      } else if (maxAttempt === 2 && (elapsedHours >= 48 || forceNow)) {
        nextAttempt = 3;
      }

      if (nextAttempt) {
        const tanggalStr = formatDateOnlyId(ann.Tanggal_Kegiatan, ann.Created_At);
        const waktuStr = formatTimeOnlyWita(ann.Waktu_Kegiatan, ann.Created_At);
        const lokasiStr = ann.Lokasi || 'Kampus SIOMAS';
        const reminderBody =
          `Halo ${user.Nama},\n\n` +
          `Ini adalah pengingat otomatis ke-${nextAttempt} bahwa Anda belum membaca pengumuman penting berikut:\n\n` +
          `• Judul Pengumuman : ${ann.Judul}\n` +
          `• Tanggal Kegiatan : ${tanggalStr}\n` +
          `• Waktu Kegiatan   : ${waktuStr}\n` +
          `• Lokasi           : ${lokasiStr}\n\n` +
          `Deskripsi:\n${ann.Isi}`;

        const ok = await sendSmtpEmail(
          user.Email,
          `[PENGINGAT KE-${nextAttempt} SIOMAS] Belum Dibaca: ${ann.Judul}`,
          reminderBody
        );
        const statusStr = ok ? 'Terkirim' : 'Gagal';
        await pool.query(
          `INSERT INTO email_logs ("Announcement_ID", "User_ID", "Attempt_Number", "Sent_At", "Status_Pengiriman")
           VALUES ($1, $2, $3, NOW(), $4)`,
          [ann.ID, user.ID, nextAttempt, statusStr]
        );
        triggeredCount++;
        details.push({
          announcement_id: ann.ID,
          user_email: user.Email,
          attempt_number: nextAttempt,
          status: statusStr
        });
      }
    }
  }

  return {
    checked_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    emails_triggered: triggeredCount,
    skipped_already_read: skippedReadCount,
    skipped_max_attempt_reached: skippedMaxAttemptCount,
    details
  };
}

function startEmailReminderCron() {
  // Schedule UC-12 Cron Job every hour (node-cron as specified in SRS Gambar 6.1)
  cron.schedule('0 * * * *', async () => {
    try {
      await processScheduledEmailReminders(false);
    } catch (err) {
      console.error('[node-cron UC-12 Error]:', err.message);
    }
  });
}

module.exports = {
  sendSmtpEmail,
  triggerAnnouncementEmails,
  triggerScheduleEmails,
  processScheduledEmailReminders,
  startEmailReminderCron
};

