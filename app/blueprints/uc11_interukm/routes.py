from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.interukm import InterUKMPost
from app.middleware.auth_middleware import get_current_user, permission_required
from app.middleware.audit_logger import log_audit
from app.utils.response import success_response, error_response
from app.utils.datetime_helper import utc_now

interukm_bp = Blueprint('uc11_interukm', __name__, url_prefix='/api/v1/interukm')

@interukm_bp.route('/feed', methods=['GET'])
@jwt_required()
def list_approved_feed():
    """
    Feed Publik Inter-UKM
    ---
    tags:
      - "UC-11: Inter-UKM"
    summary: Mengambil postingan pengumuman kolaborasi lintas UKM yang telah disetujui (Approved)
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: ukm
        type: string
        description: Filter UKM pengirim
      - in: query
        name: search
        type: string
        description: Cari judul atau isi pengumuman
    responses:
      200:
        description: Feed inter-UKM berhasil diambil
    """
    ukm_filter = request.args.get('ukm')
    search = request.args.get('search')

    query = InterUKMPost.query.filter_by(Status_Persetujuan='Approved')

    if ukm_filter:
        query = query.filter(InterUKMPost.UKM_Pengirim == ukm_filter)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (InterUKMPost.Judul.ilike(search_filter)) |
            (InterUKMPost.Isi_Pengumuman.ilike(search_filter))
        )

    posts = query.order_by(InterUKMPost.Date.desc()).all()

    return success_response(
        data=[p.to_dict() for p in posts],
        total=len(posts),
        message="Feed Inter-UKM berhasil diambil"
    )


@interukm_bp.route('/posts', methods=['POST'])
@permission_required('buat_interukm')
def create_interukm_post():
    """
    Buat Postingan Inter-UKM
    ---
    tags:
      - "UC-11: Inter-UKM"
    summary: Mengajukan draf postingan informasi/undangan lintas organisasi (UKM)
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - ukm_pengirim
            - judul
            - isi_pengumuman
          properties:
            ukm_pengirim:
              type: string
              example: UKM Robotika & Otomasi
            judul:
              type: string
              example: Undangan Lomba Cipta Robot Nasional 2026
            isi_pengumuman:
              type: string
              example: Mengundang perwakilan mahasiswa untuk berpartisipasi dalam ajang tahunan robotika.
    responses:
      201:
        description: Postingan inter-UKM berhasil diajukan dan menunggu persetujuan
      400:
        description: Input data tidak lengkap
    """
    user = get_current_user()
    data = request.get_json() or {}

    ukm = data.get('ukm_pengirim', '').strip()
    judul = data.get('judul', '').strip()
    isi = data.get('isi_pengumuman', '').strip()

    if not ukm or not judul or not isi:
        return error_response("UKM pengirim, judul, dan isi pengumuman wajib diisi", 400)

    post = InterUKMPost(
        UKM_Pengirim=ukm,
        Judul=judul,
        Isi_Pengumuman=isi,
        Status_Persetujuan='Pending',
        Date=utc_now(),
        Created_By=user.ID
    )
    db.session.add(post)
    db.session.commit()

    log_audit("CREATE_INTERUKM_POST", "Inter-UKM", f"Pengajuan Inter-UKM dari {ukm}: '{judul}' (ID: {post.ID})")

    return success_response(
        data=post.to_dict(),
        message="Postingan Inter-UKM berhasil diajukan dan menunggu persetujuan ketua/admin",
        code=201
    )


@interukm_bp.route('/posts/pending', methods=['GET'])
@permission_required('setujui_interukm')
def list_pending_posts():
    """
    Daftar Antrean Persetujuan Inter-UKM
    ---
    tags:
      - "UC-11: Inter-UKM"
    summary: Mengambil postingan inter-UKM yang berstatus Pending untuk disetujui (Admin/Ketua)
    security:
      - BearerAuth: []
    responses:
      200:
        description: Antrean persetujuan berhasil diambil
    """
    pending_posts = InterUKMPost.query.filter_by(
        Status_Persetujuan='Pending'
    ).order_by(InterUKMPost.Date.asc()).all()

    return success_response(
        data=[p.to_dict() for p in pending_posts],
        total=len(pending_posts),
        message="Daftar antrean persetujuan Inter-UKM berhasil diambil"
    )


@interukm_bp.route('/posts/<int:post_id>/approve', methods=['POST'])
@permission_required('setujui_interukm')
def approve_interukm_post(post_id):
    """
    Setujui Postingan Inter-UKM
    ---
    tags:
      - "UC-11: Inter-UKM"
    summary: Menyetujui postingan lintas UKM untuk tampil di feed umum (Admin/Ketua)
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      200:
        description: Postingan berhasil disetujui
      404:
        description: Postingan tidak ditemukan
    """
    user = get_current_user()
    post = db.session.get(InterUKMPost, post_id)
    if not post:
        return error_response("Postingan Inter-UKM tidak ditemukan", 404)

    post.Status_Persetujuan = 'Approved'
    post.Approved_By = user.ID
    db.session.commit()

    log_audit("APPROVE_INTERUKM", "Inter-UKM", f"Postingan disetujui: '{post.Judul}' dari {post.UKM_Pengirim} (ID: {post.ID})")

    return success_response(
        data=post.to_dict(),
        message=f"Postingan '{post.Judul}' berhasil disetujui dan kini tampil di feed"
    )


@interukm_bp.route('/posts/<int:post_id>/reject', methods=['POST'])
@permission_required('setujui_interukm')
def reject_interukm_post(post_id):
    """
    Tolak Postingan Inter-UKM
    ---
    tags:
      - "UC-11: Inter-UKM"
    summary: Menolak publikasi postingan lintas UKM (Admin/Ketua)
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            alasan_penolakan:
              type: string
              example: Konten tidak sesuai dengan visi misi atau format yang disepakati.
    responses:
      200:
        description: Postingan berhasil ditolak
      404:
        description: Postingan tidak ditemukan
    """
    user = get_current_user()
    post = db.session.get(InterUKMPost, post_id)
    if not post:
        return error_response("Postingan Inter-UKM tidak ditemukan", 404)

    data = request.get_json() or {}
    alasan = data.get('alasan_penolakan', '').strip()

    post.Status_Persetujuan = 'Rejected'
    post.Approved_By = user.ID
    db.session.commit()

    detail_str = f"Postingan '{post.Judul}' ditolak oleh {user.Nama}"
    if alasan:
        detail_str += f". Alasan: {alasan}"

    log_audit("REJECT_INTERUKM", "Inter-UKM", detail_str)

    return success_response(
        data={
            "post": post.to_dict(),
            "alasan_penolakan": alasan
        },
        message=f"Postingan '{post.Judul}' telah ditolak"
    )


@interukm_bp.route('/my-posts', methods=['GET'])
@permission_required('buat_interukm')
def list_my_posts():
    """
    Daftar Postingan Saya
    ---
    tags:
      - "UC-11: Inter-UKM"
    summary: Mengambil daftar postingan inter-UKM yang pernah diajukan oleh pengguna saat ini
    security:
      - BearerAuth: []
    responses:
      200:
        description: Daftar postingan berhasil diambil
    """
    user = get_current_user()
    my_posts = InterUKMPost.query.filter_by(
        Created_By=user.ID
    ).order_by(InterUKMPost.Date.desc()).all()

    return success_response(
        data=[p.to_dict() for p in my_posts],
        total=len(my_posts),
        message="Daftar postingan Inter-UKM Anda berhasil diambil"
    )
