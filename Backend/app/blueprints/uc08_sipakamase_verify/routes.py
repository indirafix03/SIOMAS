from flask import Blueprint, request
from app.extensions import db
from app.models.document import Document
from app.middleware.auth_middleware import get_current_user, permission_required
from app.middleware.audit_logger import log_audit
from app.utils.file_handler import allowed_file, save_uploaded_file
from app.utils.response import success_response, error_response

sipakamase_verify_bp = Blueprint('uc08_sipakamase_verify', __name__, url_prefix='/api/v1/sipakamase')

@sipakamase_verify_bp.route('', methods=['GET'])
@permission_required('unggah_dokumen')
def list_sipakamase_docs():
    """
    Daftar Dokumen Sipakamase
    ---
    tags:
      - "UC-08: Verifikasi Dokumen Sipakamase"
    summary: Mengambil daftar dokumen Sipakamase dan status verifikasinya
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: status
        type: string
        enum: [Draft, Approved, Revisi]
      - in: query
        name: search
        type: string
    responses:
      200:
        description: Daftar dokumen Sipakamase berhasil diambil
    """
    status_filter = request.args.get('status')
    search = request.args.get('search')

    query = Document.query.filter_by(Kategori='Sipakamase', Is_Deleted=False)

    if status_filter:
        query = query.filter_by(Status=status_filter)
    if search:
        query = query.filter(Document.Nama_Berkas.ilike(f"%{search}%"))

    docs = query.order_by(Document.ID.desc()).all()

    return success_response(
        data=[d.to_dict() for d in docs],
        total=len(docs),
        message="Daftar dokumen Sipakamase berhasil diambil"
    )


@sipakamase_verify_bp.route('/upload', methods=['POST'])
@permission_required('unggah_dokumen')
def upload_sipakamase_doc():
    """
    Unggah Dokumen Sipakamase
    ---
    tags:
      - "UC-08: Verifikasi Dokumen Sipakamase"
    summary: Mengunggah berkas dokumen Sipakamase untuk diverifikasi
    security:
      - BearerAuth: []
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: file
        type: file
        required: true
      - in: formData
        name: nama_berkas
        type: string
        required: true
    responses:
      201:
        description: Dokumen Sipakamase berhasil diunggah
      400:
        description: File tidak valid
    """
    user = get_current_user()

    if 'file' not in request.files:
        return error_response("File dokumen Sipakamase wajib disertakan", 400)

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return error_response("File tidak valid atau format tidak didukung", 400)

    nama_berkas = request.form.get('nama_berkas', file.filename).strip()

    relative_path = save_uploaded_file(file, category='sipakamase')

    doc = Document(
        Nama_Berkas=nama_berkas,
        Kategori='Sipakamase',
        Path_File=relative_path,
        Status='Draft',
        Is_Deleted=False,
        Uploaded_By=user.ID
    )
    db.session.add(doc)
    db.session.commit()

    log_audit("UPLOAD_SIPAKAMASE", "Sipakamase", f"Dokumen Sipakamase diunggah: '{nama_berkas}' (ID: {doc.ID})")

    return success_response(
        data=doc.to_dict(),
        message="Dokumen Sipakamase berhasil diunggah dan siap diverifikasi",
        code=201
    )


@sipakamase_verify_bp.route('/<int:document_id>/verify', methods=['POST'])
@permission_required('setujui_dokumen')
def verify_sipakamase_doc(document_id):
    """
    Verifikasi Dokumen Sipakamase
    ---
    tags:
      - "UC-08: Verifikasi Dokumen Sipakamase"
    summary: Memverifikasi berkas Sipakamase menjadi Approved atau Revisi (Admin Only)
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: document_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - status
          properties:
            status:
              type: string
              enum: [Approved, Revisi]
              example: Approved
            catatan:
              type: string
              example: Dokumen telah sesuai dengan standar pedoman Sipakamase organisasi.
    responses:
      200:
        description: Verifikasi dokumen Sipakamase berhasil
      400:
        description: Status verifikasi tidak valid
      404:
        description: Dokumen tidak ditemukan
    """
    user = get_current_user()
    doc = db.session.get(Document, document_id)
    if not doc or doc.Kategori != 'Sipakamase' or doc.Is_Deleted:
        return error_response("Dokumen Sipakamase tidak ditemukan", 404)

    data = request.get_json() or {}
    new_status = data.get('status')
    catatan = data.get('catatan', '').strip()

    if new_status not in ('Approved', 'Revisi'):
        return error_response("Status verifikasi harus 'Approved' atau 'Revisi'", 400)

    doc.Status = new_status
    doc.Approved_By = user.ID
    db.session.commit()

    detail_log = f"Dokumen Sipakamase '{doc.Nama_Berkas}' diverifikasi menjadi {new_status}"
    if catatan:
        detail_log += f". Catatan: {catatan}"

    log_audit("VERIFY_SIPAKAMASE", "Sipakamase", detail_log)

    return success_response(
        data={
            "document": doc.to_dict(),
            "catatan": catatan
        },
        message=f"Dokumen Sipakamase berhasil diverifikasi menjadi '{new_status}'"
    )
