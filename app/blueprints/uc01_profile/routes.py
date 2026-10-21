from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.user import User
from app.middleware.auth_middleware import get_current_user, get_user_permissions
from app.middleware.audit_logger import log_audit
from app.utils.response import success_response, error_response

profile_bp = Blueprint('uc01_profile', __name__, url_prefix='/api/v1/profile')

@profile_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    """
    Profil Pengguna Saat Ini
    ---
    tags:
      - "UC-01: Profil & Jobdesk"
    summary: Mengambil informasi profil dan daftar permission pengguna yang sedang login
    security:
      - BearerAuth: []
    responses:
      200:
        description: Data profil berhasil diambil
      401:
        description: Token tidak valid
    """
    user = get_current_user()
    if not user:
        return error_response("Pengguna tidak ditemukan", 404)

    permissions = list(get_user_permissions(user))
    data = user.to_dict()
    data['permissions'] = permissions

    return success_response(
        data=data,
        message="Profil berhasil diambil"
    )


@profile_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_my_profile():
    """
    Perbarui Profil Pengguna
    ---
    tags:
      - "UC-01: Profil & Jobdesk"
    summary: Memperbarui nama, jobdesk, atau mengganti password akun sendiri
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            nama:
              type: string
              example: Muh. Farhan Updated
            job_desc:
              type: string
              example: Koordinator Divisi Media & Kreatif
            old_password:
              type: string
              description: Diperlukan jika ingin mengubah password
            new_password:
              type: string
              description: Password baru
    responses:
      200:
        description: Profil berhasil diperbarui
      400:
        description: Password lama salah atau data tidak valid
    """
    user = get_current_user()
    if not user:
        return error_response("Pengguna tidak ditemukan", 404)

    data = request.get_json() or {}

    if 'nama' in data and data['nama'].strip():
        user.Nama = data['nama'].strip()

    if 'job_desc' in data:
        user.Job_Desc = data['job_desc'].strip() if data['job_desc'] else None

    # Handle password change
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    if old_password or new_password:
        if not old_password or not new_password:
            return error_response("Untuk ganti password, 'old_password' dan 'new_password' harus disertakan", 400)
        if not user.check_password(old_password):
            return error_response("Password lama Anda salah", 400)
        if len(new_password) < 6:
            return error_response("Password baru minimal 6 karakter", 400)
        user.set_password(new_password)

    user.Updated_By = user.ID
    db.session.commit()

    log_audit("UPDATE_PROFILE", "Profil", f"User {user.Email} memperbarui profil", user_id=user.ID)

    return success_response(
        data=user.to_dict(),
        message="Profil berhasil diperbarui"
    )


@profile_bp.route('/jobdesk', methods=['GET'])
@jwt_required()
def get_jobdesk_list():
    """
    Daftar Jobdesk Pengurus
    ---
    tags:
      - "UC-01: Profil & Jobdesk"
    summary: Melihat daftar jobdesk pengurus dan struktur organisasi
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: role
        type: string
        enum: [Admin, Pengurus, Anggota]
        description: Filter berdasarkan role
    responses:
      200:
        description: Daftar jobdesk berhasil diambil
    """
    role_filter = request.args.get('role')

    query = User.query.filter(User.Status_Keanggotaan == 'Aktif')
    if role_filter:
        query = query.filter(User.Role == role_filter)
    else:
        # Default prioritize Pengurus and Admin
        query = query.filter(User.Role.in_(['Admin', 'Pengurus']))

    members = query.order_by(User.Role.asc(), User.Nama.asc()).all()

    jobdesk_list = [
        {
            "user_id": m.ID,
            "nama": m.Nama,
            "email": m.Email,
            "role": m.Role,
            "job_desc": m.Job_Desc or "Belum ditentukan"
        }
        for m in members
    ]

    return success_response(
        data=jobdesk_list,
        total=len(jobdesk_list),
        message="Daftar jobdesk berhasil diambil"
    )
