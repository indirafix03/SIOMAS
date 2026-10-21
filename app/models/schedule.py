from app.extensions import db

class Schedule(db.Model):
    __tablename__ = 'schedules'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Judul_Kegiatan = db.Column(db.String(255), nullable=False)
    Kategori = db.Column(db.String(100), nullable=True)
    Waktu = db.Column(db.DateTime, nullable=False)
    Lokasi = db.Column(db.String(255), nullable=True)
    Keterangan = db.Column(db.Text, nullable=True)
    Divisi_ID = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='SET NULL'), nullable=True)
    Updated_By = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='SET NULL'), nullable=True)

    division_pic = db.relationship('User', foreign_keys=[Divisi_ID], backref='schedules_in_charge')
    updater = db.relationship('User', foreign_keys=[Updated_By], backref='schedules_updated')

    def to_dict(self):
        return {
            'id': self.ID,
            'judul_kegiatan': self.Judul_Kegiatan,
            'kategori': self.Kategori,
            'waktu': self.Waktu.strftime('%Y-%m-%d %H:%M:%S') if self.Waktu else None,
            'lokasi': self.Lokasi,
            'keterangan': self.Keterangan,
            'divisi_id': self.Divisi_ID,
            'divisi_pic_name': self.division_pic.Nama if self.division_pic else None,
            'updated_by': self.Updated_By,
            'updated_by_name': self.updater.Nama if self.updater else None
        }

    def __repr__(self):
        return f"<Schedule {self.ID} - {self.Judul_Kegiatan}>"
