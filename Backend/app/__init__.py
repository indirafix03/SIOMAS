import os
from flask import Flask, jsonify, send_from_directory, redirect
from app.config import Config
from app.extensions import db, jwt, cors, swagger
from app.utils.response import error_response

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    jwt.init_app(app)

    # Swagger setup
    swagger_template = {
        "swagger": "2.0",
        "info": {
            "title": "SIOMAS REST API Documentation",
            "description": "Dokumentasi REST API Sistem Informasi Organisasi Mahasiswa (SIOMAS). Arsitektur Blueprint, Flask-SQLAlchemy, RBAC (Role-Based Access Control), dan JWT Auth.",
            "version": "1.0.0"
        },
        "securityDefinitions": {
            "BearerAuth": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT Authorization header menggunakan skema Bearer. Contoh: 'Bearer {token}'"
            }
        },
        "security": [
            {
                "BearerAuth": []
            }
        ]
    }
    swagger.template = swagger_template
    swagger.init_app(app)

    # JWT Error handlers for consistent JSON format
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response("Token kedaluwarsa, silakan login ulang atau refresh token", 401)

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return error_response(f"Token tidak valid: {error}", 401)

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return error_response("Authorization header tidak ditemukan. Masukkan 'Bearer <token>'", 401)

    # Global HTTP error handlers
    @app.errorhandler(404)
    def not_found(e):
        return error_response("Endpoint atau resource tidak ditemukan", 404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response("HTTP method tidak diizinkan pada endpoint ini", 405)

    @app.errorhandler(500)
    def internal_server_error(e):
        return error_response("Terjadi kesalahan internal server", 500)

    # Register Blueprints
    from app.blueprints.uc01_profile import profile_bp
    from app.blueprints.uc02_auth import auth_bp
    from app.blueprints.uc03_announcements_read import announcements_read_bp
    from app.blueprints.uc04_schedules import schedules_bp
    from app.blueprints.uc05_announcements_manage import announcements_manage_bp
    from app.blueprints.uc06_lpj_upload import lpj_upload_bp
    from app.blueprints.uc08_sipakamase_verify import sipakamase_verify_bp
    from app.blueprints.uc09_lpj_validation import lpj_validation_bp
    from app.blueprints.uc10_documents_archive import documents_archive_bp
    from app.blueprints.uc11_interukm import interukm_bp
    from app.blueprints.uc12_notifications_audit import notifications_audit_bp

    app.register_blueprint(profile_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(announcements_read_bp)
    app.register_blueprint(schedules_bp)
    app.register_blueprint(announcements_manage_bp)
    app.register_blueprint(lpj_upload_bp)
    app.register_blueprint(sipakamase_verify_bp)
    app.register_blueprint(lpj_validation_bp)
    app.register_blueprint(documents_archive_bp)
    app.register_blueprint(interukm_bp)
    app.register_blueprint(notifications_audit_bp)

    # Root route for API health check
    @app.route('/')
    def index():
        return jsonify({
            "service": "SIOMAS REST API",
            "version": "1.0.0",
            "status": "Running",
            "documentation": "/apidocs",
            "frontend_login": "/login",
            "frontend_register": "/register"
        })

    # Frontend Web Routes
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Frontend'))
    dist_dir = 'C:/xampp/siomas-build/dist'

    @app.route('/login')
    @app.route('/app')
    def login_page():
        return send_from_directory(frontend_dir, 'index.html')

    @app.route('/register')
    def register_page():
        return send_from_directory(frontend_dir, 'index.html')

    @app.route('/pending')
    def pending_page():
        return send_from_directory(frontend_dir, 'index.html')

    @app.route('/dist/<path:filename>')
    def serve_bundle(filename):
        if os.path.exists(os.path.join(dist_dir, filename)):
            return send_from_directory(dist_dir, filename)
        return send_from_directory(frontend_dir, filename)

    @app.route('/css/<path:filename>')
    def serve_frontend_css(filename):
        return send_from_directory(os.path.join(frontend_dir, 'css'), filename)

    @app.route('/js/<path:filename>')
    def serve_frontend_js(filename):
        return send_from_directory(os.path.join(frontend_dir, 'js'), filename)

    @app.route('/Frontend/<path:filename>')
    @app.route('/frontend/<path:filename>')
    def serve_frontend_static(filename):
        return send_from_directory(frontend_dir, filename)

    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app
