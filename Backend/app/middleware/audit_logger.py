import json
from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.extensions import db
from app.models.audit_log import AuditLog


def log_audit(aksi, modul, detail=None, user_id=None, before=None, after=None):
    """
    Mencatat aktivitas penting pengguna ke dalam tabel audit_logs / system_audit_logs
    dengan format terstruktur JSON (menyimpan summary, data `before`, dan data `after`
    sesuai spesifikasi SRS Sequence & Skema Tabel #10).
    """
    try:
        if user_id is None:
            try:
                verify_jwt_in_request(optional=True)
                identity = get_jwt_identity()
                if identity is not None:
                    user_id = int(identity)
            except Exception:
                user_id = None

        ip_addr = request.remote_addr if request else None
        user_agent = request.headers.get('User-Agent', '')[:255] if request else None

        payload = {
            "summary": detail or f"{aksi} pada modul {modul}",
            "before": before,
            "after": after
        }
        serialized_detail = json.dumps(payload, ensure_ascii=False)

        audit = AuditLog(
            User_ID=user_id,
            Aksi=aksi,
            Modul=modul,
            Detail=serialized_detail,
            IP_Address=ip_addr,
            User_Agent=user_agent
        )
        db.session.add(audit)
        db.session.commit()
    except Exception:
        db.session.rollback()
