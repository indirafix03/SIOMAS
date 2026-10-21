from flask import request, g
from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.models.audit_log import AuditLog

def log_audit(aksi: str, modul: str, detail: str = None, user_id: int = None):
    """
    Record an action into the audit_logs table.
    Safely captures user, IP address, and user agent.
    """
    try:
        if user_id is None:
            if hasattr(g, 'current_user') and g.current_user:
                user_id = g.current_user.ID
            else:
                try:
                    identity = get_jwt_identity()
                    if identity:
                        user_id = int(identity)
                except Exception:
                    user_id = None

        ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ip_address and ',' in ip_address:
            ip_address = ip_address.split(',')[0].strip()

        user_agent = request.user_agent.string if request.user_agent else None
        if user_agent and len(user_agent) > 255:
            user_agent = user_agent[:255]

        audit_entry = AuditLog(
            User_ID=user_id,
            Aksi=aksi,
            Modul=modul,
            Detail=detail,
            IP_Address=ip_address,
            User_Agent=user_agent
        )
        db.session.add(audit_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        # Log to stderr without breaking the current operation
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {str(e)}")
