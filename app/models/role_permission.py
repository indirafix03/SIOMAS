from app.extensions import db

class RolePermission(db.Model):
    __tablename__ = 'role_permissions'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Role_Name = db.Column(db.Enum('Admin', 'Pengurus', 'Anggota', name='role_permission_enum'), nullable=False)
    Permission_ID = db.Column(db.Integer, db.ForeignKey('permissions.ID', ondelete='CASCADE'), nullable=True)

    permission = db.relationship('Permission', backref=db.backref('role_permissions', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.ID,
            'role_name': self.Role_Name,
            'permission_id': self.Permission_ID,
            'nama_akses': self.permission.Nama_Akses if self.permission else None,
            'deskripsi': self.permission.Deskripsi if self.permission else None
        }

    def __repr__(self):
        return f"<RolePermission {self.Role_Name} -> {self.Permission_ID}>"
