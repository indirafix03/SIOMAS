import io
import os
import uuid
import zipfile
from flask import Blueprint, request, current_app, send_from_directory, send_file
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models.document import Document
from app.middleware.auth_middleware import get_current_user, permission_required
from app.middleware.audit_logger import log_audit
from app.utils.response import success_response, error_response
from app.utils.file_handler import allowed_file
from app.utils.datetime_helper import utc_now

documents_archive_bp = Blueprint(
    'uc10_documents_archive',
    __name__,
    url_prefix='/api/v1/documents'
)

VALID_CATEGORIES = ('LPJ', 'Proposal', 'Surat', 'Sipakamase')
VALID_STATUSES = ('Draft', 'Revisi', 'Approved')

@documents_archive_bp.route('', methods=['GET'])
@permission_required('lihat_dokumen')
def list_documents():
    """
    Daftar Arsip Dokumen Organisasi
    ---
    tags:
      - "UC-10: Arsip Dokumen Organisasi"
    summary: Mengambil daftar seluruh dokumen aktif berdasarkan kategori dan status
    security:
      - BearerAuth: []
    """
    kategori = request.args.get('kategori')
    status = request.args.get('status')
    search = request.args.get('search')
    include_deleted = request.args.get('include_deleted', 'false').lower() in ('true', '1')

    query = Document.query
    if not include_deleted:
        query = query.filter(Document.Is_Deleted == False)

    if kategori:
        query = query.filter(Document.Kategori == kategori)
    if status:
        query = query.filter(Document.Status == status)
    if search:
        query = query.filter(Document.Nama_Berkas.ilike(f"%{search}%"))

    docs = query.order_by(Document.ID.desc()).all()
    user = get_current_user()
    actor_ukm = user.get_ukm() if user else None
    if actor_ukm:
        docs = [d for d in docs if not d.uploader or d.uploader.get_ukm() in (None, actor_ukm)]

    return success_response(
        data=[d.to_dict() for d in docs],
        total=len(docs),
        message="Daftar arsip dokumen berhasil diambil"
    )


@documents_archive_bp.route('/bundle', methods=['GET'])
@permission_required('lihat_dokumen')
def download_documents_bundle():
    """
    Unduh Bundel Dokumen (.ZIP) - UC-10 Sequence 5
    ---
    tags:
      - "UC-10: Arsip Dokumen Organisasi"
    summary: Mengompresi dan mengunduh kumpulan dokumen organisasi (misal Sipakamase / LPJ) dalam satu bundel arsip .ZIP
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: kategori
        type: string
        enum: [LPJ, Proposal, Surat, Sipakamase]
        description: Filter kategori dokumen yang akan dibundel (kosongkan untuk semua kategori)
      - in: query
        name: status
        type: string
        enum: [Draft, Revisi, Approved]
        description: Filter status dokumen
    responses:
      200:
        description: File bundel .ZIP berhasil diunduh
    """
    kategori = request.args.get('kategori')
    status = request.args.get('status')

    query = Document.query.filter(Document.Is_Deleted == False)
    if kategori and kategori in VALID_CATEGORIES:
        query = query.filter(Document.Kategori == kategori)
    if status and status in VALID_STATUSES:
        query = query.filter(Document.Status == status)

    docs = query.order_by(Document.ID.asc()).all()
    user = get_current_user()
    actor_ukm = user.get_ukm() if user else None
    if actor_ukm:
        docs = [d for d in docs if not d.uploader or d.uploader.get_ukm() in (None, actor_ukm)]
    if not docs and kategori:
        # Fallback ke seluruh dokumen aktif di UKM yang sama bila kategori spesifik kosong
        docs = Document.query.filter(Document.Is_Deleted == False).order_by(Document.ID.asc()).all()
        if actor_ukm:
            docs = [d for d in docs if not d.uploader or d.uploader.get_ukm() in (None, actor_ukm)]

    upload_folder = current_app.config['UPLOAD_FOLDER']
    memory_file = io.BytesIO()

    manifest_lines = [
        "====================================================================",
        "               MANIFEST BUNDEL ARSIP DOKUMEN SIOMAS                 ",
        "====================================================================",
        f"Waktu Unduh   : {utc_now().strftime('%Y-%m-%d %H:%M:%S')} UTC",
        f"Filter Kat.   : {kategori or 'Semua Kategori'}",
        f"Total Berkas  : {len(docs)}",
        "--------------------------------------------------------------------"
    ]

    with zipfile.ZipFile(memory_file, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
        for idx, doc in enumerate(docs, start=1):
            safe_title = secure_filename(doc.Nama_Berkas) or f"Dokumen_{doc.ID}"
            stored_filename = os.path.basename(doc.File_URL) if doc.File_URL else ""
            _, ext = os.path.splitext(stored_filename)
            if not ext:
                ext = ".pdf"
            if not safe_title.lower().endswith(ext.lower()):
                arcname = f"{doc.Kategori}/{doc.ID:03d}_{safe_title}{ext}"
            else:
                arcname = f"{doc.Kategori}/{doc.ID:03d}_{safe_title}"

            file_path = os.path.join(upload_folder, stored_filename) if stored_filename else ""
            if file_path and os.path.isfile(file_path):
                zf.write(file_path, arcname=arcname)
                source_status = "Berkas Fisik Tersedia"
            else:
                placeholder_content = (
                    f"DOKUMEN ARSIP SIOMAS\n"
                    f"ID Dokumen   : {doc.ID}\n"
                    f"Nama Berkas  : {doc.Nama_Berkas}\n"
                    f"Kategori     : {doc.Kategori}\n"
                    f"Status       : {doc.Status}\n"
                    f"Pengunggah   : {doc.uploader.Nama if doc.uploader else '-'}\n"
                    f"Path Referensi: {doc.File_URL}\n"
                )
                zf.writestr(f"{arcname}.txt", placeholder_content.encode('utf-8'))
                source_status = "Metadata Arsip"

            manifest_lines.append(
                f"{idx}. [ID:{doc.ID}] [{doc.Kategori}] {doc.Nama_Berkas} "
                f"(Status: {doc.Status}, Pengunggah: {doc.uploader.Nama if doc.uploader else '-'}) -> {source_status}"
            )

        manifest_lines.append("====================================================================")
        zf.writestr("MANIFEST_ARSIP_SIOMAS.txt", "\n".join(manifest_lines).encode('utf-8'))

    memory_file.seek(0)
    bundle_label = kategori if kategori else "Semua_Dokumen"
    download_filename = f"Bundel_{bundle_label}_SIOMAS.zip"

    log_audit(
        "DOWNLOAD_DOCUMENT_BUNDLE",
        "Arsip Dokumen",
        f"Mengunduh bundel ZIP '{download_filename}' ({len(docs)} berkas)",
        after={
            "bundle_name": download_filename,
            "kategori_filter": kategori or "Semua",
            "total_documents": len(docs),
            "document_ids": [d.ID for d in docs]
        }
    )

    return send_file(
        memory_file,
        mimetype='application/zip',
        as_attachment=True,
        download_name=download_filename
    )


@documents_archive_bp.route('/<int:doc_id>', methods=['GET'])
@permission_required('lihat_dokumen')
def get_document_detail(doc_id):
    """
    Detail Dokumen
    ---
    tags:
      - "UC-10: Arsip Dokumen Organisasi"
    summary: Mengambil informasi detail satu dokumen
    security:
      - BearerAuth: []
    """
    doc = db.session.get(Document, doc_id)
    if not doc or doc.Is_Deleted:
        return error_response("Dokumen tidak ditemukan", 404)

    return success_response(data=doc.to_dict(), message="Detail dokumen berhasil diambil")


@documents_archive_bp.route('/<int:doc_id>/download', methods=['GET'])
@permission_required('lihat_dokumen')
def download_document(doc_id):
    """
    Unduh Berkas Dokumen
    ---
    tags:
      - "UC-10: Arsip Dokumen Organisasi"
    summary: Mengunduh file fisik dokumen dari server
    security:
      - BearerAuth: []
    """
    doc = db.session.get(Document, doc_id)
    if not doc or doc.Is_Deleted:
        return error_response("Dokumen tidak ditemukan", 404)

    filename = os.path.basename(doc.File_URL)
    upload_folder = current_app.config['UPLOAD_FOLDER']
    file_path = os.path.join(upload_folder, filename)

    if not os.path.exists(file_path):
        return error_response(f"File fisik '{filename}' tidak ditemukan di penyimpanan server", 404)

    log_audit(
        "DOWNLOAD_DOCUMENT",
        "Arsip Dokumen",
        f"Mengunduh dokumen '{doc.Nama_Berkas}' (ID: {doc.ID})",
        after={"document_id": doc.ID, "nama_berkas": doc.Nama_Berkas, "kategori": doc.Kategori}
    )
    return send_from_directory(upload_folder, filename, as_attachment=True)


@documents_archive_bp.route('/upload', methods=['POST'])
@permission_required('unggah_lpj')
def upload_general_document():
    """
    Unggah Dokumen Baru ke Arsip (Proposal / Surat / LPJ / Sipakamase)
    ---
    tags:
      - "UC-10: Arsip Dokumen Organisasi"
    summary: Mengunggah dokumen baru beserta kategorinya ke sistem arsip
    security:
      - BearerAuth: []
    """
    user = get_current_user()
    nama_berkas = request.form.get('nama_berkas', '').strip()
    kategori = request.form.get('kategori', 'Surat').strip()

    if not nama_berkas:
        return error_response("Nama berkas wajib diisi", 400)

    if kategori not in VALID_CATEGORIES:
        return error_response(f"Kategori tidak valid. Pilih salah satu: {VALID_CATEGORIES}", 400)

    if 'file' not in request.files:
        return error_response("File dokumen wajib dilampirkan", 400)

    file = request.files['file']
    if file.filename == '':
        return error_response("Tidak ada file yang dipilih", 400)

    if not allowed_file(file.filename):
        return error_response("Ekstensi file tidak diizinkan", 400)

    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{kategori.lower()}_{uuid.uuid4().hex[:12]}.{ext}"
    safe_filename = secure_filename(unique_filename)

    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, safe_filename))

    doc = Document(
        Nama_Berkas=nama_berkas,
        Kategori=kategori,
        File_URL=f"/uploads/{safe_filename}",
        Status='Draft',
        Uploaded_By=user.ID,
        Is_Deleted=False
    )
    db.session.add(doc)
    db.session.commit()

    log_audit(
        "UPLOAD_DOCUMENT",
        "Arsip Dokumen",
        f"Unggah dokumen '{nama_berkas}' kategori {kategori} (ID: {doc.ID})",
        before=None,
        after=doc.to_dict()
    )

    return success_response(
        data=doc.to_dict(),
        message="Dokumen berhasil diunggah ke arsip",
        code=201
    )


@documents_archive_bp.route('/<int:doc_id>', methods=['PUT'])
@permission_required('kelola_dokumen')
def update_document_category(doc_id):
    """
    Ubah Metadata & Kategori Dokumen
    ---
    tags:
      - "UC-10: Arsip Dokumen Organisasi"
    summary: Mengubah nama berkas, kategori, atau status dokumen arsip
    security:
      - BearerAuth: []
    """
    user = get_current_user()
    doc = db.session.get(Document, doc_id)
    if not doc or doc.Is_Deleted:
        return error_response("Dokumen tidak ditemukan", 404)

    before_state = {
        "id": doc.ID,
        "nama_berkas": doc.Nama_Berkas,
        "kategori": doc.Kategori,
        "status": doc.Status
    }

    data = request.get_json() or {}
    if 'nama_berkas' in data and data['nama_berkas'].strip():
        doc.Nama_Berkas = data['nama_berkas'].strip()

    if 'kategori' in data:
        if data['kategori'] not in VALID_CATEGORIES:
            return error_response(f"Kategori harus salah satu dari {VALID_CATEGORIES}", 400)
        doc.Kategori = data['kategori']

    if 'status' in data:
        if data['status'] not in VALID_STATUSES:
            return error_response(f"Status harus salah satu dari {VALID_STATUSES}", 400)
        doc.Status = data['status']

    doc.Updated_By = user.ID
    doc.Updated_At = utc_now()
    db.session.commit()

    after_state = {
        "id": doc.ID,
        "nama_berkas": doc.Nama_Berkas,
        "kategori": doc.Kategori,
        "status": doc.Status
    }

    log_audit(
        "UPDATE_DOCUMENT",
        "Arsip Dokumen",
        f"Dokumen ID {doc.ID} diperbarui (Kategori: {doc.Kategori}, Status: {doc.Status})",
        before=before_state,
        after=after_state
    )

    return success_response(data=doc.to_dict(), message="Metadata dokumen berhasil diperbarui")


@documents_archive_bp.route('/<int:doc_id>', methods=['DELETE'])
@permission_required('kelola_dokumen')
def soft_delete_document(doc_id):
    """
    Soft Delete Dokumen Arsip
    ---
    tags:
      - "UC-10: Arsip Dokumen Organisasi"
    summary: Menghapus dokumen secara soft-delete (Is_Deleted = True)
    security:
      - BearerAuth: []
    """
    user = get_current_user()
    doc = db.session.get(Document, doc_id)
    if not doc or doc.Is_Deleted:
        return error_response("Dokumen tidak ditemukan atau sudah dihapus", 404)

    before_state = {"id": doc.ID, "nama_berkas": doc.Nama_Berkas, "is_deleted": doc.Is_Deleted}
    doc.Is_Deleted = True
    doc.Updated_By = user.ID
    doc.Updated_At = utc_now()
    db.session.commit()
    after_state = {"id": doc.ID, "nama_berkas": doc.Nama_Berkas, "is_deleted": doc.Is_Deleted}

    log_audit(
        "DELETE_DOCUMENT",
        "Arsip Dokumen",
        f"Soft delete dokumen '{doc.Nama_Berkas}' (ID: {doc.ID})",
        before=before_state,
        after=after_state
    )

    return success_response(message=f"Dokumen '{doc.Nama_Berkas}' berhasil dihapus (soft-delete)")
