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

    def to_dict(self):
        return {
            'id': self.ID,
            'announcement_id': self.Announcement_ID,
            'announcement_title': self.announcement.Judul if self.announcement else None,
            'user_id': self.User_ID,
            'recipient_name': self.recipient.Nama if self.recipient else None,
            'recipient_email': self.recipient.Email if self.recipient else None,
            'attempt_number': self.Attempt_Number,
            'sent_at': self.Sent_At.strftime('%Y-%m-%d %H:%M:%S') if self.Sent_At else None,
            'status_pengiriman': self.Status_Pengiriman
        }

    def __repr__(self):
        return f"<EmailLog {self.ID} - Announce {self.Announcement_ID} -> User {self.User_ID} ({self.Status_Pengiriman})>"
