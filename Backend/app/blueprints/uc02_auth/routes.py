from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from app.extensions import db
from app.models.user import User, VALID_UKM_LIST
from app.middleware.auth_middleware import get_current_user, get_user_permissions, role_required
from app.middleware.audit_logger import log_audit
from app.utils.response import success_response, error_response

auth_bp = Blueprint('uc02_auth', __name__, url_prefix='/api/v1/auth')


def _check_ukm_scope(actor: User, target: User):
    """
    Memastikan Ketua / Pengurus dari suatu UKM hanya dapat mengelola anggota
    yang berasal dari UKM yang sama.
    Mengembalikan (True, None) jika diizinkan, atau (False, pesan_error) jika ditolak.
    """
    if not actor or not target:
        return False, "Pengguna tidak ditemukan"
    actor_ukm = actor.get_ukm()
    if not actor_ukm:
        # Jika akun Super-Admin tidak terikat UKM spesifik, izinkan
        return True, None
    target_ukm = target.get_ukm()
    if target_ukm != actor_ukm:
        return (
            False,
            f"Akses ditolak: Anda adalah {actor.Role} {actor_ukm} dan tidak memiliki wewenang mengontrol anggota dari {target_ukm or 'UKM lain'}."
        )
    return True, None


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login User & Generate JWT Token
    ---
    tags:
      - "UC-02: Autentikasi & Manajemen Akun"
    summary: Login dengan email dan password
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
        return error_response("Pendaftaran akun Anda sedang menunggu verifikasi oleh Ketua", 403)

    if user.Status_Keanggotaan != 'Aktif':
        log_audit("LOGIN_REJECTED", "Auth", f"Login ditolak: akun non-aktif ({email})", user_id=user.ID)
        return error_response("Akun Anda tidak aktif atau berstatus alumni", 403)

    access_token = create_access_token(identity=str(user.ID))
    refresh_token = create_refresh_token(identity=str(user.ID))
    permissions = list(get_user_permissions(user))

    log_audit("LOGIN_SUCCESS", "Auth", f"Login berhasil untuk user: {user.Nama} ({user.Role} - {user.get_ukm() or 'SIOMAS'})", user_id=user.ID)

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
    summary: Mendaftarkan akun pengguna baru sesuai UKM pilihan
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

    if role not in ('Ketua', 'Pengurus', 'Anggota'):
        return error_response("Role harus salah satu dari: Ketua, Pengurus, Anggota", 400)

    if User.query.filter_by(Email=email).first():
        return error_response("Email sudah terdaftar di sistem", 400)

    creator_id = None
    try:
        current_u = get_current_user()
        if current_u:
            creator_id = current_u.ID
            # Jika Ketua UKM mendaftarkan anggota secara langsung, wariskan UKM Ketua bila belum diisi
            if not ukm and current_u.get_ukm():
                ukm = current_u.get_ukm()
                job_desc = f"{ukm} - {divisi or job_desc or role}"
    except Exception:
        creator_id = None

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

    log_audit(
        "REGISTER_USER",
        "Auth",
        f"User baru didaftarkan: {new_user.Email} ({new_user.Role}, UKM: {new_user.get_ukm() or '-'}, Status: {new_user.Status_Keanggotaan})",
        user_id=new_user.ID,
        after=new_user.to_dict()
    )

    return success_response(
        data=new_user.to_dict(),
        message="Registrasi berhasil. Akun Anda sedang menunggu verifikasi oleh Ketua UKM." if status_keanggotaan == 'Menunggu Verifikasi' else "Registrasi berhasil",
        code=201
    )


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """
    Perbarui Access Token Menggunakan Refresh Token
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
@role_required('Ketua', 'Pengurus')
def list_users():
    """
    Daftar Pengguna (Terisolasi Sesuai UKM Ketua / Pengurus yang Login)
    ---
    tags:
      - "UC-02: Autentikasi & Manajemen Akun"
    summary: Mendapatkan daftar akun pengguna yang berada di dalam UKM yang sama dengan Ketua/Pengurus
    security:
      - BearerAuth: []
    """
    current_user = get_current_user()
    actor_ukm = current_user.get_ukm() if current_user else None

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

    all_matching = query.order_by(User.Created_At.desc()).all()

    # Filter ketat berdasarkan UKM milik Ketua/Pengurus yang sedang login,
    # dan hanya tampilkan Anggota & Pengurus (tidak menampilkan akun Ketua sebagai anggota)
    include_ketua = request.args.get('include_ketua', 'false').lower() in ('true', '1')
    users = []
    for u in all_matching:
        if not include_ketua and u.Role == 'Ketua':
            continue
        if actor_ukm and u.get_ukm() != actor_ukm:
            continue
        users.append(u)

    return success_response(
        data=[u.to_dict() for u in users],
        total=len(users),
        managed_ukm=actor_ukm,
        valid_ukm_list=list(VALID_UKM_LIST),
        message=f"Daftar pengguna {actor_ukm or 'Seluruh UKM'} berhasil diambil"
    )


@auth_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_detail(user_id):
    """
    Detail Pengguna Berdasarkan ID (Terisolasi per UKM)
    """
    current_user = get_current_user()
    user = db.session.get(User, user_id)
    if not user:
        return error_response("Pengguna tidak ditemukan", 404)

    if current_user and current_user.ID != user.ID:
        allowed, err_msg = _check_ukm_scope(current_user, user)
        if not allowed:
            return error_response(err_msg, 403)

    return success_response(data=user.to_dict())


@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@role_required('Ketua')
def update_user(user_id):
    """
    Update Akun Pengguna (Ketua Only - Hanya untuk Anggota di UKM yang Sama)
    """
    user = db.session.get(User, user_id)
    if not user:
        return error_response("Pengguna tidak ditemukan", 404)

    current_user = get_current_user()
    allowed, err_msg = _check_ukm_scope(current_user, user)
    if not allowed:
        return error_response(err_msg, 403)

    before_state = user.to_dict()
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
    if 'role' in data and data['role'] in ('Ketua', 'Pengurus', 'Anggota'):
        user.Role = data['role']
    if 'job_desc' in data:
        new_jd = data['job_desc'].strip() if data['job_desc'] else None
        # Pastikan prefix UKM tetap terjaga jika Ketua terikat pada UKM tertentu
        actor_ukm = current_user.get_ukm() if current_user else None
        if actor_ukm and new_jd and not new_jd.lower().startswith(actor_ukm.lower()):
            new_jd = f"{actor_ukm} - {new_jd}"
        user.Job_Desc = new_jd
    if 'status_keanggotaan' in data and data['status_keanggotaan'] in ('Menunggu Verifikasi', 'Pending', 'Aktif', 'Alumni'):
        user.Status_Keanggotaan = 'Menunggu Verifikasi' if data['status_keanggotaan'] == 'Pending' else data['status_keanggotaan']
    if 'password' in data and data['password']:
        user.set_password(data['password'])

    user.Updated_By = current_user.ID if current_user else None
    db.session.commit()

    log_audit(
        "UPDATE_USER",
        "User Management",
        f"Ketua ({current_user.get_ukm() or 'SIOMAS'}) memperbarui akun: {user.Email} (ID: {user.ID})",
        before=before_state,
        after=user.to_dict()
    )

    return success_response(
        data=user.to_dict(),
        message="Data pengguna berhasil diperbarui"
    )


@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@role_required('Ketua')
def delete_user(user_id):
    """
    Hapus Pengguna (Ketua Only - Hanya untuk Anggota di UKM yang Sama)
    """
    current_user = get_current_user()
    if current_user and current_user.ID == user_id:
        return error_response("Anda tidak dapat menghapus akun Anda sendiri", 400)

    user = db.session.get(User, user_id)
    if not user:
        return error_response("Pengguna tidak ditemukan", 404)

    allowed, err_msg = _check_ukm_scope(current_user, user)
    if not allowed:
        return error_response(err_msg, 403)

    before_state = user.to_dict()
    email = user.Email
    db.session.delete(user)
    db.session.commit()

    log_audit(
        "DELETE_USER",
        "User Management",
        f"Ketua ({current_user.get_ukm() or 'SIOMAS'}) menghapus pengguna: {email} (ID: {user_id})",
        before=before_state,
        after=None
    )

    return success_response(message=f"Pengguna {email} berhasil dihapus")


@auth_bp.route('/users/<int:user_id>/verify', methods=['PATCH'])
@role_required('Ketua')
def verify_user(user_id):
    """
    Verifikasi & Aktifkan Akun Anggota (Ketua Only - Hanya Anggota di UKM yang Sama)
    """
    user = db.session.get(User, user_id)
    if not user:
        return error_response("Pengguna tidak ditemukan", 404)

    current_user = get_current_user()
    allowed, err_msg = _check_ukm_scope(current_user, user)
    if not allowed:
        return error_response(err_msg, 403)

    before_state = {"id": user.ID, "email": user.Email, "ukm": user.get_ukm(), "status_keanggotaan": user.Status_Keanggotaan}
    user.Status_Keanggotaan = 'Aktif'
    user.Updated_By = current_user.ID if current_user else None
    db.session.commit()
    after_state = {"id": user.ID, "email": user.Email, "ukm": user.get_ukm(), "status_keanggotaan": user.Status_Keanggotaan}

    log_audit(
        "VERIFY_USER",
        "Auth",
        f"Ketua ({current_user.get_ukm() or 'SIOMAS'}) memverifikasi dan mengaktifkan akun: {user.Email} (ID: {user.ID})",
        before=before_state,
        after=after_state
    )

    return success_response(
        data=user.to_dict(),
        message=f"Akun {user.Nama} ({user.get_ukm() or user.Email}) berhasil diverifikasi dan aktif."
    )
