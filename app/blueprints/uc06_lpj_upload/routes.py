from flask import Blueprint, request
from app.extensions import db
from app.models.document import Document
from app.middleware.auth_middleware import get_current_user, permission_required
from app.middleware.audit_logger import log_audit
from app.utils.file_handler import allowed_file, save_uploaded_file
from app.utils.response import success_response, error_response

lpj_upload_bp = Blueprint('uc06_lpj_upload', __name__, url_prefix='/api/v1/lpj')

@lpj_upload_bp.route('/upload', methods=['POST'])
@permission_required('unggah_dokumen')
def upload_draft_lpj():
    """
    Unggah Draft LPJ (Laporan Pertanggungjawaban)
    ---
    tags:
      - "UC-06: Unggah Draft LPJ"
    summary: Mengunggah file berkas draft LPJ baru
    security:
      - BearerAuth: []
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
        description: File LPJ (.pdf, .doc, .docx, .zip)
      - in: formData
        name: nama_berkas
        type: string
        required: true
        description: Judul/nama berkas LPJ
    responses:
      201:
        description: Draft LPJ berhasil diunggah
      400:
        description: File tidak ada atau format tidak didukung
    """
    user = get_current_user()

    if 'file' not in request.files:
        return error_response("File dokumen LPJ wajib disertakan", 400)

    file = request.files['file']
    if file.filename == '':
        return error_response("File tidak boleh kosong", 400)

    if not allowed_file(file.filename):
        return error_response("Format file tidak didukung. Ekstensi yang diizinkan: pdf, doc, docx, xlsx, zip", 400)

    nama_berkas = request.form.get('nama_berkas', '').strip()
    if not nama_berkas:
        nama_berkas = file.filename

    # Save to uploads/lpj
    relative_path = save_uploaded_file(file, category='lpj')

    doc = Document(
        Nama_Berkas=nama_berkas,
        Kategori='LPJ',
        Path_File=relative_path,
        Status='Draft',
        Is_Deleted=False,
        Uploaded_By=user.ID
    )
    db.session.add(doc)
    db.session.commit()

    log_audit("UPLOAD_LPJ", "Dokumen LPJ", f"Draft LPJ diunggah: '{nama_berkas}' (ID: {doc.ID})")

    return success_response(
        data=doc.to_dict(),
        message="Draft LPJ berhasil diunggah dan menunggu validasi",
        code=201
    )


@lpj_upload_bp.route('/my-submissions', methods=['GET'])
@permission_required('unggah_dokumen')
def list_my_lpj():
    """
    Daftar Draft LPJ Saya
    ---
    tags:
      - "UC-06: Unggah Draft LPJ"
    summary: Mengambil daftar LPJ yang pernah diunggah oleh pengguna saat ini
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: status
        type: string
        enum: [Draft, Approved, Revisi]
        description: Filter status LPJ
    responses:
      200:
        description: Daftar LPJ berhasil diambil
    """
    user = get_current_user()
    status_filter = request.args.get('status')

    query = Document.query.filter_by(
        Uploaded_By=user.ID,
        Kategori='LPJ',
        Is_Deleted=False
    )

    if status_filter:
        query = query.filter_by(Status=status_filter)

    documents = query.order_by(Document.ID.desc()).all()

    return success_response(
        data=[d.to_dict() for d in documents],
        total=len(documents),
        message="Daftar LPJ Anda berhasil diambil"
    )


@lpj_upload_bp.route('/<int:document_id>', methods=['GET'])
@permission_required('unggah_dokumen')
def get_lpj_detail(document_id):
    """
    Detail LPJ
    ---
    tags:
      - "UC-06: Unggah Draft LPJ"
    summary: Mengambil detail informasi dokumen LPJ
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: document_id
        type: integer
        required: true
    responses:
      200:
        description: Detail dokumen ditemukan
      404:
        description: Dokumen tidak ditemukan
    """
    doc = db.session.get(Document, document_id)
    if not doc or doc.Kategori != 'LPJ' or doc.Is_Deleted:
        return error_response("Dokumen LPJ tidak ditemukan", 404)

    return success_response(data=doc.to_dict())


@lpj_upload_bp.route('/<int:document_id>', methods=['PUT'])
@permission_required('unggah_dokumen')
def update_lpj_submission(document_id):
    """
    Revisi / Update Berkas LPJ
    ---
    tags:
      - "UC-06: Unggah Draft LPJ"
    summary: Memperbarui draft atau mengunggah ulang file revisi LPJ
    security:
      - BearerAuth: []
    consumes:
      - multipart/form-data
    parameters:
      - in: path
        name: document_id
        type: integer
        required: true
      - in: formData
        name: file
        type: file
        description: File pengganti (opsional)
      - in: formData
        name: nama_berkas
        type: string
        description: Judul/nama berkas baru (opsional)
    responses:
      200:
        description: Berkas LPJ berhasil diperbarui
      403:
        description: LPJ sudah disetujui atau bukan pemilik berkas
    """
    user = get_current_user()
    doc = db.session.get(Document, document_id)
    if not doc or doc.Kategori != 'LPJ' or doc.Is_Deleted:
        return error_response("Dokumen LPJ tidak ditemukan", 404)

    # Only uploader or admin can update
    if doc.Uploaded_By != user.ID and user.Role != 'Admin':
        return error_response("Anda tidak memiliki akses untuk mengubah berkas ini", 403)

    if doc.Status == 'Approved':
        return error_response("Dokumen LPJ yang sudah disetujui (Approved) tidak dapat diubah lagi", 400)

    nama_berkas = request.form.get('nama_berkas')
    if nama_berkas and nama_berkas.strip():
        doc.Nama_Berkas = nama_berkas.strip()

    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename != '':
            if not allowed_file(file.filename):
                return error_response("Format file tidak didukung", 400)
            relative_path = save_uploaded_file(file, category='lpj')
            doc.Path_File = relative_path
            # Reset status to draft for re-review
            doc.Status = 'Draft'

    db.session.commit()

    log_audit("UPDATE_LPJ", "Dokumen LPJ", f"LPJ diperbarui/diunggah ulang: '{doc.Nama_Berkas}' (ID: {doc.ID})")

    return success_response(
        data=doc.to_dict(),
        message="Berkas LPJ berhasil diperbarui dan diajukan ulang untuk validasi"
    )
