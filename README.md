# SIOMAS Backend REST API

REST API backend untuk **SIOMAS (Sistem Informasi Organisasi Mahasiswa)** dibangun menggunakan Python + Flask dengan arsitektur **Blueprint**, **Flask-SQLAlchemy** (database MySQL/MariaDB `siomas`), **Flask-JWT-Extended**, **bcrypt**, **Flask-CORS**, dan **Flasgger (Swagger OpenAPI)** di `/apidocs`.

---

## 🛠️ Tech Stack & Fitur

- **Python**: 3.13
- **Framework**: Flask (Arsitektur Blueprint)
- **Database**: MySQL / MariaDB (database `siomas` berdasarkan `siomas.sql`)
- **ORM**: Flask-SQLAlchemy & PyMySQL
- **Autentikasi**: Flask-JWT-Extended (Access Token + Refresh Token)
- **Hashing**: bcrypt
- **CORS**: Flask-CORS
- **API Documentation**: Flasgger (Swagger 2.0 di `/apidocs`)
- **RBAC (Role-Based Access Control)**: Berdasarkan tabel `permissions` dan `role_permissions` dengan decorator `@permission_required("nama_akses")` dan `@role_required("Admin", ...)`

---

## 📂 Struktur Proyek

```text
E:\siomas-flask\
├── app/
│   ├── blueprints/
│   │   ├── uc01_profile/             # UC-01: Profil & Jobdesk
│   │   ├── uc02_auth/                # UC-02: Register, Login, Manajemen Akun
│   │   ├── uc03_announcements_read/  # UC-03: Baca Pengumuman & Status Unread
│   │   ├── uc04_schedules/           # UC-04: Jadwal Kegiatan & Kalender
│   │   ├── uc05_announcements_manage/# UC-05: Kelola Pengumuman (CRUD & Pembaca)
│   │   ├── uc06_lpj_upload/          # UC-06: Unggah Draft LPJ
│   │   ├── uc08_sipakamase_verify/   # UC-08: Verifikasi Dokumen Sipakamase
│   │   ├── uc09_lpj_validation/      # UC-09: Validasi LPJ (Review & Approval)
│   │   ├── uc10_documents_archive/   # UC-10: Arsip Dokumen & Unduh Berkas
│   │   ├── uc11_interukm/            # UC-11: Kolaborasi & Postingan Lintas UKM
│   │   └── uc12_notifications_audit/ # UC-12: Notifikasi Email SMTP, Log Email, Audit Log
│   ├── middleware/
│   │   ├── auth_middleware.py        # RBAC decorator & user resolution
│   │   └── audit_logger.py           # Otomatisasi pencatatan log audit
│   ├── models/                       # SQLAlchemy models sesuai siomas.sql + audit_logs
│   ├── utils/
│   │   ├── datetime_helper.py        # Helper timezone UTC
│   │   ├── email_service.py          # SMTP client dengan retry 1..3 kali & logging
│   │   ├── file_handler.py           # Validasi & penyimpanan berkas fisik
│   │   └── response.py               # Format response JSON standar
│   ├── config.py                     # Konfigurasi aplikasi
│   ├── extensions.py                 # Inisialisasi db, jwt, cors, swagger
│   └── __init__.py                   # Factory create_app()
├── tests/
│   └── test_all_features.py          # Unit & integration test suite (10 test cases)
├── uploads/                          # Direktori penyimpanan berkas (LPJ, Proposal, dll.)
├── .env                              # Variabel lingkungan
├── .env.example
├── requirements.txt
├── run.py                            # Entrypoint server Flask
└── siomas.sql                        # Schema dan seeder data awal
```

---

## 🔐 Role & RBAC (Role-Based Access Control)

Tiga Role yang didukung:
1. **Admin**: Memiliki seluruh hak akses (1 s/d 9).
2. **Pengurus**: Memiliki akses operasional (buat pengumuman, unggah dokumen, buat jadwal, buat interukm, baca pengumuman, lihat jadwal).
3. **Anggota**: Memiliki akses baca pengumuman dan lihat jadwal kegiatan.

### Tabel Permission (`permissions`):
| ID | Nama Akses | Deskripsi |
|---|---|---|
| 1 | `buat_pengumuman` | Bisa membuat pengumuman di dashboard |
| 2 | `kirim_email` | Bisa memicu/mengirim notifikasi email |
| 3 | `unggah_dokumen` | Bisa mengunggah dokumen/LPJ |
| 4 | `setujui_dokumen` | Bisa mengubah status dokumen menjadi Approved/Revisi |
| 5 | `buat_jadwal` | Bisa menambahkan jadwal kegiatan baru |
| 6 | `buat_interukm` | Bisa membuat draft postingan lintas UKM |
| 7 | `setujui_interukm` | Bisa menyetujui publikasi lintas UKM (Hak Ketua) |
| 8 | `baca_pengumuman` | Bisa membaca pengumuman |
| 9 | `lihat_jadwal` | Bisa melihat kalender jadwal |

---

## 🚀 Cara Menjalankan

### 1. Pastikan MariaDB / MySQL Aktif
Database `siomas` berjalan di port 3306.
Anda dapat menjalankannya dengan klik ganda berkas:
```powershell
.\start_mysql.bat
```
*(Atau melalui XAMPP Control Panel)*

### 2. Jalankan Virtual Environment / Server Flask
Cukup jalankan berkas batch:
```powershell
.\start_server.bat
```
Atau melalui terminal PowerShell:
```powershell
& "C:\Users\Lenovo\.venvs\siomas\Scripts\activate"
python run.py
```
Server akan berjalan di `http://127.0.0.1:5000`.

### 3. Buka Dokumentasi Swagger
Buka browser dan akses:
👉 **`http://127.0.0.1:5000/apidocs/`**

Tersedia tombol **Authorize** di Swagger UI untuk memasukkan token JWT:
```text
Bearer <access_token>
```

---

## 👤 Akun Default untuk Pengujian

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@siomas.com` | `admin123` |
| **Pengurus** | `pengurus@siomas.com` | `pengurus123` |
| **Anggota** | `anggota@siomas.com` | `anggota123` |

---

## 🧪 Menjalankan Rangkaian Pengujian (Test Suite)

Jalankan perintah berikut:
```powershell
& "C:\Users\Lenovo\.venvs\siomas\Scripts\python.exe" -m unittest tests/test_all_features.py -v
```
Semua 10 skenario pengujian UC-01 sampai UC-12 akan dijalankan dan terverifikasi 100% OK.
