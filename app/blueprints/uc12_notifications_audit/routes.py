from datetime import datetime
from flask import Blueprint, request
from app.extensions import db
from app.models.announcement import Announcement
from app.models.user import User
from app.models.email_log import EmailLog
from app.models.audit_log import AuditLog
from app.middleware.auth_middleware import get_current_user, permission_required, role_required
from app.middleware.audit_logger import log_audit
from app.utils.email_service import send_notification_with_retry
from app.utils.response import success_response, error_response

notifications_audit_bp = Blueprint('uc12_notifications_audit', __name__, url_prefix='/api/v1/notifications')

@notifications_audit_bp.route('/email/send', methods=['POST'])
@permission_required('kirim_email')
def trigger_email_notification():
    """
    Kirim Notifikasi Email SMTP (Manual Trigger)
    ---
    tags:
      - "UC-12: Notifikasi Email SMTP & Audit Log"
    summary: Memicu pengiriman email pengumuman ke anggota dengan mekanisme retry hingga 3 kali
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - announcement_id
          properties:
            announcement_id:
              type: integer
              example: 1
            target_scope:
              type: string
              enum: [all, role, specific_users]
              default: all
            target_role:
              type: string
              enum: [Admin, Pengurus, Anggota]
            user_ids:
              type: array
              items:
                type: integer
    responses:
      200:
        description: Proses pengiriman email selesai
      404:
        description: Pengumuman tidak ditemukan
    """
    user = get_current_user()
    data = request.get_json() or {}

    announcement_id = data.get('announcement_id')
    if not announcement_id:
        return error_response("ID pengumuman ('announcement_id') wajib diisi", 400)

    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return error_response("Pengumuman tidak ditemukan", 404)

    target_scope = data.get('target_scope', 'all')
    target_role = data.get('target_role')
    user_ids = data.get('user_ids', [])

    query = User.query.filter_by(Status_Keanggotaan='Aktif')
    if target_scope == 'role' and target_role:
        query = query.filter_by(Role=target_role)
    elif target_scope == 'specific_users' and user_ids:
        query = query.filter(User.ID.in_(user_ids))

    recipients = query.all()
    if not recipients:
        return error_response("Tidak ditemukan penerima email aktif berdasarkan kriteria", 400)

    results = []
    success_count = 0
    fail_count = 0

    for recipient in recipients:
        if recipient.Email:
            send_res = send_notification_with_retry(
                announcement_id=announcement.ID,
                user_id=recipient.ID,
                to_email=recipient.Email,
                subject=f"[SIOMAS] {announcement.Judul}",
                content=announcement.Isi
            )
            results.append(send_res)
            if send_res['status'] == 'Terkirim':
                success_count += 1
            else:
                fail_count += 1

    log_audit(
        "SEND_EMAIL_NOTIFICATION",
        "Notifikasi Email",
        f"Mengirim notifikasi pengumuman ID {announcement_id} ke {len(recipients)} anggota (Sukses: {success_count}, Gagal: {fail_count})"
    )

    return success_response(
        data={
            "announcement_id": announcement_id,
            "total_recipients": len(recipients),
            "success_count": success_count,
            "failed_count": fail_count,
            "details": results
        },
        message=f"Pengiriman email selesai. {success_count} terkirim, {fail_count} gagal."
    )


@notifications_audit_bp.route('/email-logs', methods=['GET'])
@permission_required('kirim_email')
def list_email_logs():
    """
    Riwayat Log Notifikasi Email
    ---
    tags:
      - "UC-12: Notifikasi Email SMTP & Audit Log"
    summary: Mengambil catatan pengiriman email, status, dan jumlah percobaan pengiriman
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: announcement_id
        type: integer
      - in: query
        name: user_id
        type: integer
      - in: query
        name: status
        type: string
        enum: [Terkirim, Gagal]
    responses:
      200:
        description: Log pengiriman email berhasil diambil
    """
    announcement_id = request.args.get('announcement_id')
    user_id = request.args.get('user_id')
    status_filter = request.args.get('status')

    query = EmailLog.query

    if announcement_id:
        query = query.filter(EmailLog.Announcement_ID == announcement_id)
    if user_id:
        query = query.filter(EmailLog.User_ID == user_id)
    if status_filter in ('Terkirim', 'Gagal'):
        query = query.filter(EmailLog.Status_Pengiriman == status_filter)

    logs = query.order_by(EmailLog.Sent_At.desc()).all()

    return success_response(
        data=[l.to_dict() for l in logs],
        total=len(logs),
        message="Log pengiriman email berhasil diambil"
    )


@notifications_audit_bp.route('/audit-logs', methods=['GET'])
@role_required('Admin')
def list_audit_logs():
    """
    Daftar Audit Log Sistem
    ---
    tags:
      - "UC-12: Notifikasi Email SMTP & Audit Log"
    summary: Mengambil rekam jejak aktivitas, IP address, user agent, dan modul sistem (Admin Only)
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: modul
        type: string
        description: Filter berdasarkan modul
      - in: query
        name: aksi
        type: string
        description: Filter berdasarkan jenis aksi
      - in: query
        name: user_id
        type: integer
        description: Filter berdasarkan pengguna
      - in: query
        name: start_date
        type: string
        description: Filter tanggal mulai (YYYY-MM-DD)
      - in: query
        name: end_date
        type: string
        description: Filter tanggal selesai (YYYY-MM-DD)
    responses:
      200:
        description: Audit log berhasil diambil
    """
    modul = request.args.get('modul')
    aksi = request.args.get('aksi')
    user_id = request.args.get('user_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = AuditLog.query

    if modul:
        query = query.filter(AuditLog.Modul.ilike(f"%{modul}%"))
    if aksi:
        query = query.filter(AuditLog.Aksi.ilike(f"%{aksi}%"))
    if user_id:
        query = query.filter(AuditLog.User_ID == user_id)
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(AuditLog.Created_At >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.strptime(f"{end_date} 23:59:59", '%Y-%m-%d %H:%M:%S')
            query = query.filter(AuditLog.Created_At <= end_dt)
        except ValueError:
            pass

    logs = query.order_by(AuditLog.Created_At.desc()).all()

    return success_response(
        data=[l.to_dict() for l in logs],
        total=len(logs),
        message="Daftar audit log berhasil diambil"
    )
