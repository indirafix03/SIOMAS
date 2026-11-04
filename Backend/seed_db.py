import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.permission import Permission
from app.models.role_permission import RolePermission

app = create_app()
db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')

# 1a. Auto-create PostgreSQL database if it doesn't exist yet, and fix lowercase schema mismatch
if db_uri.startswith('postgresql'):
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
        target_db = os.getenv('DB_NAME', 'siomas')
        pg_conn = psycopg2.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            port=int(os.getenv('DB_PORT', 5432)),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'postgres'),
            dbname='postgres'
        )
        pg_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        with pg_conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (target_db,))
            if not cur.fetchone():
                cur.execute(f'CREATE DATABASE "{target_db}";')
                print(f"Created PostgreSQL database '{target_db}'.")
        pg_conn.close()

        # Check if existing tables use unquoted lowercase 'id' instead of SQLAlchemy's '"ID"'
        db_conn = psycopg2.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            port=int(os.getenv('DB_PORT', 5432)),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'postgres'),
            dbname=target_db
        )
        db_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        with db_conn.cursor() as cur:
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id';
            """)
            if cur.fetchone():
                print("Detected legacy lowercase PostgreSQL schema; recreating schema for SQLAlchemy compatibility...")
                cur.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
        db_conn.close()
    except Exception as e:
        print(f"Note: Could not auto-check/create PostgreSQL database: {e}")

# 1b. Alter table users & role_permissions for legacy MySQL schema if applicable
if db_uri.startswith('mysql'):
    try:
        import pymysql
        conn = pymysql.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            port=int(os.getenv('DB_PORT', 3306)),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'siomas')
        )
        with conn.cursor() as cursor:
            cursor.execute("SHOW COLUMNS FROM users LIKE 'NIM';")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE users ADD COLUMN NIM VARCHAR(50) NULL AFTER Nama;")
                print("Added NIM column.")

            cursor.execute("ALTER TABLE users MODIFY COLUMN Status_Keanggotaan ENUM('Menunggu Verifikasi', 'Aktif', 'Alumni') NOT NULL DEFAULT 'Menunggu Verifikasi';")
            print("Updated Status_Keanggotaan enum.")

            # Update Role enum on users
            cursor.execute("ALTER TABLE users MODIFY COLUMN Role ENUM('Ketua', 'Pengurus', 'Anggota', 'Admin') NOT NULL DEFAULT 'Anggota';")
            cursor.execute("UPDATE users SET Role = 'Ketua' WHERE Role = 'Admin';")
            cursor.execute("ALTER TABLE users MODIFY COLUMN Role ENUM('Ketua', 'Pengurus', 'Anggota') NOT NULL DEFAULT 'Anggota';")
            print("Updated users.Role enum to ('Ketua', 'Pengurus', 'Anggota').")

            # Update Role_Name enum on role_permissions
            cursor.execute("ALTER TABLE role_permissions MODIFY COLUMN Role_Name ENUM('Ketua', 'Pengurus', 'Anggota', 'Admin') NOT NULL;")
            cursor.execute("UPDATE role_permissions SET Role_Name = 'Ketua' WHERE Role_Name = 'Admin';")
            cursor.execute("ALTER TABLE role_permissions MODIFY COLUMN Role_Name ENUM('Ketua', 'Pengurus', 'Anggota') NOT NULL;")
            print("Updated role_permissions.Role_Name enum to ('Ketua', 'Pengurus', 'Anggota').")

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Warning: Database migration via pymysql skipped or failed: {e}")

# 2. db.create_all() for any missing tables (works on both PostgreSQL & MySQL)
with app.app_context():
    db.create_all()
    print("db.create_all() completed.")

    # 3. Seed default permissions if table is empty (e.g., fresh PostgreSQL database)
    default_permissions = [
        (1, 'buat_pengumuman', 'Bisa membuat pengumuman di dashboard'),
        (2, 'kirim_email', 'Bisa memicu/mengirim notifikasi email'),
        (3, 'unggah_dokumen', 'Bisa mengunggah dokumen/LPJ'),
        (4, 'setujui_dokumen', 'Bisa mengubah status dokumen menjadi Approved/Revisi'),
        (5, 'buat_jadwal', 'Bisa menambahkan jadwal kegiatan baru'),
        (6, 'buat_interukm', 'Bisa membuat draft postingan lintas UKM'),
        (7, 'setujui_interukm', 'Bisa menyetujui publikasi lintas UKM (Hak Ketua)'),
        (8, 'baca_pengumuman', 'Bisa membaca pengumuman'),
        (9, 'lihat_jadwal', 'Bisa melihat kalender jadwal'),
    ]
    for perm_id, nama_akses, deskripsi in default_permissions:
        if not Permission.query.filter_by(Nama_Akses=nama_akses).first():
            db.session.add(Permission(ID=perm_id, Nama_Akses=nama_akses, Deskripsi=deskripsi))
    db.session.commit()

    # 4. Ensure role_permissions are present for Ketua, Pengurus, and Anggota
    role_perm_map = {
        'Ketua': [1, 2, 3, 4, 5, 6, 7, 8, 9],
        'Pengurus': [1, 3, 5, 6, 8, 9],
        'Anggota': [8, 9],
    }
    for role_name, perm_ids in role_perm_map.items():
        existing = {rp.Permission_ID for rp in RolePermission.query.filter_by(Role_Name=role_name).all()}
        for pid in perm_ids:
            if pid not in existing:
                db.session.add(RolePermission(Role_Name=role_name, Permission_ID=pid))
    db.session.commit()
    print("Populated permissions & role_permissions.")

    # 4. Seed users
    ketua = User.query.filter(User.Email.in_(['ketua@siomas.com', 'admin@siomas.com'])).first()
    if not ketua:
        ketua = User(
            Nama='Ketua UKM SIOMAS',
            NIM='H071231001',
            Email='ketua@siomas.com',
            Role='Ketua',
            Job_Desc='Ketua Umum',
            Status_Keanggotaan='Aktif'
        )
        ketua.set_password('ketua123')
        db.session.add(ketua)
        print("Ketua user created (ketua@siomas.com / ketua123).")
    else:
        ketua.Role = 'Ketua'
        ketua.Job_Desc = 'Ketua Umum'
        print("Existing admin/ketua user updated to role Ketua.")

    pengurus = User.query.filter_by(Email='pengurus@siomas.com').first()
    if not pengurus:
        pengurus = User(
            Nama='Pengurus Organisasi',
            NIM='H071231002',
            Email='pengurus@siomas.com',
            Role='Pengurus',
            Job_Desc='Sekretaris Umum',
            Status_Keanggotaan='Aktif'
        )
        pengurus.set_password('pengurus123')
        db.session.add(pengurus)
        print("Pengurus user created.")

    anggota = User.query.filter_by(Email='anggota@siomas.com').first()
    if not anggota:
        anggota = User(
            Nama='Anggota Mahasiswa',
            NIM='H071231003',
            Email='anggota@siomas.com',
            Role='Anggota',
            Job_Desc='Staff Acara',
            Status_Keanggotaan='Aktif'
        )
        anggota.set_password('anggota123')
        db.session.add(anggota)
        print("Anggota user created.")

    db.session.commit()
    print("Database seeding completed successfully!")
