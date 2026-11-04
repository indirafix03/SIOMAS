from app.extensions import db
from app.utils.datetime_helper import utc_now

class Announcement(db.Model):
    __tablename__ = 'announcements'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Judul = db.Column(db.String(255), nullable=False)
    Isi = db.Column(db.Text, nullable=False)
    Is_Important = db.Column(db.Boolean, default=False)
    Created_By = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='CASCADE'), nullable=True)
    Created_At = db.Column(db.DateTime, default=utc_now)
    Updated_By = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='SET NULL'), nullable=True)

    creator = db.relationship('User', foreign_keys=[Created_By], backref='created_announcements')
    updater = db.relationship('User', foreign_keys=[Updated_By], backref='updated_announcements')
    reads = db.relationship('AnnouncementRead', backref='announcement', cascade='all, delete-orphan', lazy='dynamic')
    email_logs = db.relationship('EmailLog', backref='announcement', cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self, current_user_id=None):
        is_read = False
        read_at = None
        if current_user_id:
            read_record = self.reads.filter_by(User_ID=current_user_id).first()
            if read_record:
                is_read = bool(read_record.Is_Read)
                read_at = read_record.Read_At.strftime('%Y-%m-%d %H:%M:%S') if read_record.Read_At else None

        return {
            'id': self.ID,
            'judul': self.Judul,
            'isi': self.Isi,
            'is_important': bool(self.Is_Important),
            'created_by': self.Created_By,
            'created_by_name': self.creator.Nama if self.creator else None,
            'created_at': self.Created_At.strftime('%Y-%m-%d %H:%M:%S') if self.Created_At else None,
            'updated_by': self.Updated_By,
            'updated_by_name': self.updater.Nama if self.updater else None,
            'is_read': is_read,
            'read_at': read_at
        }

    def __repr__(self):
        return f"<Announcement {self.ID} - {self.Judul}>"
