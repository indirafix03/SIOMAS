from functools import wraps
from flask import g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.utils.response import error_response

def get_current_user():
    """
    Retrieve currently authenticated user and attach to flask.g
    """
    identity = get_jwt_identity()
    if not identity:
        return None

    try:
        user_id = int(identity)
        if hasattr(g, 'current_user') and g.current_user is not None and g.current_user.ID == user_id:
            return g.current_user

        user = db.session.get(User, user_id)
        g.current_user = user
        return user
    except Exception:
        return None


def get_user_permissions(user: User):
    """
    Retrieve all permission keys (Nama_Akses) assigned to the user's role.
    """
    if not user:
        return set()

    if hasattr(g, 'user_permissions_id') and g.user_permissions_id == user.ID:
        return g.user_permissions

    # Query role_permissions joined with permissions
    results = (
        db.session.query(Permission.Nama_Akses)
        .join(RolePermission, RolePermission.Permission_ID == Permission.ID)
        .filter(RolePermission.Role_Name == user.Role)
        .all()
    )

    permissions = {r[0] for r in results}
    g.user_permissions = permissions
    g.user_permissions_id = user.ID
    return permissions


def permission_required(permission_name: str):
    """
    RBAC Decorator: Ensures the requesting user is authenticated, active,
    and possesses the specified permission in the permissions table.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT exists in the request
            verify_jwt_in_request()
            user = get_current_user()

            if not user:
                return error_response("User tidak ditemukan atau token tidak valid", 401)

            if user.Status_Keanggotaan != 'Aktif':
                return error_response("Akun Anda berstatus non-aktif/alumni", 403)

            # Check permissions
            user_permissions = get_user_permissions(user)
            if permission_name not in user_permissions:
                return error_response(
                    f"Akses ditolak: Anda tidak memiliki izin '{permission_name}'",
                    403,
                    required_permission=permission_name,
                    your_role=user.Role
                )

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def role_required(*allowed_roles):
    """
    Role-based Decorator: Ensures user has one of the specified roles (e.g. 'Admin').
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = get_current_user()

            if not user:
                return error_response("User tidak ditemukan atau token tidak valid", 401)

            if user.Status_Keanggotaan != 'Aktif':
                return error_response("Akun Anda berstatus non-aktif/alumni", 403)

            if user.Role not in allowed_roles:
                return error_response(
                    f"Akses ditolak: Fitur ini hanya untuk role {', '.join(allowed_roles)}",
                    403,
                    allowed_roles=list(allowed_roles),
                    your_role=user.Role
                )

            return fn(*args, **kwargs)
        return wrapper
    return decorator
