from flask import Blueprint, request
from app.extensions import db
from app.models.announcement import Announcement
from app.models.announcement_read import AnnouncementRead
from app.models.user import User
from app.middleware.auth_middleware import get_current_user, permission_required
from app.middleware.audit_logger import log_audit
from app.utils.response import success_response, error_response
from app.utils.email_service import send_notification_with_retry
from app.utils.datetime_helper import utc_now

announcements_manage_bp = Blueprint(
    'uc05_announcements_manage',
    __name__,
    url_prefix='/api/v1/admin/announcements'
)

@announcements_manage_bp.route('', methods=['POST'])
@permission_required('buat_pengumuman')
def create_announcement():
    """
    Buat Pengumuman Baru
    ---
    tags:
      - "UC-05: Kelola Pengumuman"
    summary: Membuat pengumuman baru untuk seluruh anggota
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - judul
            - isi
          properties:
            judul:
              type: string
              example: Rapat Pleno Bulanan Oktober 2026
            isi:
              type: string
              example: Rapat pleno akan diselenggarakan pada hari Sabtu di Ruang Aula Utama.
            is_important:
              type: boolean
              default: false
            notify_email:
              type: boolean
              default: false
              description: Jika true, kirimkan notifikasi email ke seluruh anggota aktif
    responses:
      201:
        description: Pengumuman berhasil dibuat
      400:
        description: Input data tidak valid
    """
    user = get_current_user()
    data = request.get_json() or {}
    judul = data.get('judul', '').strip()
    isi = data.get('isi', '').strip()
    is_important = bool(data.get('is_important', False))
    notify_email = bool(data.get('notify_email', False))

    if not judul or not isi:
        return error_response("Judul dan isi pengumuman wajib diisi", 400)

    announcement = Announcement(
        Judul=judul,
        Isi=isi,
        Is_Important=is_important,
        Created_By=user.ID,
        Created_At=utc_now()
    )
    db.session.add(announcement)
    db.session.commit()

    log_audit("CREATE_ANNOUNCEMENT", "Pengumuman", f"Pengumuman dibuat: '{judul}' (ID: {announcement.ID})")

    # If notify_email is enabled, trigger email notification to all active users
    email_results = []
    if notify_email:
        active_users = User.query.filter_by(Status_Keanggotaan='Aktif').all()
        for recipient in active_users:
            if recipient.Email:
                res = send_notification_with_retry(
                    announcement_id=announcement.ID,
                    user_id=recipient.ID,
                    to_email=recipient.Email,
                    subject=f"[SIOMAS] {judul}",
                    content=isi
                )
                email_results.append(res)

    return success_response(
        data={
            "announcement": announcement.to_dict(current_user_id=user.ID),
            "email_notifications_sent": len(email_results)
        },
        message="Pengumuman berhasil dipublikasikan",
        code=201
    )


@announcements_manage_bp.route('/<int:announcement_id>', methods=['PUT'])
@permission_required('buat_pengumuman')
def update_announcement(announcement_id):
    """
    Ubah Data Pengumuman
    ---
    tags:
      - "UC-05: Kelola Pengumuman"
    summary: Memperbarui judul, isi, atau status penting pengumuman
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: announcement_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            judul:
              type: string
            isi:
              type: string
            is_important:
              type: boolean
    responses:
      200:
        description: Pengumuman berhasil diperbarui
      404:
        description: Pengumuman tidak ditemukan
    """
    user = get_current_user()
    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return error_response("Pengumuman tidak ditemukan", 404)

    data = request.get_json() or {}
    if 'judul' in data and data['judul'].strip():
        announcement.Judul = data['judul'].strip()
    if 'isi' in data and data['isi'].strip():
        announcement.Isi = data['isi'].strip()
    if 'is_important' in data:
        announcement.Is_Important = bool(data['is_important'])

    announcement.Updated_By = user.ID
    db.session.commit()

    log_audit("UPDATE_ANNOUNCEMENT", "Pengumuman", f"Pengumuman diperbarui: '{announcement.Judul}' (ID: {announcement.ID})")

    return success_response(
        data=announcement.to_dict(current_user_id=user.ID),
        message="Pengumuman berhasil diperbarui"
    )


@announcements_manage_bp.route('/<int:announcement_id>', methods=['DELETE'])
@permission_required('buat_pengumuman')
def delete_announcement(announcement_id):
    """
    Hapus Pengumuman
    ---
    tags:
      - "UC-05: Kelola Pengumuman"
    summary: Menghapus pengumuman dari sistem
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: announcement_id
        type: integer
        required: true
    responses:
      200:
        description: Pengumuman berhasil dihapus
      404:
        description: Pengumuman tidak ditemukan
    """
    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return error_response("Pengumuman tidak ditemukan", 404)

    title = announcement.Judul
    db.session.delete(announcement)
    db.session.commit()

    log_audit("DELETE_ANNOUNCEMENT", "Pengumuman", f"Pengumuman dihapus: '{title}' (ID: {announcement_id})")

    return success_response(message=f"Pengumuman '{title}' berhasil dihapus")


@announcements_manage_bp.route('/<int:announcement_id>/readers', methods=['GET'])
@permission_required('buat_pengumuman')
def get_announcement_readers(announcement_id):
    """
    Daftar Pembaca Pengumuman
    ---
    tags:
      - "UC-05: Kelola Pengumuman"
    summary: Melihat daftar anggota yang sudah membaca dan belum membaca pengumuman
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: announcement_id
        type: integer
        required: true
    responses:
      200:
        description: Statistik dan daftar pembaca berhasil diambil
      404:
        description: Pengumuman tidak ditemukan
    """
    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return error_response("Pengumuman tidak ditemukan", 404)

    # Get all active users
    users = User.query.filter_by(Status_Keanggotaan='Aktif').all()
    read_map = {r.User_ID: r for r in AnnouncementRead.query.filter_by(Announcement_ID=announcement_id).all()}

    reader_list = []
    have_read = 0

    for u in users:
        read_obj = read_map.get(u.ID)
        is_read = read_obj.Is_Read if read_obj else False
        if is_read:
            have_read += 1
        reader_list.append({
            "user_id": u.ID,
            "nama": u.Nama,
            "email": u.Email,
            "role": u.Role,
            "is_read": is_read,
            "read_at": read_obj.Read_At.strftime('%Y-%m-%d %H:%M:%S') if (read_obj and read_obj.Read_At) else None
        })

    return success_response(
        data={
            "announcement_id": announcement_id,
            "judul": announcement.Judul,
            "total_users": len(users),
            "read_count": have_read,
            "unread_count": len(users) - have_read,
            "read_percentage": round((have_read / len(users) * 100), 2) if users else 0,
            "users": reader_list
        },
        message="Daftar pembaca berhasil diambil"
    )
