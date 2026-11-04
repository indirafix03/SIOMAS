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
        catatan_revisi = None
        if self.Status in ('Revisi', 'Approved'):
            try:
                from app.models.audit_log import AuditLog
                latest_log = (
                    AuditLog.query
                    .filter(
                        AuditLog.Aksi.in_(['VALIDATE_LPJ', 'VERIFY_SIPAKAMASE']),
                        AuditLog.Detail.ilike(f"%'{self.Nama_Berkas}'%")
                    )
                    .order_by(AuditLog.ID.desc())
                    .first()
                )
                if latest_log and latest_log.Detail and 'Catatan:' in latest_log.Detail:
                    catatan_revisi = latest_log.Detail.split('Catatan:', 1)[1].strip()
            except Exception:
                catatan_revisi = None

        return {
            'id': self.ID,
            'nama_berkas': self.Nama_Berkas,
            'kategori': self.Kategori,
            'path_file': self.Path_File,
            'status': self.Status,
            'catatan_revisi': catatan_revisi,
            'is_deleted': bool(self.Is_Deleted),
            'uploaded_by': self.Uploaded_By,
            'uploader_name': self.uploader.Nama if self.uploader else None,
            'approved_by': self.Approved_By,
            'approver_name': self.approver.Nama if self.approver else None
        }

    def __repr__(self):
        return f"<Document {self.ID} - {self.Nama_Berkas} ({self.Kategori}, {self.Status})>"
