from app.extensions import db

class Permission(db.Model):
    __tablename__ = 'permissions'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Nama_Akses = db.Column(db.String(100), unique=True, nullable=False)
    Deskripsi = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.ID,
            'nama_akses': self.Nama_Akses,
            'deskripsi': self.Deskripsi
        }

    def __repr__(self):
        return f"<Permission {self.ID} - {self.Nama_Akses}>"
