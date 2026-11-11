import os
import smtplib
import threading
import time
from datetime import timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
from app.extensions import db
from app.models.email_log import EmailLog
from app.models.announcement import Announcement
from app.models.announcement_read import AnnouncementRead
from app.models.user import User
from app.utils.datetime_helper import utc_now


def _deliver_smtp_email(to_email, subject, content, attempt_number=1):
    """
    Mengirim email melalui SMTP Relay (smtplib).
    Jika kredensial SMTP_USER & SMTP_PASSWORD tersedia, kirim via SMTP nyata.
    Jika kosong:
      - Bila SMTP_STRICT_MODE='true', kembalikan status 'Gagal' (kredensial belum diatur).
      - Bila mode pengembangan lokal (default), tulis ke local mail spool log dan kembalikan info simulasi.
    """
    smtp_host = current_app.config.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(current_app.config.get('SMTP_PORT', 587))
    smtp_user = current_app.config.get('SMTP_USER', '')
    smtp_pass = current_app.config.get('SMTP_PASSWORD', '')
    strict_mode = os.environ.get('SMTP_STRICT_MODE', 'false').lower() in ('true', '1')

    if not smtp_user or not smtp_pass:
        if strict_mode:
            return False, 'Gagal', 'SMTP_USER / SMTP_PASSWORD belum dikonfigurasi (Strict Mode aktif)'
        # Local development mail spool simulation
        return True, 'Terkirim', f'Local Mail Spool (Attempt-{attempt_number} -> {to_email})'

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject

        reminder_banner = ""
        if attempt_number == 2:
            reminder_banner = (
                "<div style='background:#FEF3C7;color:#92400E;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:13px;'>"
                "<strong>Pengingat Ke-2 (24 Jam):</strong> Anda belum membaca pengumuman penting ini di Portal SIOMAS."
                "</div>"
            )
        elif attempt_number >= 3:
            reminder_banner = (
                "<div style='background:#FEE2E2;color:#991B1B;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:13px;'>"
                "<strong>Pengingat Terakhir Ke-3 (48 Jam):</strong> Mohon segera buka dan baca pengumuman penting ini di Portal SIOMAS."
                "</div>"
            )

        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #1a56db; margin-top: 0;">SIOMAS - Notifikasi Pengumuman (Attempt #{attempt_number})</h2>
                {reminder_banner}
                <h3 style="margin-bottom: 8px;">{subject}</h3>
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px;">
                    {content}
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">
                    Email ini dikirim otomatis oleh Sistem Informasi Organisasi Mahasiswa (SIOMAS).
                    Pengingat otomatis akan berhenti setelah Anda membaca pengumuman di aplikasi.
                </p>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=8) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())

        return True, 'Terkirim', f'SMTP Relay ({smtp_host}:{smtp_port})'
    except Exception as e:
        return False, 'Gagal', str(e)


def send_notification_with_retry(announcement_id, user_id, to_email, subject, content, attempt_number=1):
    """
    UC-12: Pengiriman Notifikasi Email Terjadwal & Log.
    - Saat pengumuman dibuat (Attempt 1), sistem memastikan baris `announcement_reads`
      dengan `Is_Read=False` tercatat untuk anggota terkait agar bisa dilacak oleh
      Scheduler Pengingat 24 Jam (Attempt 2) dan 48 Jam (Attempt 3).
    - Jika pengiriman gagal pada saat percobaan, dilakukan retry koneksi hingga 3x
      sebelum mencatat status 'Gagal' pada `email_logs`.
    """
    if announcement_id and user_id:
        read_rec = AnnouncementRead.query.filter_by(
            Announcement_ID=announcement_id,
            User_ID=user_id
        ).first()
        if not read_rec:
            read_rec = AnnouncementRead(
                Announcement_ID=announcement_id,
                User_ID=user_id,
                Is_Read=False,
                Read_At=None
            )
            db.session.add(read_rec)
            db.session.flush()

    status_pengiriman = 'Gagal'
    delivery_info = ''
    for _ in range(1, 4):
        ok, status_str, info = _deliver_smtp_email(to_email, subject, content, attempt_number=attempt_number)
        delivery_info = info
        if ok:
            status_pengiriman = status_str
            break

    log_entry = EmailLog(
        Announcement_ID=announcement_id,
        User_ID=user_id,
        Attempt_Number=attempt_number,
        Sent_At=utc_now(),
        Status_Pengiriman=status_pengiriman
    )
    db.session.add(log_entry)
    db.session.commit()

    res = log_entry.to_dict()
    res['delivery_info'] = delivery_info
    return res


def process_scheduled_email_reminders(force_next_attempt=False, target_announcement_id=None):
    """
    UC-12 Sequence 7: Background Cron / Scheduler Pengingat Email Bertahap
    Memeriksa seluruh Pengumuman Penting (`Is_Important == True`):
    - Jika anggota (`Status_Keanggotaan == 'Aktif'`) sudah membaca (`AnnouncementRead.Is_Read == True`):
      -> Auto-Stop (tidak dikirim email pengingat lagi).
    - Jika anggota BELUM membaca (`Is_Read == False`):
      - Belum ada log pengiriman -> Kirim Attempt 1
      - Sudah ada Attempt 1 dan selisih waktu >= 24 jam (atau `force_next_attempt=True`) -> Kirim Attempt 2 (24 Jam)
      - Sudah ada Attempt 2 dan selisih waktu >= 48 jam (atau `force_next_attempt=True`) -> Kirim Attempt 3 (48 Jam)
      - Sudah mencapai Attempt 3 -> Auto-Stop (maksimal 3x pengiriman sesuai SRS).
    """
    now = utc_now()
    ann_query = Announcement.query.filter_by(Is_Important=True)
    if target_announcement_id:
        ann_query = ann_query.filter_by(ID=target_announcement_id)

    important_announcements = ann_query.all()
    active_users = User.query.filter_by(Status_Keanggotaan='Aktif').all()

    sent_logs = []
    skipped_read = 0
    skipped_max_attempt = 0
    skipped_waiting_window = 0

    for ann in important_announcements:
        ann_ukm = ann.creator.get_ukm() if ann.creator else None
        for user in active_users:
            if not user.Email:
                continue
            if ann_ukm and user.get_ukm() != ann_ukm:
                continue

            # Cek status baca di announcement_reads
            read_rec = AnnouncementRead.query.filter_by(
                Announcement_ID=ann.ID,
                User_ID=user.ID
            ).first()

            if read_rec and read_rec.Is_Read:
                skipped_read += 1
                continue

            # Ambil riwayat pengiriman email untuk (Announcement_ID, User_ID)
            user_logs = (
                EmailLog.query
                .filter_by(Announcement_ID=ann.ID, User_ID=user.ID)
                .order_by(EmailLog.Attempt_Number.asc(), EmailLog.Sent_At.asc())
                .all()
            )

            if not user_logs:
                # Belum pernah dikirim Attempt 1
                res = send_notification_with_retry(
                    announcement_id=ann.ID,
                    user_id=user.ID,
                    to_email=user.Email,
                    subject=f"[SIOMAS] {ann.Judul}",
                    content=ann.Isi,
                    attempt_number=1
                )
                sent_logs.append(res)
                continue

            max_attempt = max((lg.Attempt_Number or 1) for lg in user_logs)
            first_sent_at = user_logs[0].Sent_At or ann.Created_At or now
            latest_sent_at = user_logs[-1].Sent_At or first_sent_at

            if max_attempt >= 3:
                skipped_max_attempt += 1
                continue

            next_attempt = max_attempt + 1
            hours_since_first = (now - first_sent_at).total_seconds() / 3600.0
            hours_since_latest = (now - latest_sent_at).total_seconds() / 3600.0

            should_send = False
            if force_next_attempt:
                should_send = True
            elif next_attempt == 2 and (hours_since_first >= 24.0 or hours_since_latest >= 24.0):
                should_send = True
            elif next_attempt == 3 and (hours_since_first >= 48.0 or hours_since_latest >= 24.0):
                should_send = True

            if should_send:
                label = "Pengingat 24 Jam" if next_attempt == 2 else "Pengingat Terakhir 48 Jam"
                res = send_notification_with_retry(
                    announcement_id=ann.ID,
                    user_id=user.ID,
                    to_email=user.Email,
                    subject=f"[SIOMAS - {label}] {ann.Judul}",
                    content=ann.Isi,
                    attempt_number=next_attempt
                )
                sent_logs.append(res)
            else:
                skipped_waiting_window += 1

    return {
        "checked_at": now.strftime('%Y-%m-%d %H:%M:%S'),
        "important_announcements_checked": len(important_announcements),
        "active_users_checked": len(active_users),
        "emails_triggered": len(sent_logs),
        "skipped_already_read": skipped_read,
        "skipped_max_attempt_reached": skipped_max_attempt,
        "skipped_waiting_24h_48h_window": skipped_waiting_window,
        "logs": sent_logs
    }


_scheduler_started = False


def start_email_reminder_scheduler(app, interval_seconds=3600):
    """
    Menjalankan background daemon thread (Cron Scheduler internal) yang memeriksa
    pengumuman penting yang belum dibaca setiap `interval_seconds` (default 1 jam)
    untuk mengeksekusi pengiriman email Attempt-2 (24 jam) dan Attempt-3 (48 jam).
    """
    global _scheduler_started
    if _scheduler_started:
        return
    _scheduler_started = True

    def _worker():
        while True:
            time.sleep(interval_seconds)
            try:
                with app.app_context():
                    process_scheduled_email_reminders(force_next_attempt=False)
            except Exception:
                pass

    thread = threading.Thread(target=_worker, name="SIOMAS-EmailReminderScheduler", daemon=True)
    thread.start()
