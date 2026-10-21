from datetime import datetime
from flask import Blueprint, request
from app.extensions import db
from app.models.schedule import Schedule
from app.models.user import User
from app.middleware.auth_middleware import get_current_user, permission_required
from app.middleware.audit_logger import log_audit
from app.utils.response import success_response, error_response

schedules_bp = Blueprint('uc04_schedules', __name__, url_prefix='/api/v1/schedules')

@schedules_bp.route('', methods=['GET'])
@permission_required('lihat_jadwal')
def list_schedules():
    """
    Daftar Jadwal Kegiatan / Kalender Organisasi
    ---
    tags:
      - "UC-04: Jadwal Kegiatan"
    summary: Mengambil kalender kegiatan dengan filter kategori dan rentang waktu
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: kategori
        type: string
        description: Kategori kegiatan (e.g. Rapat, Workshop, Bakti Sosial)
      - in: query
        name: start_date
        type: string
        description: Tanggal mulai (YYYY-MM-DD)
      - in: query
        name: end_date
        type: string
        description: Tanggal selesai (YYYY-MM-DD)
      - in: query
        name: search
        type: string
        description: Cari nama kegiatan atau lokasi
    responses:
      200:
        description: Daftar jadwal berhasil diambil
    """
    kategori = request.args.get('kategori')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    search = request.args.get('search')

    query = Schedule.query

    if kategori:
        query = query.filter(Schedule.Kategori == kategori)
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Schedule.Waktu >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.strptime(f"{end_date} 23:59:59", '%Y-%m-%d %H:%M:%S')
            query = query.filter(Schedule.Waktu <= end_dt)
        except ValueError:
            pass
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Schedule.Judul_Kegiatan.ilike(search_filter)) | 
            (Schedule.Lokasi.ilike(search_filter)) |
            (Schedule.Keterangan.ilike(search_filter))
        )

    schedules = query.order_by(Schedule.Waktu.asc()).all()

    return success_response(
        data=[s.to_dict() for s in schedules],
        total=len(schedules),
        message="Daftar jadwal kegiatan berhasil diambil"
    )


@schedules_bp.route('/<int:schedule_id>', methods=['GET'])
@permission_required('lihat_jadwal')
def get_schedule_detail(schedule_id):
    """
    Detail Jadwal Kegiatan
    ---
    tags:
      - "UC-04: Jadwal Kegiatan"
    summary: Mengambil detail informasi kegiatan berdasarkan ID
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: schedule_id
        type: integer
        required: true
    responses:
      200:
        description: Data jadwal ditemukan
      404:
        description: Jadwal tidak ditemukan
    """
    schedule = db.session.get(Schedule, schedule_id)
    if not schedule:
        return error_response("Jadwal kegiatan tidak ditemukan", 404)

    return success_response(
        data=schedule.to_dict(),
        message="Detail jadwal kegiatan berhasil diambil"
    )


@schedules_bp.route('', methods=['POST'])
@permission_required('buat_jadwal')
def create_schedule():
    """
    Tambah Jadwal Kegiatan Baru
    ---
    tags:
      - "UC-04: Jadwal Kegiatan"
    summary: Menambahkan jadwal kegiatan baru ke kalender organisasi
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - judul_kegiatan
            - waktu
          properties:
            judul_kegiatan:
              type: string
              example: Pelatihan Desain Grafis & Multimedia
            kategori:
              type: string
              example: Workshop
            waktu:
              type: string
              example: "2026-11-05 09:00:00"
            lokasi:
              type: string
              example: Gedung Pertemuan Lantai 2
            keterangan:
              type: string
              example: Wajib membawa laptop masing-masing
            divisi_id:
              type: integer
              description: ID User/PIC penanggung jawab divisi
    responses:
      201:
        description: Jadwal berhasil ditambahkan
      400:
        description: Input data tidak valid
    """
    user = get_current_user()
    data = request.get_json() or {}

    judul = data.get('judul_kegiatan', '').strip()
    kategori = data.get('kategori', '').strip()
    waktu_str = data.get('waktu', '').strip()
    lokasi = data.get('lokasi', '').strip()
    keterangan = data.get('keterangan', '').strip()
    divisi_id = data.get('divisi_id')

    if not judul or not waktu_str:
        return error_response("Judul kegiatan dan waktu wajib diisi", 400)

    # Parse date/time
    waktu_obj = None
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
        try:
            waktu_obj = datetime.strptime(waktu_str, fmt)
            break
        except ValueError:
            continue

    if not waktu_obj:
        return error_response("Format waktu tidak valid. Gunakan format 'YYYY-MM-DD HH:MM:SS'", 400)

    if divisi_id:
        pic = db.session.get(User, divisi_id)
        if not pic:
            return error_response(f"PIC user ID {divisi_id} tidak ditemukan", 400)

    schedule = Schedule(
        Judul_Kegiatan=judul,
        Kategori=kategori if kategori else None,
        Waktu=waktu_obj,
        Lokasi=lokasi if lokasi else None,
        Keterangan=keterangan if keterangan else None,
        Divisi_ID=divisi_id if divisi_id else None,
        Updated_By=user.ID
    )
    db.session.add(schedule)
    db.session.commit()

    log_audit("CREATE_SCHEDULE", "Jadwal", f"Jadwal ditambahkan: '{judul}' pada {waktu_str} (ID: {schedule.ID})")

    return success_response(
        data=schedule.to_dict(),
        message="Jadwal kegiatan berhasil ditambahkan",
        code=201
    )


@schedules_bp.route('/<int:schedule_id>', methods=['PUT'])
@permission_required('buat_jadwal')
def update_schedule(schedule_id):
    """
    Perbarui Jadwal Kegiatan
    ---
    tags:
      - "UC-04: Jadwal Kegiatan"
    summary: Mengubah detail jadwal kegiatan
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: schedule_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            judul_kegiatan:
              type: string
            kategori:
              type: string
            waktu:
              type: string
            lokasi:
              type: string
            keterangan:
              type: string
            divisi_id:
              type: integer
    responses:
      200:
        description: Jadwal berhasil diperbarui
      404:
        description: Jadwal tidak ditemukan
    """
    user = get_current_user()
    schedule = db.session.get(Schedule, schedule_id)
    if not schedule:
        return error_response("Jadwal kegiatan tidak ditemukan", 404)

    data = request.get_json() or {}

    if 'judul_kegiatan' in data and data['judul_kegiatan'].strip():
        schedule.Judul_Kegiatan = data['judul_kegiatan'].strip()
    if 'kategori' in data:
        schedule.Kategori = data['kategori'].strip() if data['kategori'] else None
    if 'lokasi' in data:
        schedule.Lokasi = data['lokasi'].strip() if data['lokasi'] else None
    if 'keterangan' in data:
        schedule.Keterangan = data['keterangan'].strip() if data['keterangan'] else None
    if 'divisi_id' in data:
        schedule.Divisi_ID = data['divisi_id']
    if 'waktu' in data and data['waktu'].strip():
        waktu_str = data['waktu'].strip()
        waktu_obj = None
        for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
            try:
                waktu_obj = datetime.strptime(waktu_str, fmt)
                break
            except ValueError:
                continue
        if not waktu_obj:
            return error_response("Format waktu tidak valid. Gunakan 'YYYY-MM-DD HH:MM:SS'", 400)
        schedule.Waktu = waktu_obj

    schedule.Updated_By = user.ID
    db.session.commit()

    log_audit("UPDATE_SCHEDULE", "Jadwal", f"Jadwal diperbarui: '{schedule.Judul_Kegiatan}' (ID: {schedule.ID})")

    return success_response(
        data=schedule.to_dict(),
        message="Jadwal kegiatan berhasil diperbarui"
    )


@schedules_bp.route('/<int:schedule_id>', methods=['DELETE'])
@permission_required('buat_jadwal')
def delete_schedule(schedule_id):
    """
    Hapus Jadwal Kegiatan
    ---
    tags:
      - "UC-04: Jadwal Kegiatan"
    summary: Menghapus jadwal kegiatan dari sistem
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: schedule_id
        type: integer
        required: true
    responses:
      200:
        description: Jadwal berhasil dihapus
      404:
        description: Jadwal tidak ditemukan
    """
    schedule = db.session.get(Schedule, schedule_id)
    if not schedule:
        return error_response("Jadwal kegiatan tidak ditemukan", 404)

    title = schedule.Judul_Kegiatan
    db.session.delete(schedule)
    db.session.commit()

    log_audit("DELETE_SCHEDULE", "Jadwal", f"Jadwal dihapus: '{title}' (ID: {schedule_id})")

    return success_response(message=f"Jadwal '{title}' berhasil dihapus")
