from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from app.extensions import db
from app.models.user import User
from app.middleware.auth_middleware import get_current_user, get_user_permissions, role_required
from app.middleware.audit_logger import log_audit
from app.utils.response import success_response, error_response

auth_bp = Blueprint('uc02_auth', __name__, url_prefix='/api/v1/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login User & Generate JWT Token
    ---
    tags:
      - "UC-02: Autentikasi & Manajemen Akun"
    summary: Login dengan email dan password
    description: Memvalidasi kredensial pengguna, mengecek status keaktifan, dan mengembalikan JWT Access Token serta Refresh Token.
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: admin@siomas.com
            password:
              type: string
              example: admin123
    responses:
      200:
        description: Login berhasil
      400:
        description: Input tidak lengkap
      401:
        description: Kredensial tidak valid
      403:
        description: Akun tidak aktif
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return error_response("Email dan password wajib diisi", 400)

    user = User.query.filter_by(Email=email).first()
    if not user or not user.check_password(password):
        log_audit("LOGIN_FAILED", "Auth", f"Gagal login untuk email: {email}")
        return error_response("Email atau password salah", 401)

    if user.Status_Keanggotaan in ('Menunggu Verifikasi', 'Pending'):
        log_audit("LOGIN_REJECTED", "Auth", f"Login ditolak: akun sedang menunggu verifikasi ({email})", user_id=user.ID)
        return error_response("Pendaftaran akun Anda sedang menunggu verifikasi oleh Admin", 403)

    if user.Status_Keanggotaan != 'Aktif':
        log_audit("LOGIN_REJECTED", "Auth", f"Login ditolak: akun non-aktif ({email})", user_id=user.ID)
        return error_response("Akun Anda tidak aktif atau berstatus alumni", 403)

    access_token = create_access_token(identity=str(user.ID))
    refresh_token = create_refresh_token(identity=str(user.ID))
    permissions = list(get_user_permissions(user))

    log_audit("LOGIN_SUCCESS", "Auth", f"Login berhasil untuk user: {user.Nama} ({user.Role})", user_id=user.ID)

    return success_response(
        data={
            "user": user.to_dict(),
            "permissions": permissions,
            "access_token": access_token,
            "refresh_token": refresh_token
        },
        message="Login berhasil"
    )


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Registrasi Pengguna Baru
    ---
    tags:
      - "UC-02: Autentikasi & Manajemen Akun"
    summary: Mendaftarkan akun pengguna baru
    description: Mendaftarkan pengguna ke sistem. Role default adalah Anggota. Admin dapat menentukan role spesifik.
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - nama
            - email
            - password
          properties:
            nama:
              type: string
              example: Muh. Farhan
            email:
              type: string
              example: farhan@siomas.com
            password:
              type: string
              example: rahasia123
            role:
              type: string
              enum: [Admin, Pengurus, Anggota]
              example: Anggota
            job_desc:
              type: string
              example: Anggota Divisi Humas
    responses:
      201:
        description: Pendaftaran berhasil
      400:
        description: Validasi data gagal atau email sudah terdaftar
    """
    data = request.get_json() or {}
    nama = data.get('nama', '').strip()
    nim = data.get('nim', '').strip()
    ukm = data.get('ukm', '').strip()
    divisi = data.get('divisi', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    role = data.get('role', 'Anggota')
    job_desc = data.get('job_desc', '').strip()

    # Gabungkan UKM & Divisi jika disediakan
    if ukm and divisi:
        job_desc = f"{ukm} - {divisi}"
    elif ukm:
        job_desc = ukm
    elif divisi and not job_desc:
        job_desc = divisi

    if not nama or not email or not password:
        return error_response("Nama, email, dan password wajib diisi", 400)

    if role not in ('Admin', 'Pengurus', 'Anggota'):
        return error_response("Role harus salah satu dari: Admin, Pengurus, Anggota", 400)

    # Check if email exists
    if User.query.filter_by(Email=email).first():
        return error_response("Email sudah terdaftar di sistem", 400)

    creator_id = None
    try:
        current_u = get_current_user()
        if current_u:
            creator_id = current_u.ID
    except Exception:
        creator_id = None

    # Status default: Menunggu Verifikasi untuk registrasi mandiri, Aktif jika didaftarkan admin
    status_keanggotaan = data.get('status_keanggotaan', 'Menunggu Verifikasi' if not creator_id else 'Aktif')
    if status_keanggotaan not in ('Menunggu Verifikasi', 'Aktif', 'Alumni'):
        status_keanggotaan = 'Menunggu Verifikasi'

    new_user = User(
        Nama=nama,
        NIM=nim if nim else None,
        Email=email,
        Role=role,
        Job_Desc=job_desc if job_desc else None,
        Status_Keanggotaan=status_keanggotaan,
        Created_By=creator_id
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    log_audit("REGISTER_USER", "Auth", f"User baru didaftarkan: {new_user.Email} ({new_user.Role}, Status: {new_user.Status_Keanggotaan})", user_id=new_user.ID)

    return success_response(
        data=new_user.to_dict(),
        message="Registrasi berhasil. Akun Anda sedang menunggu verifikasi oleh Admin." if status_keanggotaan == 'Menunggu Verifikasi' else "Registrasi berhasil",
        code=201
    )


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """
    Perbarui Access Token Menggunakan Refresh Token
    ---
    tags:
      - "UC-02: Autentikasi & Manajemen Akun"
    summary: Refresh JWT Access Token
    security:
      - BearerAuth: []
    responses:
      200:
        description: Access token berhasil diperbarui
      401:
        description: Refresh token tidak valid atau kedaluwarsa
    """
    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    if not user or user.Status_Keanggotaan != 'Aktif':
        return error_response("User tidak valid atau akun tidak aktif", 401)

    new_access_token = create_access_token(identity=str(user.ID))
    return success_response(
        data={"access_token": new_access_token},
        message="Access token berhasil diperbarui"
    )


@auth_bp.route('/users', methods=['GET'])
@role_required('Admin', 'Pengurus')
def list_users():
    """
    Daftar Seluruh Pengguna
    ---
    tags:
      - "UC-02: Autentikasi & Manajemen Akun"
    summary: Mendapatkan daftar akun pengguna (Admin & Pengurus)
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: role
        type: string
        enum: [Admin, Pengurus, Anggota]
      - in: query
        name: status
        type: string
        enum: [Aktif, Alumni]
      - in: query
        name: search
        type: string
        description: Cari nama atau email
    responses:
      200:
        description: Daftar pengguna berhasil diambil
    """
    role = request.args.get('role')
    status = request.args.get('status')
    search = request.args.get('search')

    query = User.query
    if role:
        query = query.filter(User.Role == role)
    if status:
        query = query.filter(User.Status_Keanggotaan == status)
    if search:
        search_filter = f"%{search}%"
        query = query.filter((User.Nama.ilike(search_filter)) | (User.Email.ilike(search_filter)))

    users = query.order_by(User.Created_At.desc()).all()
    return success_response(
        data=[u.to_dict() for u in users],
        total=len(users),
        message="Daftar pengguna berhasil diambil"
    )


@auth_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_detail(user_id):
    """
    Detail Pengguna Berdasarkan ID
    ---
    tags:
      - "UC-02: Autentikasi & Manajemen Akun"
    summary: Mengambil profil lengkap user berdasarkan ID
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
    responses:
      200:
        description: Data user ditemukan
      404:
        description: User tidak ditemukan
    """
    user = db.session.get(User, user_id)
    if not user:
        return error_response("Pengguna tidak ditemukan", 404)
    return success_response(data=user.to_dict())


@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@role_required('Admin')
def update_user(user_id):
    """
    Update Akun Pengguna (Admin Only)
    ---
    tags:
      - "UC-02: Autentikasi & Manajemen Akun"
    summary: Mengubah data, role, jobdesk, atau status keanggotaan pengguna
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            nama:
              type: string
            email:
              type: string
            role:
              type: string
              enum: [Admin, Pengurus, Anggota]
            job_desc:
              type: string
            status_keanggotaan:
              type: string
              enum: [Aktif, Alumni]
            password:
              type: string
    responses:
      200:
        description: Data pengguna berhasil diperbarui
      404:
        description: User tidak ditemukan
    """
    user = db.session.get(User, user_id)
    if not user:
        return error_response("Pengguna tidak ditemukan", 404)

    current_user = get_current_user()
    data = request.get_json() or {}

    if 'nama' in data:
        user.Nama = data['nama'].strip()
    if 'nim' in data:
        user.NIM = data['nim'].strip() if data['nim'] else None
    if 'email' in data:
        new_email = data['email'].strip().lower()
        if new_email != user.Email:
            existing = User.query.filter_by(Email=new_email).first()
            if existing:
                return error_response("Email sudah digunakan oleh akun lain", 400)
            user.Email = new_email
    if 'role' in data and data['role'] in ('Admin', 'Pengurus', 'Anggota'):
        user.Role = data['role']
    if 'job_desc' in data:
        user.Job_Desc = data['job_desc'].strip() if data['job_desc'] else None
    if 'status_keanggotaan' in data and data['status_keanggotaan'] in ('Menunggu Verifikasi', 'Pending', 'Aktif', 'Alumni'):
        user.Status_Keanggotaan = 'Menunggu Verifikasi' if data['status_keanggotaan'] == 'Pending' else data['status_keanggotaan']
    if 'password' in data and data['password']:
        user.set_password(data['password'])

    user.Updated_By = current_user.ID if current_user else None
    db.session.commit()

    log_audit("UPDATE_USER", "User Management", f"Admin memperbarui akun: {user.Email} (ID: {user.ID})")

    return success_response(
        data=user.to_dict(),
        message="Data pengguna berhasil diperbarui"
    )


@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@role_required('Admin')
def delete_user(user_id):
    """
    Hapus Pengguna (Admin Only)
    ---
    tags:
      - "UC-02: Autentikasi & Manajemen Akun"
    summary: Menghapus akun pengguna dari database
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
    responses:
      200:
        description: Akun pengguna berhasil dihapus
      400:
        description: Tidak dapat menghapus akun sendiri
      404:
        description: User tidak ditemukan
    """
    current_user = get_current_user()
    if current_user and current_user.ID == user_id:
        return error_response("Anda tidak dapat menghapus akun Anda sendiri", 400)

    user = db.session.get(User, user_id)
    if not user:
        return error_response("Pengguna tidak ditemukan", 404)

    email = user.Email
    db.session.delete(user)
    db.session.commit()

    log_audit("DELETE_USER", "User Management", f"Admin menghapus pengguna: {email} (ID: {user_id})")

    return success_response(message=f"Pengguna {email} berhasil dihapus")


@auth_bp.route('/users/<int:user_id>/verify', methods=['PATCH'])
@role_required('Admin')
def verify_user(user_id):
    """
    Verifikasi & Aktifkan Akun Anggota (Admin Only) - FRAME-17 & TC-02
    ---
    tags:
      - "UC-02: Autentikasi & Manajemen Akun"
    summary: Memverifikasi pendaftar baru dan mengaktifkan akun (Status_Keanggotaan = 'Aktif')
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
    responses:
      200:
        description: Akun berhasil diverifikasi dan diaktifkan
      404:
        description: User tidak ditemukan
    """
    user = db.session.get(User, user_id)
    if not user:
        return error_response("Pengguna tidak ditemukan", 404)

    current_user = get_current_user()
    user.Status_Keanggotaan = 'Aktif'
    user.Updated_By = current_user.ID if current_user else None
    db.session.commit()

    log_audit("VERIFY_USER", "Auth", f"Admin memverifikasi dan mengaktifkan akun: {user.Email} (ID: {user.ID})", user_id=user.ID)

    return success_response(
        data=user.to_dict(),
        message=f"Akun {user.Nama} ({user.Email}) berhasil diverifikasi dan aktif."
    )
