import psycopg2
from psycopg2.extras import RealDictCursor

LOCAL_URL = "postgresql://postgres:postgres@127.0.0.1:5432/siomas"
NEON_URL = "postgresql://neondb_owner:npg_4fKULoCWqDc0@ep-damp-sea-a10ojkxy-pooler.ap-southeast-1.aws.neon.tech/siomas_db?sslmode=require"

DDL_STATEMENTS = [
    """
    DROP VIEW IF EXISTS system_audit_logs CASCADE;
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS interukm_posts CASCADE;
    DROP TABLE IF EXISTS email_logs CASCADE;
    DROP TABLE IF EXISTS announcement_reads CASCADE;
    DROP TABLE IF EXISTS announcements CASCADE;
    DROP TABLE IF EXISTS documents CASCADE;
    DROP TABLE IF EXISTS schedules CASCADE;
    DROP TABLE IF EXISTS role_permissions CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    """,
    """
    CREATE TABLE users (
        "ID" SERIAL PRIMARY KEY,
        "Nama" VARCHAR(255) NOT NULL,
        "NIM" VARCHAR(50) DEFAULT NULL,
        "Email" VARCHAR(255) NOT NULL UNIQUE,
        "Password_Hash" VARCHAR(255) NOT NULL,
        "Role" VARCHAR(50) NOT NULL DEFAULT 'Anggota',
        "Job_Desc" VARCHAR(255) DEFAULT NULL,
        "Status_Keanggotaan" VARCHAR(50) NOT NULL DEFAULT 'Menunggu Verifikasi',
        "Created_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "Created_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL,
        "Updated_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL
    );
    """,
    """
    CREATE TABLE permissions (
        "ID" SERIAL PRIMARY KEY,
        "Nama_Akses" VARCHAR(100) NOT NULL UNIQUE,
        "Deskripsi" VARCHAR(255) DEFAULT NULL
    );
    """,
    """
    CREATE TABLE role_permissions (
        "ID" SERIAL PRIMARY KEY,
        "Role_Name" VARCHAR(50) NOT NULL,
        "Permission_ID" INTEGER DEFAULT NULL REFERENCES permissions("ID") ON DELETE CASCADE
    );
    """,
    """
    CREATE TABLE schedules (
        "ID" SERIAL PRIMARY KEY,
        "Judul_Kegiatan" VARCHAR(255) NOT NULL,
        "Kategori" VARCHAR(100) DEFAULT 'Umum',
        "Waktu" TIMESTAMP NOT NULL,
        "Lokasi" VARCHAR(255) DEFAULT NULL,
        "Keterangan" TEXT DEFAULT NULL,
        "Divisi_ID" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL,
        "Updated_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL
    );
    """,
    """
    CREATE TABLE documents (
        "ID" SERIAL PRIMARY KEY,
        "Nama_Berkas" VARCHAR(255) NOT NULL,
        "Kategori" VARCHAR(50) NOT NULL,
        "Path_File" VARCHAR(255) NOT NULL,
        "Status" VARCHAR(50) DEFAULT 'Draft',
        "Catatan_Revisi" TEXT DEFAULT NULL,
        "Is_Deleted" BOOLEAN DEFAULT FALSE,
        "Uploaded_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL,
        "Approved_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL,
        "Updated_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL,
        "Created_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "Updated_At" TIMESTAMP DEFAULT NULL
    );
    """,
    """
    CREATE TABLE announcements (
        "ID" SERIAL PRIMARY KEY,
        "Judul" VARCHAR(255) NOT NULL,
        "Isi" TEXT NOT NULL,
        "Is_Important" BOOLEAN DEFAULT FALSE,
        "Created_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE CASCADE,
        "Created_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "Updated_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL
    );
    """,
    """
    CREATE TABLE announcement_reads (
        "ID" SERIAL PRIMARY KEY,
        "Announcement_ID" INTEGER DEFAULT NULL REFERENCES announcements("ID") ON DELETE CASCADE,
        "User_ID" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE CASCADE,
        "Is_Read" BOOLEAN DEFAULT FALSE,
        "Read_At" TIMESTAMP DEFAULT NULL
    );
    """,
    """
    CREATE TABLE email_logs (
        "ID" SERIAL PRIMARY KEY,
        "Announcement_ID" INTEGER DEFAULT NULL REFERENCES announcements("ID") ON DELETE CASCADE,
        "User_ID" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE CASCADE,
        "Attempt_Number" INTEGER NOT NULL DEFAULT 1 CHECK ("Attempt_Number" BETWEEN 1 AND 3),
        "Sent_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "Status_Pengiriman" VARCHAR(50) NOT NULL DEFAULT 'Terkirim'
    );
    """,
    """
    CREATE TABLE interukm_posts (
        "ID" SERIAL PRIMARY KEY,
        "UKM_Pengirim" VARCHAR(255) NOT NULL,
        "Judul" VARCHAR(255) NOT NULL,
        "Isi_Pengumuman" TEXT NOT NULL,
        "Status_Persetujuan" VARCHAR(255) NOT NULL DEFAULT 'Menunggu Verifikasi',
        "Date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "Created_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL,
        "Approved_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL,
        "Updated_By" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL,
        "Updated_At" TIMESTAMP DEFAULT NULL
    );
    """,
    """
    CREATE TABLE audit_logs (
        "ID" SERIAL PRIMARY KEY,
        "User_ID" INTEGER DEFAULT NULL REFERENCES users("ID") ON DELETE SET NULL,
        "Aksi" VARCHAR(100) NOT NULL,
        "Modul" VARCHAR(100) NOT NULL,
        "Record_ID" INTEGER DEFAULT NULL,
        "Detail" TEXT DEFAULT NULL,
        "IP_Address" VARCHAR(45) DEFAULT NULL,
        "User_Agent" VARCHAR(255) DEFAULT NULL,
        "Created_At" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE OR REPLACE VIEW system_audit_logs AS
    SELECT
        "ID",
        "User_ID",
        "Aksi",
        "Modul" AS "Nama_Tabel",
        "Record_ID",
        "Detail" AS "Detail_Perubahan",
        "IP_Address",
        "Created_At"
    FROM audit_logs;
    """
]

TABLES_ORDER = [
    "users",
    "permissions",
    "role_permissions",
    "schedules",
    "documents",
    "announcements",
    "announcement_reads",
    "email_logs",
    "interukm_posts",
    "audit_logs"
]


def main():
    print("Connecting to Neon PostgreSQL (siomas_db)...")
    neon_conn = psycopg2.connect(NEON_URL)
    neon_conn.autocommit = True
    neon_cur = neon_conn.cursor(cursor_factory=RealDictCursor)

    for stmt in DDL_STATEMENTS:
        neon_cur.execute(stmt)
    print("Schema (10 tables + system_audit_logs view) created on Neon!")

    local_conn = psycopg2.connect(LOCAL_URL)
    local_cur = local_conn.cursor(cursor_factory=RealDictCursor)

    for tbl in TABLES_ORDER:
        local_cur.execute(f'SELECT * FROM {tbl} ORDER BY "ID" ASC')
        rows = local_cur.fetchall()
        print(f"Syncing table {tbl}: {len(rows)} rows from local -> Neon...")
        if not rows:
            continue
        cols = list(rows[0].keys())
        quoted_cols = ', '.join(f'"{c}"' for c in cols)
        placeholders = ', '.join(['%s'] * len(cols))

        success_cnt = 0
        for r in rows:
            vals = [r[c] for c in cols]
            sql = f'INSERT INTO {tbl} ({quoted_cols}) VALUES ({placeholders})'
            try:
                neon_cur.execute(sql, vals)
                success_cnt += 1
            except Exception as ex:
                print(f"  Warning on {tbl} ID={r.get('ID')}: {ex}")
        print(f"  -> {success_cnt}/{len(rows)} rows inserted into Neon.{tbl}")

        neon_cur.execute(f"""
            SELECT setval(
                pg_get_serial_sequence('{tbl}', 'ID'),
                COALESCE((SELECT MAX("ID") FROM {tbl}), 1),
                true
            )
        """)

    local_conn.close()
    neon_cur.execute('SELECT COUNT(*) AS cnt FROM users')
    print("Total users in Neon siomas_db:", neon_cur.fetchone()['cnt'])
    neon_conn.close()
    print("Migration to Neon completed successfully!")


if __name__ == "__main__":
    main()
