from flask import Blueprint, request
from app.extensions import db
from app.models.document import Document
from app.middleware.auth_middleware import get_current_user, permission_required
from app.middleware.audit_logger import log_audit
from app.utils.response import success_response, error_response

lpj_validation_bp = Blueprint('uc09_lpj_validation', __name__, url_prefix='/api/v1/lpj-validation')

@lpj_validation_bp.route('/pending', methods=['GET'])
@permission_required('setujui_dokumen')
def list_pending_lpj():
    """
    Daftar Antrean Validasi LPJ
    ---
    tags:
      - "UC-09: Validasi LPJ"
    summary: Mengambil daftar dokumen LPJ yang berstatus Draft atau Revisi untuk ditinjau (Admin Only)
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: search
        type: string
        description: Cari nama berkas
    responses:
      200:
        description: Antrean LPJ berhasil diambil
    """
    search = request.args.get('search')
    query = Document.query.filter(
        Document.Kategori == 'LPJ',
        Document.Status.in_(['Draft', 'Revisi']),
        Document.Is_Deleted == False
    )

    if search:
        query = query.filter(Document.Nama_Berkas.ilike(f"%{search}%"))

    pending_docs = query.order_by(Document.ID.asc()).all()

    return success_response(
        data=[d.to_dict() for d in pending_docs],
        total=len(pending_docs),
        message="Daftar antrean validasi LPJ berhasil diambil"
    )


@lpj_validation_bp.route('/<int:document_id>/validate', methods=['POST'])
@permission_required('setujui_dokumen')
def validate_lpj(document_id):
    """
    Validasi Dokumen LPJ (Setujui atau Minta Revisi)
    ---
    tags:
      - "UC-09: Validasi LPJ"
    summary: Menetapkan keputusan status LPJ menjadi Approved atau Revisi beserta catatan review (Admin Only)
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
            catatan_revisi:
              type: string
              example: Laporan keuangan dan bukti nota sudah lengkap dan valid.
    responses:
      200:
        description: Validasi LPJ berhasil diproses
      400:
        description: Status tidak valid
      404:
        description: Dokumen LPJ tidak ditemukan
    """
    user = get_current_user()
    doc = db.session.get(Document, document_id)
    if not doc or doc.Kategori != 'LPJ' or doc.Is_Deleted:
        return error_response("Dokumen LPJ tidak ditemukan", 404)

    data = request.get_json() or {}
    new_status = data.get('status')
    catatan = data.get('catatan_revisi', '').strip()

    if new_status not in ('Approved', 'Revisi'):
        return error_response("Status validasi harus 'Approved' atau 'Revisi'", 400)

    doc.Status = new_status
    doc.Approved_By = user.ID
    db.session.commit()

    detail_str = f"LPJ '{doc.Nama_Berkas}' divalidasi dengan status {new_status} oleh {user.Nama}"
    if catatan:
        detail_str += f". Catatan: {catatan}"

    log_audit("VALIDATE_LPJ", "Validasi LPJ", detail_str)

    return success_response(
        data={
            "document": doc.to_dict(),
            "catatan_revisi": catatan
        },
        message=f"LPJ berhasil divalidasi menjadi '{new_status}'"
    )


@lpj_validation_bp.route('/history', methods=['GET'])
@permission_required('setujui_dokumen')
def lpj_validation_history():
    """
    Riwayat Validasi LPJ
    ---
    tags:
      - "UC-09: Validasi LPJ"
    summary: Mengambil riwayat dokumen LPJ yang telah disetujui (Approved)
    security:
      - BearerAuth: []
    responses:
      200:
        description: Riwayat validasi LPJ berhasil diambil
    """
    approved_docs = Document.query.filter_by(
        Kategori='LPJ',
        Status='Approved',
        Is_Deleted=False
    ).order_by(Document.ID.desc()).all()

    return success_response(
        data=[d.to_dict() for d in approved_docs],
        total=len(approved_docs),
        message="Riwayat LPJ approved berhasil diambil"
    )
