from flask import Blueprint, request
from app.extensions import db
from app.models.email_log import EmailLog
from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.announcement import Announcement
from app.middleware.auth_middleware import get_current_user, permission_required, role_required
from app.middleware.audit_logger import log_audit
from app.utils.email_service import send_notification_with_retry, process_scheduled_email_reminders
from app.utils.response import success_response, error_response

notifications_audit_bp = Blueprint(
    'uc12_notifications_audit',
    __name__,
    url_prefix='/api/v1/notifications'
)

@notifications_audit_bp.route('/email/send', methods=['POST'])
@permission_required('buat_pengumuman')
def send_email_notification():
    """
    Kirim Notifikasi Email Manual / Terjadwal (Retry 3x)
    ---
    tags:
      - "UC-12: Notifikasi Email & Audit Log"
    summary: Mengirim email notifikasi ke satu anggota atau seluruh anggota aktif
    security:
      - BearerAuth: []
    """
    data = request.get_json() or {}
    subject = data.get('subject', '').strip()
    content = data.get('content', '').strip()
    announcement_id = data.get('announcement_id')
    user_id = data.get('user_id')
    attempt_number = int(data.get('attempt_number', 1))

    if not subject or not content:
        return error_response("Subjek dan isi email wajib diisi", 400)

    if announcement_id:
        ann = db.session.get(Announcement, announcement_id)
        if not ann:
            return error_response("Announcement ID tidak ditemukan", 404)

    logs = []
    if user_id:
        recipient = db.session.get(User, user_id)
        if not recipient:
            return error_response("User ID penerima tidak ditemukan", 404)
        res = send_notification_with_retry(
            announcement_id=announcement_id,
            user_id=recipient.ID,
            to_email=recipient.Email,
            subject=subject,
            content=content,
            attempt_number=attempt_number
        )
        logs.append(res)
    else:
        active_users = User.query.filter_by(Status_Keanggotaan='Aktif').all()
        for recipient in active_users:
            if recipient.Email:
                res = send_notification_with_retry(
                    announcement_id=announcement_id,
                    user_id=recipient.ID,
                    to_email=recipient.Email,
                    subject=subject,
                    content=content,
                    attempt_number=attempt_number
                )
                logs.append(res)

    log_audit(
        "SEND_EMAIL_NOTIFICATION",
        "Notifikasi Email",
        f"Pengiriman email '{subject}' selesai untuk {len(logs)} penerima",
        after={"subject": subject, "recipients_count": len(logs), "attempt_number": attempt_number}
    )

    return success_response(
        data=logs,
        total=len(logs),
        message="Proses pengiriman notifikasi email selesai"
    )


@notifications_audit_bp.route('/email/run-scheduler', methods=['POST'])
@permission_required('buat_pengumuman')
def run_scheduled_email_reminders():
    """
    Jalankan Cron / Scheduler Pengingat Email Bertahap (Attempt 1, 2 [24j], 3 [48j])
    ---
    tags:
      - "UC-12: Notifikasi Email & Audit Log"
    summary: Mengeksekusi pengecekan pengumuman penting yang belum dibaca (Is_Read=False) untuk mengirim pengingat ke-2 (24 jam) dan ke-3 (48 jam)
    security:
      - BearerAuth: []
    """
    data = request.get_json(silent=True) or {}
    force_next = bool(data.get('force_next_attempt', False))
    announcement_id = data.get('announcement_id')

    result = process_scheduled_email_reminders(
        force_next_attempt=force_next,
        target_announcement_id=announcement_id
    )

    log_audit(
        "RUN_EMAIL_SCHEDULER",
        "Notifikasi Email",
        f"Scheduler pengingat email dijalankan (force={force_next}, terkirim={result['emails_triggered']})",
        after={
            "force_next_attempt": force_next,
            "emails_triggered": result['emails_triggered'],
            "skipped_already_read": result['skipped_already_read'],
            "skipped_max_attempt_reached": result['skipped_max_attempt_reached']
        }
    )

    return success_response(
        data=result,
        message=f"Scheduler selesai: {result['emails_triggered']} email pengingat dikirim, {result['skipped_already_read']} dihentikan otomatis karena sudah dibaca."
    )


@notifications_audit_bp.route('/email/webhook', methods=['POST'])
def email_delivery_webhook():
    """
    Webhook Callback Status Pengiriman SMTP (Sequence 7 SRS)
    ---
    tags:
      - "UC-12: Notifikasi Email & Audit Log"
    summary: Menerima callback status pengiriman email (Terkirim / Gagal) dari SMTP Relay dan memperbarui tabel email_logs
    """
    data = request.get_json(silent=True) or {}
    log_id = data.get('email_log_id') or data.get('id')
    status = data.get('status_pengiriman') or data.get('status')

    if not log_id or status not in ('Terkirim', 'Gagal'):
        return error_response("Parameter email_log_id dan status ('Terkirim' atau 'Gagal') wajib diisi", 400)

    email_log = db.session.get(EmailLog, int(log_id))
    if not email_log:
        return error_response("Data EmailLog tidak ditemukan", 404)

    old_status = email_log.Status_Pengiriman
    email_log.Status_Pengiriman = status
    db.session.commit()

    log_audit(
        "WEBHOOK_EMAIL_STATUS",
        "Notifikasi Email",
        f"Webhook memperbarui status EmailLog ID {email_log.ID}: {old_status} -> {status}",
        before={"email_log_id": email_log.ID, "status_pengiriman": old_status},
        after={"email_log_id": email_log.ID, "status_pengiriman": status}
    )

    return success_response(
        data=email_log.to_dict(),
        message=f"Status pengiriman EmailLog #{email_log.ID} diperbarui menjadi '{status}'"
    )


@notifications_audit_bp.route('/email/logs', methods=['GET'])
@notifications_audit_bp.route('/email-logs', methods=['GET'])
@permission_required('buat_pengumuman')
def list_email_logs():
    """
    Riwayat Pengiriman Email (Email Logs)
    ---
    tags:
      - "UC-12: Notifikasi Email & Audit Log"
    summary: Melihat daftar riwayat pengiriman notifikasi email beserta status Terkirim/Gagal dan Attempt 1/2/3
    security:
      - BearerAuth: []
    """
    status = request.args.get('status')
    announcement_id = request.args.get('announcement_id', type=int)
    attempt = request.args.get('attempt', type=int)

    query = EmailLog.query
    if status:
        query = query.filter(EmailLog.Status_Pengiriman == status)
    if announcement_id:
        query = query.filter(EmailLog.Announcement_ID == announcement_id)
    if attempt:
        query = query.filter(EmailLog.Attempt_Number == attempt)

    logs = query.order_by(EmailLog.Sent_At.desc(), EmailLog.ID.desc()).limit(200).all()
    return success_response(
        data=[l.to_dict() for l in logs],
        total=len(logs),
        message="Riwayat log pengiriman email berhasil diambil"
    )


@notifications_audit_bp.route('/audit-logs', methods=['GET'])
@role_required('Ketua UKM')
def list_audit_logs():
    """
    Daftar System Audit Logs (Khusus Ketua UKM)
    ---
    tags:
      - "UC-12: Notifikasi Email & Audit Log"
    summary: Memantau rekam jejak seluruh aksi penting pengguna di dalam sistem (termasuk JSON before & after)
    security:
      - BearerAuth: []
    """
    modul = request.args.get('modul')
    aksi = request.args.get('aksi')
    user_id = request.args.get('user_id', type=int)

    query = AuditLog.query
    if modul:
        query = query.filter(AuditLog.Modul.ilike(f"%{modul}%"))
    if aksi:
        query = query.filter(AuditLog.Aksi.ilike(f"%{aksi}%"))
    if user_id:
        query = query.filter(AuditLog.User_ID == user_id)

    logs = query.order_by(AuditLog.Created_At.desc(), AuditLog.ID.desc()).limit(300).all()
    return success_response(
        data=[a.to_dict() for a in logs],
        total=len(logs),
        message="Daftar audit log berhasil diambil"
    )
