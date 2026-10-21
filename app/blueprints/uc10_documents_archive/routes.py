import os
from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.document import Document
from app.middleware.auth_middleware import get_current_user, permission_required, role_required
from app.middleware.audit_logger import log_audit
from app.utils.file_handler import allowed_file, save_uploaded_file, get_absolute_file_path
from app.utils.response import success_response, error_response

documents_archive_bp = Blueprint('uc10_documents_archive', __name__, url_prefix='/api/v1/documents')

@documents_archive_bp.route('', methods=['GET'])
@jwt_required()
def list_archived_documents():
    """
    Daftar Arsip Dokumen Organisasi
    ---
    tags:
      - "UC-10: Arsip Dokumen"
    summary: Mengambil dan mencari arsip dokumen (LPJ, Proposal, Sipakamase, Surat)
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: kategori
        type: string
        enum: [LPJ, Proposal, Sipakamase, Surat]
        description: Filter kategori dokumen
      - in: query
        name: status
        type: string
        enum: [Draft, Approved, Revisi]
        description: Filter status persetujuan
      - in: query
        name: search
        type: string
        description: Cari nama berkas
    responses:
      200:
        description: Arsip dokumen berhasil diambil
    """
    kategori = request.args.get('kategori')
    status = request.args.get('status')
    search = request.args.get('search')

    query = Document.query.filter_by(Is_Deleted=False)

    if kategori and kategori in ('LPJ', 'Proposal', 'Sipakamase', 'Surat'):
        query = query.filter(Document.Kategori == kategori)

    if status and status in ('Draft', 'Approved', 'Revisi'):
        query = query.filter(Document.Status == status)

    if search:
        query = query.filter(Document.Nama_Berkas.ilike(f"%{search}%"))

    documents = query.order_by(Document.ID.desc()).all()

    return success_response(
        data=[d.to_dict() for d in documents],
        total=len(documents),
        message="Arsip dokumen berhasil diambil"
    )


@documents_archive_bp.route('/<int:document_id>', methods=['GET'])
@jwt_required()
def get_document_detail(document_id):
    """
    Detail Metadata Dokumen
    ---
    tags:
      - "UC-10: Arsip Dokumen"
    summary: Mengambil detail informasi berkas dokumen
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
    if not doc or doc.Is_Deleted:
        return error_response("Dokumen tidak ditemukan", 404)

    return success_response(data=doc.to_dict())


@documents_archive_bp.route('/<int:document_id>/download', methods=['GET'])
@jwt_required()
def download_document(document_id):
    """
    Unduh Berkas Dokumen
    ---
    tags:
      - "UC-10: Arsip Dokumen"
    summary: Mengunduh file berkas dokumen dari penyimpanan server
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: document_id
        type: integer
        required: true
    responses:
      200:
        description: Pengiriman file berhasil
      404:
        description: Dokumen atau file fisik tidak ditemukan
    """
    doc = db.session.get(Document, document_id)
    if not doc or doc.Is_Deleted:
        return error_response("Dokumen tidak ditemukan", 404)

    abs_path = get_absolute_file_path(doc.Path_File)
    if not os.path.exists(abs_path):
        return error_response(f"File fisik '{doc.Nama_Berkas}' tidak ditemukan di penyimpanan server", 404)

    user = get_current_user()
    log_audit("DOWNLOAD_DOCUMENT", "Arsip Dokumen", f"File diunduh: '{doc.Nama_Berkas}' (ID: {doc.ID})")

    download_name = doc.Nama_Berkas
    # Ensure it keeps proper file extension if missing from Nama_Berkas
    _, ext = os.path.splitext(doc.Path_File)
    if ext and not download_name.lower().endswith(ext.lower()):
        download_name += ext

    return send_file(abs_path, as_attachment=True, download_name=download_name)


@documents_archive_bp.route('/upload', methods=['POST'])
@permission_required('unggah_dokumen')
def upload_general_document():
    """
    Unggah Berkas Baru ke Arsip
    ---
    tags:
      - "UC-10: Arsip Dokumen"
    summary: Mengunggah berkas kategori Proposal, Surat, dsb.
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
      - in: formData
        name: kategori
        type: string
        enum: [LPJ, Proposal, Sipakamase, Surat]
        required: true
    responses:
      201:
        description: Dokumen berhasil diunggah ke arsip
      400:
        description: Input tidak valid
    """
    user = get_current_user()

    if 'file' not in request.files:
        return error_response("File dokumen wajib disertakan", 400)

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return error_response("File tidak valid atau format tidak didukung", 400)

    kategori = request.form.get('kategori', '').strip()
    if kategori not in ('LPJ', 'Proposal', 'Sipakamase', 'Surat'):
        return error_response("Kategori harus salah satu dari: LPJ, Proposal, Sipakamase, Surat", 400)

    nama_berkas = request.form.get('nama_berkas', file.filename).strip()
    if not nama_berkas:
        nama_berkas = file.filename

    relative_path = save_uploaded_file(file, category=kategori.lower())

    doc = Document(
        Nama_Berkas=nama_berkas,
        Kategori=kategori,
        Path_File=relative_path,
        Status='Draft',
        Is_Deleted=False,
        Uploaded_By=user.ID
    )
    db.session.add(doc)
    db.session.commit()

    log_audit("UPLOAD_DOCUMENT", "Arsip Dokumen", f"Dokumen diunggah ke kategori '{kategori}': '{nama_berkas}' (ID: {doc.ID})")

    return success_response(
        data=doc.to_dict(),
        message=f"Dokumen berhasil diunggah ke kategori {kategori}",
        code=201
    )


@documents_archive_bp.route('/<int:document_id>', methods=['DELETE'])
@permission_required('setujui_dokumen')
def delete_document(document_id):
    """
    Hapus Dokumen (Soft Delete)
    ---
    tags:
      - "UC-10: Arsip Dokumen"
    summary: Menandai dokumen sebagai terhapus (Is_Deleted=1) (Admin Only)
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: document_id
        type: integer
        required: true
    responses:
      200:
        description: Dokumen berhasil dihapus
      404:
        description: Dokumen tidak ditemukan
    """
    doc = db.session.get(Document, document_id)
    if not doc or doc.Is_Deleted:
        return error_response("Dokumen tidak ditemukan", 404)

    doc.Is_Deleted = True
    db.session.commit()

    log_audit("DELETE_DOCUMENT", "Arsip Dokumen", f"Dokumen dihapus: '{doc.Nama_Berkas}' (ID: {document_id})")

    return success_response(message=f"Dokumen '{doc.Nama_Berkas}' berhasil dihapus dari arsip aktif")
