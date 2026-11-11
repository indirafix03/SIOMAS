from app.extensions import db
from app.utils.datetime_helper import utc_now

class EmailLog(db.Model):
    __tablename__ = 'email_logs'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Announcement_ID = db.Column(db.Integer, db.ForeignKey('announcements.ID', ondelete='CASCADE'), nullable=True)
    User_ID = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='CASCADE'), nullable=True)
    Attempt_Number = db.Column(db.Integer, nullable=True)
    Sent_At = db.Column(db.DateTime, default=utc_now)
    Status_Pengiriman = db.Column(db.Enum('Terkirim', 'Gagal', name='status_pengiriman_enum'), nullable=False)

    recipient = db.relationship('User', foreign_keys=[User_ID], backref='email_logs_received')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        sent_str = self.Sent_At.strftime('%Y-%m-%d %H:%M:%S') if self.Sent_At else None
        title = self.announcement.Judul if self.announcement else 'Notifikasi Sistem SIOMAS'
        email = self.recipient.Email if self.recipient else '-'
        attempt = self.Attempt_Number or 1
        return {
            'id': self.ID,
            'announcement_id': self.Announcement_ID,
            'announcement_title': title,
            'subjek': f"[Attempt-{attempt}] {title}",
            'user_id': self.User_ID,
            'recipient_name': self.recipient.Nama if self.recipient else None,
            'recipient_email': email,
            'email_tujuan': email,
            'attempt_number': attempt,
            'retry_count': attempt,
            'sent_at': sent_str,
            'waktu_kirim': sent_str,
            'status_pengiriman': self.Status_Pengiriman,
            'status_kirim': self.Status_Pengiriman
        }

    def __repr__(self):
        return f"<EmailLog {self.ID} - Announce {self.Announcement_ID} -> User {self.User_ID} ({self.Status_Pengiriman})>"
