import pymysql
from app import create_app
from app.extensions import db
from app.models.user import User

# 1. Alter table users to match User model
conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='', database='siomas')
with conn.cursor() as cursor:
    cursor.execute("SHOW COLUMNS FROM users LIKE 'NIM';")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE users ADD COLUMN NIM VARCHAR(50) NULL AFTER Nama;")
        print("Added NIM column.")
    else:
        print("NIM column already exists.")

    cursor.execute("ALTER TABLE users MODIFY COLUMN Status_Keanggotaan ENUM('Menunggu Verifikasi', 'Aktif', 'Alumni') NOT NULL DEFAULT 'Menunggu Verifikasi';")
    print("Updated Status_Keanggotaan enum.")
conn.commit()
conn.close()

# 2. db.create_all() for any missing tables (like audit_logs)
app = create_app()
with app.app_context():
    db.create_all()
    print("db.create_all() completed.")

    # 3. Seed users
    admin = User.query.filter_by(Email='admin@siomas.com').first()
    if not admin:
        admin = User(Nama='Administrator SIOMAS', NIM='H071231001', Email='admin@siomas.com', Role='Admin', Status_Keanggotaan='Aktif')
        admin.set_password('admin123')
        db.session.add(admin)
        print("Admin user created.")

    pengurus = User.query.filter_by(Email='pengurus@siomas.com').first()
    if not pengurus:
        pengurus = User(Nama='Pengurus Organisasi', NIM='H071231002', Email='pengurus@siomas.com', Role='Pengurus', Job_Desc='Sekretaris Umum', Status_Keanggotaan='Aktif')
        pengurus.set_password('pengurus123')
        db.session.add(pengurus)
        print("Pengurus user created.")

    anggota = User.query.filter_by(Email='anggota@siomas.com').first()
    if not anggota:
        anggota = User(Nama='Anggota Mahasiswa', NIM='H071231003', Email='anggota@siomas.com', Role='Anggota', Job_Desc='Staff Acara', Status_Keanggotaan='Aktif')
        anggota.set_password('anggota123')
        db.session.add(anggota)
        print("Anggota user created.")

    db.session.commit()
    print("Database seeding completed successfully!")
