import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file from project root
basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'siomas-super-secret-key-2026')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'SQLALCHEMY_DATABASE_URI',
        'mysql+pymysql://root:@127.0.0.1:3306/siomas?charset=utf8mb4'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 280,
        'pool_pre_ping': True
    }
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'siomas-jwt-secret-key-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_MINUTES', 120))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES_DAYS', 30))
    )
    JWT_ERROR_MESSAGE_KEY = 'message'
    
    # File Uploads
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(basedir, 'uploads'))
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH_MB', 10)) * 1024 * 1024
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'jpg', 'jpeg', 'png'}
    
    # SMTP Configuration
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USER = os.getenv('SMTP_USER', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'True').lower() in ('true', '1', 't')
    SMTP_DEFAULT_SENDER = os.getenv('SMTP_DEFAULT_SENDER', 'SIOMAS Notification <no-reply@siomas.ac.id>')

    # Flasgger / Swagger 2.0 Configuration
    SWAGGER = {
        'title': 'SIOMAS REST API Documentation',
        'uiversion': 3,
        'version': '1.0.0',
        'description': 'Dokumentasi REST API Sistem Informasi Organisasi Mahasiswa (SIOMAS) dengan arsitektur Blueprint, RBAC, dan JWT.',
        'termsOfService': '',
        'hide_top_bar': False,
        'specs_route': '/apidocs/'
    }
