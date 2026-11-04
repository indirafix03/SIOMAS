import pymysql
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.permission import Permission
from app.models.role_permission import RolePermission

# 1. Alter table users & role_permissions to match updated schema (Ketua instead of Admin)
try:
    conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='', database='siomas')
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

# 2. db.create_all() for any missing tables
app = create_app()
with app.app_context():
    db.create_all()
    print("db.create_all() completed.")

    # 3. Ensure role_permissions for Ketua are present
    ketua_perms = RolePermission.query.filter_by(Role_Name='Ketua').all()
    if not ketua_perms:
        all_perms = Permission.query.all()
        for p in all_perms:
            db.session.add(RolePermission(Role_Name='Ketua', Permission_ID=p.ID))
        db.session.commit()
        print("Populated permissions for role Ketua.")

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
