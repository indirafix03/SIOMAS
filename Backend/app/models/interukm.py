from app.extensions import db
from app.utils.datetime_helper import utc_now

class InterUKMPost(db.Model):
    __tablename__ = 'interukm_posts'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    UKM_Pengirim = db.Column(db.String(255), nullable=False)
    Judul = db.Column(db.String(255), nullable=False)
    Isi_Pengumuman = db.Column(db.Text, nullable=False)
    Status_Persetujuan = db.Column(db.String(255), nullable=False, default='Pending')
    Date = db.Column(db.DateTime, default=utc_now)
    Created_By = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='SET NULL'), nullable=True)
    Approved_By = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='SET NULL'), nullable=True)

    creator = db.relationship('User', foreign_keys=[Created_By], backref='interukm_created')
    approver = db.relationship('User', foreign_keys=[Approved_By], backref='interukm_approved')

    def to_dict(self):
        return {
            'id': self.ID,
            'ukm_pengirim': self.UKM_Pengirim,
            'judul': self.Judul,
            'isi_pengumuman': self.Isi_Pengumuman,
            'status_persetujuan': self.Status_Persetujuan,
            'date': self.Date.strftime('%Y-%m-%d %H:%M:%S') if self.Date else None,
            'created_by': self.Created_By,
            'created_by_name': self.creator.Nama if self.creator else None,
            'approved_by': self.Approved_By,
            'approver_name': self.approver.Nama if self.approver else None
        }

    def __repr__(self):
        return f"<InterUKMPost {self.ID} - {self.Judul} ({self.Status_Persetujuan})>"
