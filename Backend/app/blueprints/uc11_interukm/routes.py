import os
import uuid
from flask import Blueprint, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models.interukm import InterUKMPost
from app.middleware.auth_middleware import get_current_user, permission_required
from app.middleware.audit_logger import log_audit
from app.utils.response import success_response, error_response
from app.utils.datetime_helper import utc_now

interukm_bp = Blueprint('uc11_interukm', __name__, url_prefix='/api/v1/interukm')


@interukm_bp.route('/files/<path:filename>', methods=['GET'])
def serve_interukm_file(filename):
    """Serve uploaded Inter-UKM cover images and proposal attachments."""
    upload_dir = current_app.config['UPLOAD_FOLDER']
    safe_name = os.path.basename(filename)
    file_path = os.path.join(upload_dir, safe_name)
    if not os.path.exists(file_path):
        return error_response("File tidak ditemukan", 404)
    as_attachment = request.args.get('download') == '1'
    return send_from_directory(upload_dir, safe_name, as_attachment=as_attachment)


@interukm_bp.route('/feed', methods=['GET'])
@jwt_required()
def list_approved_feed():
    """
    Feed Publik Inter-UKM
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
@jwt_required()
def create_interukm_post():
    """
    Buat Postingan Inter-UKM (mendukung JSON maupun multipart/form-data dengan foto & proposal)
    """
    user = get_current_user()

    if request.content_type and 'multipart/form-data' in request.content_type:
        ukm = (request.form.get('ukm_pengirim') or '').strip()
        judul = (request.form.get('judul') or '').strip()
        isi = (request.form.get('isi_pengumuman') or '').strip()
    else:
        data = request.get_json(silent=True) or {}
        ukm = (data.get('ukm_pengirim') or '').strip()
        judul = (data.get('judul') or '').strip()
        isi = (data.get('isi_pengumuman') or '').strip()

    if not ukm or not judul or not isi:
        return error_response("UKM pengirim, judul, dan isi pengumuman wajib diisi", 400)

    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)

    # Simpan foto sampul jika diunggah
    foto_file = request.files.get('foto')
    if foto_file and foto_file.filename:
        ext = os.path.splitext(secure_filename(foto_file.filename))[1].lower() or '.jpg'
        saved_foto = f"interukm_img_{uuid.uuid4().hex[:10]}{ext}"
        foto_file.save(os.path.join(upload_dir, saved_foto))
        isi = f"{isi} • FotoURL: /api/v1/interukm/files/{saved_foto}"

    # Simpan berkas proposal jika diunggah
    proposal_file = request.files.get('proposal')
    if proposal_file and proposal_file.filename:
        orig_name = secure_filename(proposal_file.filename)
        ext = os.path.splitext(orig_name)[1].lower() or '.pdf'
        saved_prop = f"interukm_doc_{uuid.uuid4().hex[:10]}{ext}"
        prop_path = os.path.join(upload_dir, saved_prop)
        proposal_file.save(prop_path)
        size_kb = os.path.getsize(prop_path) / 1024.0
        if f"Lampiran:" not in isi:
            isi = f"{isi} • Lampiran: {orig_name} ({size_kb:.1f} KB)"
        isi = f"{isi} • FileURL: /api/v1/interukm/files/{saved_prop}"

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
@jwt_required()
def list_my_posts():
    """
    Daftar Postingan Saya
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
