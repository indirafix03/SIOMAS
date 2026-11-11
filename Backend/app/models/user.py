import bcrypt
from app.extensions import db
from app.utils.datetime_helper import utc_now

VALID_UKM_LIST = (
    'UKM Seni & Budaya',
    'UKM Olahraga',
    'UKM Penalaran & Penelitian',
    'UKM KSR - PMI',
    'UKM Pers Mahasiswa',
    'UKM Mapala',
    'UKM Robotika & Teknologi',
)


class User(db.Model):
    __tablename__ = 'users'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Nama = db.Column(db.String(255), nullable=False)
    NIM = db.Column(db.String(50), nullable=True)
    Email = db.Column(db.String(255), unique=True, nullable=False)
    Password_Hash = db.Column(db.String(255), nullable=False)
    Role = db.Column(db.Enum('Ketua', 'Pengurus', 'Anggota', name='role_enum'), nullable=False)
    Job_Desc = db.Column(db.String(255), nullable=True)
    Status_Keanggotaan = db.Column(db.Enum('Menunggu Verifikasi', 'Aktif', 'Alumni', name='status_keanggotaan_enum'), nullable=False, default='Menunggu Verifikasi')
    Created_At = db.Column(db.DateTime, default=utc_now)
    Created_By = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='SET NULL'), nullable=True)
    Updated_By = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='SET NULL'), nullable=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def set_password(self, raw_password: str):
        salt = bcrypt.gensalt()
        self.Password_Hash = bcrypt.hashpw(raw_password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, raw_password: str) -> bool:
        if not self.Password_Hash:
            return False
        return bcrypt.checkpw(raw_password.encode('utf-8'), self.Password_Hash.encode('utf-8'))

    def get_ukm(self):
        """
        Mengekstrak nama UKM dari kolom Job_Desc (format: 'UKM ... - Divisi ...' atau 'UKM ...').
        Mengembalikan None jika akun belum terikat pada UKM spesifik.
        """
        raw = (self.Job_Desc or '').strip()
        if not raw:
            return None
        for ukm_name in VALID_UKM_LIST:
            if raw.lower().startswith(ukm_name.lower()):
                return ukm_name
        if ' - ' in raw:
            prefix = raw.split(' - ', 1)[0].strip()
            if prefix.upper().startswith('UKM'):
                return prefix
        if raw.upper().startswith('UKM '):
            return raw
        return None

    def get_divisi(self):
        """
        Mengekstrak nama Divisi / Jabatan tanpa prefix UKM.
        """
        raw = (self.Job_Desc or '').strip()
        if not raw:
            return self.Role
        if ' - ' in raw:
            prefix, rest = raw.split(' - ', 1)
            if prefix.strip().upper().startswith('UKM'):
                return rest.strip()
        return raw

    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.ID,
            'nama': self.Nama,
            'nim': self.NIM,
            'email': self.Email,
            'role': self.Role,
            'job_desc': self.Job_Desc,
            'ukm': self.get_ukm(),
            'divisi': self.get_divisi(),
            'status_keanggotaan': self.Status_Keanggotaan,
            'created_at': self.Created_At.strftime('%Y-%m-%d %H:%M:%S') if self.Created_At else None,
            'created_by': self.Created_By,
            'updated_by': self.Updated_By
        }
        if include_sensitive:
            data['password_hash'] = self.Password_Hash
        return data

    def __repr__(self):
        return f"<User {self.ID} - {self.Email} ({self.Role})>"
