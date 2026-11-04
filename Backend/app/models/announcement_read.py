from datetime import datetime
from app.extensions import db

class AnnouncementRead(db.Model):
    __tablename__ = 'announcement_reads'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Announcement_ID = db.Column(db.Integer, db.ForeignKey('announcements.ID', ondelete='CASCADE'), nullable=True)
    User_ID = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='CASCADE'), nullable=True)
    Is_Read = db.Column(db.Boolean, default=False)
    Read_At = db.Column(db.DateTime, nullable=True)

    user = db.relationship('User', backref=db.backref('announcement_reads', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.ID,
            'announcement_id': self.Announcement_ID,
            'user_id': self.User_ID,
            'user_name': self.user.Nama if self.user else None,
            'user_email': self.user.Email if self.user else None,
            'is_read': bool(self.Is_Read),
            'read_at': self.Read_At.strftime('%Y-%m-%d %H:%M:%S') if self.Read_At else None
        }

    def __repr__(self):
        return f"<AnnouncementRead {self.Announcement_ID} - User {self.User_ID}: {self.Is_Read}>"
