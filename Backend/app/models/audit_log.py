from app.extensions import db
from app.utils.datetime_helper import utc_now

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    User_ID = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='SET NULL'), nullable=True)
    Aksi = db.Column(db.String(100), nullable=False)
    Modul = db.Column(db.String(100), nullable=False)
    Detail = db.Column(db.Text, nullable=True)
    IP_Address = db.Column(db.String(45), nullable=True)
    User_Agent = db.Column(db.String(255), nullable=True)
    Created_At = db.Column(db.DateTime, default=utc_now)

    user = db.relationship('User', foreign_keys=[User_ID], backref='audit_logs')

    def to_dict(self):
        return {
            'id': self.ID,
            'user_id': self.User_ID,
            'user_name': self.user.Nama if self.user else None,
            'user_email': self.user.Email if self.user else None,
            'user_role': self.user.Role if self.user else None,
            'aksi': self.Aksi,
            'modul': self.Modul,
            'detail': self.Detail,
            'ip_address': self.IP_Address,
            'user_agent': self.User_Agent,
            'created_at': self.Created_At.strftime('%Y-%m-%d %H:%M:%S') if self.Created_At else None
        }

    def __repr__(self):
        return f"<AuditLog {self.ID} - {self.Modul}:{self.Aksi} by User {self.User_ID}>"
