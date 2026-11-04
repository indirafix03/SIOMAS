from flask import Blueprint, request
from app.extensions import db
from app.models.announcement import Announcement
from app.models.announcement_read import AnnouncementRead
from app.models.user import User
from app.middleware.auth_middleware import get_current_user, permission_required
from app.utils.response import success_response, error_response
from app.utils.datetime_helper import utc_now

announcements_read_bp = Blueprint('uc03_announcements_read', __name__, url_prefix='/api/v1/announcements')

@announcements_read_bp.route('', methods=['GET'])
@permission_required('baca_pengumuman')
def list_announcements():
    """
    Daftar Pengumuman & Status Unread
    ---
    tags:
      - "UC-03: Baca Pengumuman & Status Unread"
    summary: Mengambil daftar pengumuman dengan indikator belum dibaca (unread)
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: is_important
        type: boolean
        description: Filter pengumuman penting saja
      - in: query
        name: unread_only
        type: boolean
        description: Filter hanya pengumuman yang belum dibaca
      - in: query
        name: search
        type: string
        description: Cari judul atau isi pengumuman
    responses:
      200:
        description: Daftar pengumuman berhasil diambil
    """
    user = get_current_user()
    is_important = request.args.get('is_important')
    unread_only = request.args.get('unread_only', '').lower() in ('true', '1')
    search = request.args.get('search')

    query = Announcement.query

    if is_important is not None:
        val = is_important.lower() in ('true', '1')
        query = query.filter(Announcement.Is_Important == val)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Announcement.Judul.ilike(search_filter)) | 
            (Announcement.Isi.ilike(search_filter))
        )

    announcements = query.order_by(
        Announcement.Is_Important.desc(),
        Announcement.Created_At.desc()
    ).all()

    result = []
    for a in announcements:
        item = a.to_dict(current_user_id=user.ID)
        if unread_only and item['is_read']:
            continue
        result.append(item)

    return success_response(
        data=result,
        total=len(result),
        message="Daftar pengumuman berhasil diambil"
    )


@announcements_read_bp.route('/unread-count', methods=['GET'])
@permission_required('baca_pengumuman')
def get_unread_count():
    """
    Jumlah Pengumuman Belum Dibaca
    ---
    tags:
      - "UC-03: Baca Pengumuman & Status Unread"
    summary: Menghitung jumlah pengumuman yang belum dibaca oleh user saat ini
    security:
      - BearerAuth: []
    responses:
      200:
        description: Jumlah unread berhasil dihitung
    """
    user = get_current_user()
    total_announcements = Announcement.query.count()

    read_count = (
        AnnouncementRead.query
        .filter_by(User_ID=user.ID, Is_Read=True)
        .count()
    )

    unread_count = max(0, total_announcements - read_count)

    return success_response(
        data={
            "total_announcements": total_announcements,
            "read_count": read_count,
            "unread_count": unread_count
        },
        message="Jumlah unread berhasil diambil"
    )


@announcements_read_bp.route('/<int:announcement_id>', methods=['GET'])
@permission_required('baca_pengumuman')
def get_announcement_detail(announcement_id):
    """
    Detail Pengumuman & Auto Mark as Read
    ---
    tags:
      - "UC-03: Baca Pengumuman & Status Unread"
    summary: Membaca pengumuman dan otomatis menandainya sebagai sudah dibaca
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: announcement_id
        type: integer
        required: true
    responses:
      200:
        description: Detail pengumuman berhasil diambil
      404:
        description: Pengumuman tidak ditemukan
    """
    user = get_current_user()
    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return error_response("Pengumuman tidak ditemukan", 404)

    # Auto mark as read in announcement_reads
    read_record = AnnouncementRead.query.filter_by(
        Announcement_ID=announcement_id,
        User_ID=user.ID
    ).first()

    if not read_record:
        read_record = AnnouncementRead(
            Announcement_ID=announcement_id,
            User_ID=user.ID,
            Is_Read=True,
            Read_At=utc_now()
        )
        db.session.add(read_record)
        db.session.commit()
    elif not read_record.Is_Read:
        read_record.Is_Read = True
        read_record.Read_At = utc_now()
        db.session.commit()

    return success_response(
        data=announcement.to_dict(current_user_id=user.ID),
        message="Detail pengumuman berhasil diambil"
    )


@announcements_read_bp.route('/<int:announcement_id>/mark-read', methods=['POST'])
@permission_required('baca_pengumuman')
def mark_announcement_read(announcement_id):
    """
    Tandai Pengumuman Dibaca / Belum Dibaca
    ---
    tags:
      - "UC-03: Baca Pengumuman & Status Unread"
    summary: Mengubah status baca secara manual
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
            is_read:
              type: boolean
              default: true
    responses:
      200:
        description: Status baca berhasil diperbarui
      404:
        description: Pengumuman tidak ditemukan
    """
    user = get_current_user()
    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return error_response("Pengumuman tidak ditemukan", 404)

    data = request.get_json() or {}
    is_read = data.get('is_read', True)

    read_record = AnnouncementRead.query.filter_by(
        Announcement_ID=announcement_id,
        User_ID=user.ID
    ).first()

    if not read_record:
        read_record = AnnouncementRead(
            Announcement_ID=announcement_id,
            User_ID=user.ID,
            Is_Read=is_read,
            Read_At=utc_now() if is_read else None
        )
        db.session.add(read_record)
    else:
        read_record.Is_Read = is_read
        read_record.Read_At = utc_now() if is_read else None

    db.session.commit()

    return success_response(
        data=read_record.to_dict(),
        message=f"Pengumuman berhasil ditandai sebagai {'sudah dibaca' if is_read else 'belum dibaca'}"
    )
