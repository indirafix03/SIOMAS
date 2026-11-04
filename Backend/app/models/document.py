from app.extensions import db

class Document(db.Model):
    __tablename__ = 'documents'

    ID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Nama_Berkas = db.Column(db.String(255), nullable=False)
    Kategori = db.Column(db.Enum('LPJ', 'Proposal', 'Sipakamase', 'Surat', name='kategori_dokumen_enum'), nullable=False)
    Path_File = db.Column(db.String(255), nullable=False)
    Status = db.Column(db.Enum('Draft', 'Approved', 'Revisi', name='status_dokumen_enum'), default='Draft')
    Is_Deleted = db.Column(db.Boolean, default=False)
    Uploaded_By = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='SET NULL'), nullable=True)
    Approved_By = db.Column(db.Integer, db.ForeignKey('users.ID', ondelete='SET NULL'), nullable=True)

    uploader = db.relationship('User', foreign_keys=[Uploaded_By], backref='uploaded_documents')
    approver = db.relationship('User', foreign_keys=[Approved_By], backref='approved_documents')

    def to_dict(self):
        return {
            'id': self.ID,
            'nama_berkas': self.Nama_Berkas,
            'kategori': self.Kategori,
            'path_file': self.Path_File,
            'status': self.Status,
            'is_deleted': bool(self.Is_Deleted),
            'uploaded_by': self.Uploaded_By,
            'uploader_name': self.uploader.Nama if self.uploader else None,
            'approved_by': self.Approved_By,
            'approver_name': self.approver.Nama if self.approver else None
        }

    def __repr__(self):
        return f"<Document {self.ID} - {self.Nama_Berkas} ({self.Kategori}, {self.Status})>"
