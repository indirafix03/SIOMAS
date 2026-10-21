# SIOMAS - Sistem Informasi Organisasi Mahasiswa

![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.13-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-black?logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-3306-4479A1?logo=mysql&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-10%2F10%20Passing-success)

Aplikasi Fullstack **SIOMAS (Sistem Informasi Organisasi Mahasiswa)** yang dirancang untuk mempermudah tata kelola administrasi organisasi kemahasiswaan, mencakup pengelolaan kalender kegiatan, pengarsipan dokumen/LPJ, kolaborasi antar-organisasi (Inter-UKM), dan pemantauan roadmap jobdesk anggota.

Proyek ini terdiri dari dua bagian utama:
- **Backend**: Python + Flask RESTful API dengan arsitektur **Blueprint modular**, **Flask-SQLAlchemy**, **Flask-JWT-Extended**, enkripsi password **bcrypt**, **Flask-CORS**, serta dokumentasi interaktif **Flasgger (Swagger OpenAPI 2.0)**.
- **Frontend**: Single Page Application (SPA) berbasis **React 18** + **Vite 5** dengan sistem desain premium bertema dark-mode & clean UI sesuai rancangan mockup UI/UX.

---

## 📋 Daftar Modul & Fitur (Use Cases)

Aplikasi ini mencakup 11 modul Use Case utama yang saling terintegrasi:

| Kode UC | Nama Modul | Deskripsi Singkat |
|---|---|---|
| **UC-01** | Profil & Jobdesk | Melihat data diri, perbarui kontak/bio, dan memantau progres roadmap jobdesk anggota. |
| **UC-02** | Autentikasi Akun | Registrasi anggota baru, login berbasis JWT (Access & Refresh Token), serta verifikasi akun. |
| **UC-03** | Pembacaan Pengumuman | Feed pengumuman resmi organisasi, filter kategori, dan pencatatan status baca (*unread indicator*). |
| **UC-04** | Jadwal Kegiatan | Kalender interaktif bulanan & mingguan serta detail agenda rapat/kegiatan. |
| **UC-05** | Manajemen Pengumuman | CRUD pengumuman khusus pengurus/admin beserta pengingat agenda. |
| **UC-06** | Unggah Dokumen & LPJ | Pengunggahan berkas draft LPJ/proposal format PDF beserta metadata dokumen. |
| **UC-08** | Verifikasi Sipakamase | Verifikasi berkas kelengkapan administrasi kegiatan. |
| **UC-09** | Validasi & Approval LPJ | Alur review persetujuan status LPJ (*Draft*, *Under Review*, *Approved*, *Rejected*). |
| **UC-10** | Vault Arsip Dokumen | Gudang arsip digital terorganisir dengan pencarian, tag label, dan unduh berkas fisik. |
| **UC-11** | Hub Komunitas Inter-UKM | Portal kolaborasi lintas organisasi, pengajuan ide publikasi, dan kirim permintaan kerja sama. |
| **UC-12** | Log Audit & Notifikasi | Otomasi pencatatan aktivitas pengguna (*audit trail*) dan simulasi notifikasi email via SMTP. |

---

## 🛠️ Tech Stack

### Backend
- **Bahasa & Framework**: Python (v3.10+) & Flask (Application Factory & Blueprint Modular)
- **Database & ORM**: MySQL / MariaDB (`siomas`), Flask-SQLAlchemy & PyMySQL
- **Keamanan & Autentikasi**: Flask-JWT-Extended, bcrypt password hashing, Role-Based Access Control (RBAC)
- **Dokumentasi API**: Flasgger (Swagger UI di `/apidocs/`)
- **Layanan Tambahan**: Logging audit otomatis (`audit_logs`), layanan SMTP email dengan fallback simulasi

### Frontend
- **Framework & Tooling**: React 18, Vite 5
- **Ikonografi**: Lucide React
- **Styling**: Vanilla CSS Design System (`style.css` & `portal.css`) dengan komponen responsif dan transisi halus
- **State & Routing**: Hash-based client routing (`#/dashboard`, `#/agenda`, `#/vault`, `#/hub-inter`, `#/profile`, `#/login`, `#/register`)

---

## 📂 Struktur Proyek

```text
siomas-flask/
├── app/                              # Sumber Kode Backend Flask
│   ├── blueprints/
│   │   ├── uc01_profile/             # UC-01: Profil & Jobdesk
│   │   ├── uc02_auth/                # UC-02: Register, Login, Token Refresh
│   │   ├── uc03_announcements_read/  # UC-03: Baca Pengumuman & Status Unread
│   │   ├── uc04_schedules/           # UC-04: Jadwal Kegiatan & Kalender
│   │   ├── uc05_announcements_manage/# UC-05: Kelola Pengumuman (CRUD & Pengingat)
│   │   ├── uc06_lpj_upload/          # UC-06: Unggah Draft LPJ
│   │   ├── uc08_sipakamase_verify/   # UC-08: Verifikasi Dokumen Sipakamase
│   │   ├── uc09_lpj_validation/      # UC-09: Validasi LPJ (Review & Approval)
│   │   ├── uc10_documents_archive/   # UC-10: Arsip Dokumen & Unduh Berkas
│   │   ├── uc11_interukm/            # UC-11: Kolaborasi & Postingan Lintas UKM
│   │   └── uc12_notifications_audit/ # UC-12: Notifikasi Email SMTP & Log Audit
│   ├── middleware/                   # RBAC Decorator & Otomasi Audit Logger
│   ├── models/                       # SQLAlchemy Database Models
│   ├── utils/                        # Helper DateTime, File Handler, Response JSON
│   ├── config.py                     # Konfigurasi Environment Aplikasi
│   ├── extensions.py                 # Inisialisasi DB, JWT, CORS, Swagger
│   └── __init__.py                   # Application Factory (create_app)
├── Frontend/                         # Sumber Kode Frontend React + Vite
│   ├── css/
│   │   ├── style.css                 # Desain sistem global & autentikasi
│   │   └── portal.css                # Desain sistem portal anggota & komponen
│   ├── src/
│   │   ├── components/
│   │   │   ├── anggota/              # Komponen Portal Anggota
│   │   │   │   ├── AnggotaLayout.jsx               # Sidebar & Topbar Navigasi
│   │   │   │   ├── AnggotaDashboard.jsx            # Beranda, Ringkasan Stat & Agenda
│   │   │   │   ├── AnggotaAgenda.jsx               # Kalender Kegiatan Lengkap
│   │   │   │   ├── AnggotaAnnouncementDetail.jsx   # Detail Pengumuman & Status Baca
│   │   │   │   ├── AnggotaVault.jsx                # Repository Vault LPJ & Dokumen
│   │   │   │   ├── ModalEditDokumen.jsx            # Modal Atur Label & Tag Dokumen
│   │   │   │   ├── AnggotaHubInter.jsx             # Feed Komunitas Kolaborasi UKM
│   │   │   │   ├── AnggotaHubDetail.jsx            # Detail Postingan Kolaborasi
│   │   │   │   ├── AnggotaFormPublikasi.jsx        # Formulir Pengajuan Publikasi Hub
│   │   │   │   ├── ModalPermintaanKolaborasi.jsx   # Modal Kirim Permintaan Kolaborasi
│   │   │   │   └── AnggotaProfile.jsx              # Profil Anggota & Roadmap Jobdesk
│   │   │   ├── Login.jsx             # Halaman Masuk Akun
│   │   │   ├── Register.jsx          # Formulir Registrasi Anggota Baru
│   │   │   ├── Pending.jsx           # Halaman Tunggu Verifikasi Akun
│   │   │   ├── Unauthorized.jsx      # Halaman Peringatan Akses Ditolak
│   │   │   └── Toast.jsx             # Komponen Notifikasi Toast Interaktif
│   │   ├── services/
│   │   │   └── api.js                # API Client Service & Koneksi Backend
│   │   ├── App.jsx                   # Root Router & State Management
│   │   └── main.jsx                  # Entrypoint Vite React
│   ├── index.html                    # Single Page HTML
│   ├── package.json                  # Dependensi Node.js
│   └── vite.config.js                # Konfigurasi Vite
├── tests/
│   └── test_all_features.py          # Unit & Integration Test Suite (10 Skenario)
├── uploads/                          # Direktori Penyimpanan Berkas Fisik (LPJ, PDF)
├── .env                              # Pengaturan Lingkungan Lokal (Database, JWT, SMTP)
├── .env.example                      # Contoh Format Konfigurasi Lingkungan
├── PRD_SIOMAS_Full_Spec.md           # Dokumen Spesifikasi Kebutuhan Perangkat Lunak
├── requirements.txt                  # Dependensi Paket Python
├── run.py                            # Entrypoint Menjalankan Server Flask
├── seed_db.py                        # Script Inisialisasi Skema & Seeder Akun Default
├── siomas.sql                        # Skema Database & Permission Awal
├── start_mysql.bat                   # Batch File Cepat Menjalankan MySQL
└── start_server.bat                  # Batch File Cepat Menjalankan Backend Flask
```

---

## 🔐 Hak Akses & Role (RBAC)

Aplikasi mendukung tiga role dengan kontrol hak akses granular:

| Role | Deskripsi Hak Akses |
|---|---|
| **Admin** | Memiliki seluruh hak akses (1 s/d 9): Pengelolaan user, persetujuan LPJ, persetujuan Inter-UKM, pengumuman, jadwal, dan unduh arsip. |
| **Pengurus** | Akses operasional organisasi: Membuat pengumuman, mengunggah dokumen/LPJ, membuat jadwal kegiatan, dan membuat draft kolaborasi Inter-UKM. |
| **Anggota** | Akses personal: Melihat beranda aktivitas, membaca pengumuman, melihat kalender agenda, melihat & mengunduh arsip dokumen vault, melihat feed kolaborasi Hub Inter-UKM, mengajukan ide kerja sama, serta mengelola profil & melihat roadmap jobdesk. |

### Matriks Permission Database:
| ID | Nama Permission | Deskripsi |
|---|---|---|
| 1 | `buat_pengumuman` | Hak membuat pengumuman baru |
| 2 | `kirim_email` | Hak memicu pengiriman notifikasi email SMTP |
| 3 | `unggah_dokumen` | Hak mengunggah dokumen atau LPJ baru |
| 4 | `setujui_dokumen` | Hak mengubah status dokumen menjadi Approved / Rejected |
| 5 | `buat_jadwal` | Hak menambahkan jadwal agenda kegiatan |
| 6 | `buat_interukm` | Hak membuat postingan kolaborasi lintas UKM |
| 7 | `setujui_interukm` | Hak menyetujui publikasi postingan inter-UKM |
| 8 | `baca_pengumuman` | Hak membaca pengumuman organisasi |
| 9 | `lihat_jadwal` | Hak melihat kalender agenda kegiatan |

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
- **Python**: Versi 3.10 atau lebih baru ([Unduh Python](https://www.python.org/downloads/))
- **Node.js**: Versi 18 atau lebih baru ([Unduh Node.js](https://nodejs.org/))
- **MySQL / MariaDB**: Berjalan di port default `3306` (misal via XAMPP)
- **Git**: Untuk cloning repository

---

### 2. Persiapan Backend (Flask & Database)

1. **Clone repository & masuk ke direktori utama**:
   ```powershell
   git clone https://github.com/indirafix03/SIOMAS.git
   cd SIOMAS
   ```

2. **Buat & aktifkan Python Virtual Environment (opsional namun disarankan)**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Install dependensi Python**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Konfigurasi Environment**:
   Salin `.env.example` menjadi `.env` jika belum ada:
   ```powershell
   copy .env.example .env
   ```

5. **Inisialisasi Database & Seeder**:
   - Pastikan MySQL/MariaDB sudah menyala (via XAMPP atau klik ganda `start_mysql.bat`).
   - Jalankan skrip seeder untuk membuat database `siomas`, tabel, dan akun default:
   ```powershell
   python seed_db.py
   ```

6. **Jalankan Server Backend Flask**:
   ```powershell
   python run.py
   ```
   *Atau klik ganda berkas `start_server.bat`.*

   - **REST API Endpoint**: `http://127.0.0.1:5000`
   - **Swagger OpenAPI Documentation**: `http://127.0.0.1:5000/apidocs/`
     *(Gunakan tombol **Authorize** di pojok kanan atas Swagger dengan format `Bearer <access_token>` setelah login).*

---

### 3. Persiapan Frontend (React + Vite)

Buka jendela terminal baru khusus untuk frontend:

1. **Masuk ke direktori Frontend**:
   ```powershell
   cd Frontend
   ```

2. **Install dependensi Node.js**:
   ```powershell
   npm install
   ```

3. **Jalankan Development Server**:
   ```powershell
   npm run dev
   ```

4. **Buka Aplikasi di Browser**:
   Buka `http://localhost:3000` di browser Anda.

---

## 👤 Akun Bawaan untuk Uji Coba

Gunakan kredensial berikut untuk masuk ke aplikasi (sudah otomatis terisi saat menjalankan `seed_db.py`):

| Role | Email | Password | Hak & Lingkup Akses |
|---|---|---|---|
| **Anggota** | `anggota@siomas.com` | `anggota123` | Akses penuh Portal Anggota (Dashboard, Agenda, Vault Dokumen, Hub Inter-UKM, Profil) |
| **Pengurus** | `pengurus@siomas.com` | `pengurus123` | Akses operasional pengurus organisasi |
| **Admin** | `admin@siomas.com` | `admin123` | Akses penuh manajemen sistem & approval |

---

## 🧪 Menjalankan Rangkaian Pengujian (Automated Tests)

Aplikasi dilengkapi unit test terintegrasi untuk memverifikasi fungsionalitas seluruh modul UC-01 sampai UC-12:

```powershell
python -m unittest tests/test_all_features.py -v
```

Hasil pengujian mencakup 10 skenario:
1. `test_01_swagger_docs`: Verifikasi ketersediaan dan format OpenAPI Flasgger.
2. `test_02_profile_flow`: Pengambilan dan pembaruan profil user.
3. `test_03_role_and_permissions`: Validasi Role-Based Access Control (RBAC).
4. `test_04_announcements_unread`: Pencatatan status baca pengumuman.
5. `test_05_schedule_and_reminder`: Jadwal agenda dan pengingat.
6. `test_06_lpj_workflow`: Siklus upload, review, dan approval LPJ.
7. `test_07_sipakamase_verification`: Alur verifikasi dokumen Sipakamase.
8. `test_08_documents_archive_and_download`: Manajemen arsip dokumen dan download file.
9. `test_09_interukm_collaboration`: Postingan kolaborasi dan persetujuan ketua.
10. `test_10_notifications_and_audit_logs`: Verifikasi audit logging otomatis dan fallback email SMTP.

Seluruh pengujian terverifikasi **100% OK (Ran 10 tests in ~1.5s - OK)**.
