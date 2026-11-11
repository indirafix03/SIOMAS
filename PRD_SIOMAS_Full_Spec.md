# PRODUCT REQUIREMENT DOCUMENT (PRD) SIOMAS
## Sistem Informasi Operasional Management UKM (Fase 1 & Fase 2 Final)
**Spesifikasi Integrasi Frontend & Backend**

---

## 1. GAMBARAN UMUM & VISI PRODUK
* **Nama Produk:** SIOMAS (Sistem Informasi Operasional Management UKM)
* **Tujuan Sistem:** Memusatkan operasional harian Unit Kegiatan Mahasiswa (UKM) di lingkungan kampus Universitas Hasanuddin, meliputi pengelolaan keanggotaan, penjadwalan agenda, pengumuman terpusat, pengarsipan dokumen Sipakamase, dan kolaborasi antar-UKM.
* **Target Perangkat & Responsive Breakpoints:**
  * Application Shell: Web Responsive Application (PWA-Ready).
  * Breakpoint Minimal:
    * Mobile: `360px` (Single-column layout, drawer navigation).
    * Tablet: `768px` (Fluid 1-2 column layout).
    * Desktop: `1024px+` (Multi-column dashboard, permanent collapsible sidebar).
* **Ruang Lingkup Produk:**
  * **In-Scope:** Manajemen Anggota & Jobdesk Roadmap, Kalender Agenda WITA, Dashboard Pengumuman Terpusat, Vault LPJ & Surat, Bundel Konversi Sipakamase (.ZIP), Hub Inter-UKM, Notifikasi Email Terjadwal (Cron Job + SMTP Queue).
  * **Out-of-Scope:** Transaksi Keuangan / Payment Gateway, Aplikasi Native Mobile (Play Store/App Store), Private Chat antar-individu.
* **Design System & Visual Tokens:**
  * **Primary Navy:** `#1E293B` (Header, Active Sidebar, Primary Text)
  * **Accent Indigo:** `#4F46E5` (Primary Action Buttons, Active Tabs, Highlights)
  * **Success Emerald:** `#10B981` (Status Approved, Active Badges, Completed Tasks)
  * **Warning Amber:** `#F59E0B` (Pending Status, Revision Badges, Warnings)
  * **Danger Red:** `#EF4444` (Error States, 401 Unauthorized, Delete Confirmation)
  * **Neutral Slate:** `#F8FAFC` (App Background, Card Backdrops, Table Zebra Stripes)
  * **Typography Scale:** Inter / Plus Jakarta Sans (Scale: H1 24px/Bold, H2 20px/SemiBold, H3 16px/Medium, Body 14px/Regular, Caption 12px/Regular).

---

## 2. ARSITEKTUR SISTEM & STACK TEKNOLOGI FULL-STACK
Aplikasi dibangun menggunakan **Arsitektur 3-Tier Decoupled (RESTful Client-Server)**:

```
[Presentation Layer]          [Application/Business Layer]            [Data/Infrastructure Layer]
 React.js 18 + Vite     <-->   Node.js + Express.js REST API     <--> Neon Cloud PostgreSQL (Sequelize + pg Pool)
 (Responsive SPA UI)           JWT Authentication & Bcrypt RBAC       Shared Cloud DB + Local/Cloud File Storage
                               node-cron Scheduler + Nodemailer       Archiver (.ZIP Bundle) + SMTP Webhook
```

1. **Presentation Layer (Frontend):**
   * Framework: React.js 18 + Vite (Component-based architecture, Responsive Desktop/Tablet/Mobile & PWA-Ready).
   * Styling: Custom CSS Modules & variabel Design System SIOMAS.
   * State Management: Client-side state untuk JWT Token (`siomas_token`), Role-Based Portal (`Anggota`, `Pengurus Divisi`, `Ketua UKM`), dan UI feedback real-time.
2. **Business/Application Layer (Backend):**
   * Runtime & Framework: **Node.js + Express.js REST API** ([Backend-Express/server.js](file:///d:/Indi/Semester%205/PPL/siomas-flask/siomas-flask/Backend-Express/server.js)) yang melayani seluruh Use Case (`UC-01` s/d `UC-12`) secara modular *(serta kompatibel penuh dengan modul Python Flask fallback di `Backend/`)*.
   * ORM & Database Abstraction: **Sequelize ORM + `pg` Connection Pool** yang terhubung langsung ke **Neon Cloud Serverless PostgreSQL (`siomas_db`)**.
   * Otentikasi: Stateless JWT (`jsonwebtoken`) dengan masa berlaku 24 jam (`NFR-SEC-03`).
   * Enkripsi Kata Sandi: Hashing satu arah menggunakan `bcryptjs` (`NFR-SEC-02`).
   * Asynchronous Reminder Scheduler (`UC-12`): **`node-cron` Hourly Scheduler** (`processScheduledEmailReminders`) untuk eksekusi pengiriman email bertahap **Attempt-1 (Saat Publikasi)**, **Attempt-2 (24 Jam)**, dan **Attempt-3 (48 Jam)** serta endpoint webhook callback (`POST /api/v1/notifications/email/webhook`).
   * Mailer: **Nodemailer** terintegrasi dengan SMTP Relay.
   * Kompresi Bundel Arsip (`UC-10`): Modul **Archiver** (`archiver('zip')`) untuk streaming unduhan bundel dokumen `.ZIP` (`GET /api/v1/documents/bundle`).
3. **Data/Infrastructure Layer:**
   * Basis Data Relasional Cloud: **Neon Cloud PostgreSQL RDBMS (`siomas_db`)** dengan 10 tabel relasional dan View `system_audit_logs`, memungkinkan seluruh anggota tim mengakses basis data yang sama secara *real-time* tanpa kendala perbedaan data lokal.
   * Storage File: **Server File Storage (`Backend/uploads/` + `multer`)** untuk penyimpanan fisik dokumen PDF/DOCX/ZIP dan poster kegiatan (Batas maks 10 MB per request, mendukung `NFR-PERF-02`).

### 2.1 Catatan Penyesuaian Arsitektur Implementasi (Deviasi Sadar Terhadap Draf Awal SRS)
Sebagai bagian dari rekayasa perangkat lunak yang pragmatis pada lingkungan pengembangan dan pengujian lokal, tim pengembang menetapkan penyesuaian arsitektur (*conscious architectural deviation*) berikut tanpa mengurangi satupun kebutuhan fungsional (UC-01 s/d UC-12):

| Komponen Arsitektur | Rancangan Konseptual Awal (SRS) | Implementasi Aktual (SIOMAS Codebase) | Alasan Teknis & Kesetaraan Fungsional |
| :--- | :--- | :--- | :--- |
| **Backend Framework & ORM** | Node.js / Express + Sequelize/Prisma | **Python Flask + Flask-SQLAlchemy** | Modularitas Blueprint per Use Case (`uc01`–`uc12`), integrasi Swagger otomatis (`/apidocs`), dan skema ORM yang 100% ekuivalen. |
| **Antrean & Cron Email (UC-12)** | BullMQ + Redis + `node-cron` + Nodemailer | **Python Daemon Scheduler Thread + `smtplib` + Endpoint Trigger/Webhook** | Menghilangkan ketergantungan instalasi server Redis eksternal di mesin penguji, namun tetap menjalankan logika Attempt-1, Attempt-2 (24 jam), Attempt-3 (48 jam), Auto-Stop saat `Is_Read=True`, serta Webhook SMTP. |
| **Penyimpanan Berkas & ZIP (UC-10)** | Cloud Storage (AWS S3 / GCS) | **Local Disk Storage (`Backend/uploads/`) + Python `zipfile` (`io.BytesIO`)** | Dapat diuji secara mandiri (*self-contained*) tanpa akun berbayar AWS/GCP, mendukung unggah fisik dan unduh bundel `.ZIP` secara langsung. |
| **Tabel Audit Log (UC-12)** | `system_audit_logs` (JSON Before/After) | **Tabel `audit_logs` + SQL View `system_audit_logs` (Payload JSON `before` & `after`)** | Menyimpan struktur JSON `{"summary": "...", "before": {...}, "after": {...}}` pada kolom `Detail` serta menyediakan View `system_audit_logs` agar kompatibel dengan kedua penamaan. |

---

## 3. MATRIKS HAK AKSES PERAN (RBAC - ROLE-BASED ACCESS CONTROL)

| Fitur / Modul | Anggota Baru / Pendaftar | Anggota Aktif | Pengurus Divisi / Koordinator | Admin / Pengurus Inti |
| :--- | :---: | :---: | :---: | :---: |
| **Registrasi & Login** | ✅ | ✅ | ✅ | ✅ |
| **Lihat Dashboard & Pengumuman** | ❌ (Menunggu Verifikasi) | ✅ | ✅ | ✅ |
| **Profil Saya & Jobdesk Roadmap** | ❌ | ✅ | ✅ | ✅ |
| **Kalender Agenda WITA** | ❌ | Read-Only | Read & Create/Edit | Full Access |
| **Unggah Draf LPJ Kegiatan** | ❌ | ❌ | ✅ (Maks 10MB) | ✅ |
| **Validasi & Approval LPJ** | ❌ | ❌ | ❌ | ✅ (Setujui / Revisi) |
| **Repository Vault & Categorization** | ❌ | Read / Download | Read & Upload | Full Control (Label & Soft Delete) |
| **Unduh Bundel Sipakamase (.ZIP)** | ❌ | ❌ | ❌ | ✅ |
| **Publikasi Hub Inter-UKM** | ❌ | Read | Ajukan Publikasi | Approval & Broadcast (BR-02) |
| **Manajemen RBAC & Verifikasi Akun** | ❌ | ❌ | ❌ | ✅ |
| **Konsol Log Email & Audit Log** | ❌ | ❌ | ❌ | ✅ |

---

## 4. SPESIFIKASI BASIS DATA (DDL SCHEMA & DATA DICTIONARY)

### 4.1 Data Definition Language (DDL MySQL)

```sql
-- 1. Tabel Users
CREATE TABLE users (
  ID INT NOT NULL AUTO_INCREMENT,
  Nama VARCHAR(255) NOT NULL,
  Email VARCHAR(255) NOT NULL UNIQUE,
  Password_Hash VARCHAR(255) NOT NULL,
  Role ENUM('Ketua UKM','Pengurus Divisi','Anggota') NOT NULL,
  Job_Desc VARCHAR(255) DEFAULT NULL,
  Status_Keanggotaan ENUM('Aktif','Alumni','Menunggu Verifikasi') NOT NULL DEFAULT 'Menunggu Verifikasi',
  Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  Created_By INT DEFAULT NULL,
  Updated_By INT DEFAULT NULL,
  PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Permissions
CREATE TABLE permissions (
  ID INT NOT NULL AUTO_INCREMENT,
  Nama_Akses VARCHAR(100) NOT NULL UNIQUE,
  Deskripsi VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Role_Permissions
CREATE TABLE role_permissions (
  ID INT NOT NULL AUTO_INCREMENT,
  Role ENUM('Ketua UKM','Pengurus Divisi','Anggota') NOT NULL,
  Permission_ID INT NOT NULL,
  PRIMARY KEY (ID),
  CONSTRAINT fk_role_permissions_perm FOREIGN KEY (Permission_ID) REFERENCES permissions(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Schedules
CREATE TABLE schedules (
  ID INT NOT NULL AUTO_INCREMENT,
  Judul_Kegiatan VARCHAR(255) NOT NULL,
  Kategori VARCHAR(100) DEFAULT NULL,
  Waktu DATETIME NOT NULL,
  Lokasi VARCHAR(255) DEFAULT NULL,
  Keterangan TEXT DEFAULT NULL,
  Divisi_ID INT DEFAULT NULL,
  Updated_By INT DEFAULT NULL,
  PRIMARY KEY (ID),
  CONSTRAINT fk_schedules_user FOREIGN KEY (Divisi_ID) REFERENCES users(ID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Documents
CREATE TABLE documents (
  ID INT NOT NULL AUTO_INCREMENT,
  Nama_Berkas VARCHAR(255) NOT NULL,
  Kategori ENUM('LPJ','Proposal','Sipakamase','Surat') NOT NULL,
  Path_File VARCHAR(255) NOT NULL,
  Status ENUM('Draft','Approved','Revisi') DEFAULT 'Draft',
  Is_Deleted TINYINT(1) DEFAULT 0,
  Uploaded_By INT DEFAULT NULL,
  Approved_By INT DEFAULT NULL,
  PRIMARY KEY (ID),
  CONSTRAINT fk_documents_user FOREIGN KEY (Uploaded_By) REFERENCES users(ID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Announcements
CREATE TABLE announcements (
  ID INT NOT NULL AUTO_INCREMENT,
  Judul VARCHAR(255) NOT NULL,
  Isi TEXT NOT NULL,
  Is_Important TINYINT(1) DEFAULT 0,
  Created_By INT DEFAULT NULL,
  Updated_By INT DEFAULT NULL,
  Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ID),
  CONSTRAINT fk_announcements_user FOREIGN KEY (Created_By) REFERENCES users(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Announcement_Reads
CREATE TABLE announcement_reads (
  ID INT NOT NULL AUTO_INCREMENT,
  Announcement_ID INT DEFAULT NULL,
  User_ID INT DEFAULT NULL,
  Is_Read TINYINT(1) DEFAULT 0,
  Read_At DATETIME DEFAULT NULL,
  PRIMARY KEY (ID),
  CONSTRAINT fk_announcement_reads_announcement FOREIGN KEY (Announcement_ID) REFERENCES announcements(ID) ON DELETE CASCADE,
  CONSTRAINT fk_announcement_reads_user FOREIGN KEY (User_ID) REFERENCES users(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel Email_Logs
CREATE TABLE email_logs (
  ID INT NOT NULL AUTO_INCREMENT,
  Announcement_ID INT DEFAULT NULL,
  User_ID INT DEFAULT NULL,
  Attempt_Number INT NOT NULL CHECK (Attempt_Number BETWEEN 1 AND 3),
  Sent_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  Status_Pengiriman ENUM('Terkirim','Gagal') NOT NULL,
  PRIMARY KEY (ID),
  CONSTRAINT fk_email_logs_announcement FOREIGN KEY (Announcement_ID) REFERENCES announcements(ID) ON DELETE CASCADE,
  CONSTRAINT fk_email_logs_user FOREIGN KEY (User_ID) REFERENCES users(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabel InterUKM_Posts
CREATE TABLE interukm_posts (
  ID INT NOT NULL AUTO_INCREMENT,
  UKM_Pengirim VARCHAR(255) NOT NULL,
  Judul VARCHAR(255) NOT NULL,
  Isi_Pengumuman TEXT NOT NULL,
  Status_Persetujuan ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  Date DATETIME DEFAULT CURRENT_TIMESTAMP,
  Created_By INT DEFAULT NULL,
  Approved_By INT DEFAULT NULL,
  PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tabel Audit_Logs & View System_Audit_Logs (Menyimpan JSON Before & After)
CREATE TABLE audit_logs (
  ID INT NOT NULL AUTO_INCREMENT,
  User_ID INT DEFAULT NULL,
  Aksi VARCHAR(100) NOT NULL,
  Modul VARCHAR(100) NOT NULL,
  Detail TEXT DEFAULT NULL COMMENT 'JSON String: {"summary": "...", "before": {...}, "after": {...}}',
  IP_Address VARCHAR(45) DEFAULT NULL,
  User_Agent VARCHAR(255) DEFAULT NULL,
  Created_At DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ID),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (User_ID) REFERENCES users(ID) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE OR REPLACE VIEW system_audit_logs AS
SELECT
  ID,
  User_ID,
  Aksi AS Action_Type,
  Modul AS Target_Table,
  Detail AS Change_Detail_JSON,
  IP_Address,
  User_Agent,
  Created_At
FROM audit_logs;
```

---

## 5. ATURAN BISNIS (BUSINESS RULES) & LOGIKA PEMROSESAN BACKEND

1. **BR-01 (Kelengkapan Dokumen Kegiatan):** Dokumen administrasi kegiatan yang diunggah harus mencakup Proposal, LPJ, dan Bukti Dokumentasi untuk validasi kelengkapan bundel Sipakamase.
2. **BR-02 (Persetujuan Publikasi Inter-UKM):** Pengumuman/acara yang disiarkan ke Hub Inter-UKM wajib mengantongi persetujuan Ketua UKM (`Status_Persetujuan = True`). Jika belum disetujui, REST API menolak request dan mengembalikan `403 Forbidden`.
3. **BR-03 (Ketentuan Anti-Spam Email Fatigue):** Notifikasi email hanya dikirim untuk pengumuman yang ditandai "Penting" (`Is_Important = True`). Pengumuman biasa cukup ditampilkan pada dashboard anggota.
4. **Mekanisme Cron Job Email Terjadwal (`FR-06` / `UC-12`):**
   * **Attempt 1:** Saat pengumuman penting dipublikasikan, email pertama langsung masuk antrean SMTP Queue.
   * **Inisialisasi Scheduler:** Cron job berjalan otomatis setiap 1 jam mengecek tabel `announcement_reads` untuk record dengan `Is_Read = False`.
   * **Attempt 2:** Jika belum dibaca setelah 24 jam sejak pengumuman dibuat dan `Attempt_Number = 1`, backend mengirim email pengingat ke-2 dan mencatat log di `email_logs`.
   * **Attempt 3 (Maksimal):** Jika belum dibaca setelah 48 jam dan `Attempt_Number = 2`, backend mengirim email pengingat ke-3 (batas akhir) dan mencatat log.
   * **Penghentian Otomatis:** Begitu anggota membuka halaman detail pengumuman di UI, frontend memanggil `PUT /api/announcements/:id/read`. Backend memperbarui `Announcement_Reads.Is_Read = True` dan mengisi `Read_At`. Cron job otomatis mengabaikan pengguna ini pada iterasi berikutnya.
5. **Validasi Batas Unggah File (`NFR-PERF-02`):** Frontend dan Backend memvalidasi ukuran berkas LPJ/dokumen. Jika ukuran file > 10 MB, backend mengembalikan status `400 Bad Request` dengan pesan error `"Ukuran File Melebihi Batas 10 MB"`.
6. **Mekanisme Soft-Delete Dokumen:** Penghapusan dokumen di Vault Repositori tidak menghapus berkas fisik/row database secara permanen, melainkan mengeksekusi `UPDATE documents SET Is_Deleted = True WHERE ID = ?`. Berkas disembunyikan dari UI normal namun tetap tersimpan untuk kebutuhan audit dan pemulihan.

---

## 6. INVENTARISASI 22 FRAME & MODAL UI FRONTEND + INTEGRASI REST API

### 1. Authentication & System States

#### **FRAME-01: SIOMAS DAFTAR page design**
* **Role:** Anggota Baru / Pendaftar
* **Elemen Trigger UI:**
  * Tombol `'Kirim Pendaftaran'`
  * Tautan `'Sudah Punya Akun? Login'`
* **Integrasi API Backend:**
  * Method & Endpoint: `POST /api/auth/register`
  * Payload Request: `{ nama, email, password, divisi }`
  * Logika Server: Validasi format email/NIM, hash password via Bcrypt (cost >= 10), simpan user dengan `Status_Keanggotaan = 'Menunggu Verifikasi'`.
  * Response Code: `201 Created`
  * State Transition UI: Redirection ke `FRAME-21` (Halaman Status Menunggu Verifikasi).

#### **FRAME-02: SIOMAS Halaman Login**
* **Role:** All Roles
* **Elemen Trigger UI:**
  * Tombol `'Masuk / Login'`
* **Integrasi API Backend:**
  * Method & Endpoint: `POST /api/auth/login`
  * Payload Request: `{ email, password }`
  * Logika Server: Cari user berdasarkan email, verifikasi hash password via Bcrypt. Jika valid, terbitkan JWT (expiry 24 jam) berisi payload `{ userId, role, status }`.
  * Response Code: `200 OK` (Valid) / `401 Unauthorized` (Kredensial Salah).
  * State Transition UI:
    * Jika `200 OK`: Simpan JWT ke LocalStorage/Cookie, redirect ke `FRAME-03` (Beranda Dashboard).
    * Jika `401`: Redirect ke `FRAME-22` (Halaman Error 401 Unauthorized).

#### **FRAME-21: Halaman Status: Menunggu Verifikasi Admin**
* **Role:** Anggota Baru
* **Elemen Trigger UI:**
  * Tombol `'Kembali ke Login'`
* **Integrasi API Backend:** N/A (Client-side routing ke `FRAME-02`).

#### **FRAME-22: Halaman Error: 401 Unauthorized / Token Expired**
* **Role:** All Roles
* **Elemen Trigger UI:**
  * Tombol `'Login Ulang'`
* **Integrasi API Backend:** Client-side reset token (`localStorage.removeItem('siomas_jwt')`), dilanjutkan routing ke `FRAME-02`.

---

### 2. Core Dashboard & Member Views

#### **FRAME-03: Beranda Dashboard SIOMAS Desktop**
* **Role:** Anggota, Pengurus Divisi, Admin
* **Elemen Trigger UI:**
  * Kartu Pengumuman / `'Lihat Selengkapnya'`
  * Tombol `'+ Buat Pengumuman'` (Hanya Pengurus & Admin)
  * Sidebar Link `'Kalender Agenda'`
  * Sidebar Link `'Vault LPJ & Dokumen'`
  * Sidebar Link `'Hub Inter-UKM'`
  * Header Icon `'Profil Saya'`
* **Integrasi API Backend:**
  * Endpoint Kartu Click: `PUT /api/announcements/:id/read` (Header: `Bearer <JWT>`)
  * Logika Server: Update `Announcement_Reads.Is_Read = True` dan `Read_At = NOW()`.
  * Response Code: `200 OK`
  * State Transition UI: Buka `FRAME-05` (Detail Pengumuman) & bersihkan indikator unread badge.
  * Router Navigasi: Navigasi ke `FRAME-07` (Kalender), `FRAME-11` (Repository), `FRAME-15` (Hub Inter-UKM), atau `FRAME-06` (Profil).

#### **FRAME-04: Modal Pengumuman Baru: Checkbox Penting & Trigger Email**
* **Role:** Pengurus Divisi, Admin
* **Elemen Trigger UI:**
  * Tombol `'Publikasikan'` (Is_Important checked/unchecked)
  * Tombol `'Batal / Batal Simpan'`
* **Integrasi API Backend:**
  * Method & Endpoint: `POST /api/announcements`
  * Payload Request: `{ judul, isi, is_important }`
  * Logika Server: Insert data ke `announcements`. Jika `is_important = True`, masukkan job email Attempt-1 ke BullMQ Queue & catat log di `email_logs`.
  * Response Code: `201 Created`
  * State Transition UI: Tutup modal & tampilkan success toast.

#### **FRAME-05: Halaman Detail Pengumuman & Indikator Status Baca**
* **Role:** Anggota, Pengurus Divisi, Admin
* **Elemen Trigger UI:**
  * Tombol `'Kembali ke Beranda'`
* **Integrasi API Backend:** Data diambil dari `GET /api/announcements/:id`. Panel status menunjukkan konfirmasi pengingat email telah dihentikan.

#### **FRAME-06: Halaman Profil & Akses Jobdesk**
* **Role:** All Active Roles
* **Elemen Trigger UI:**
  * Tombol `'Simpan Perubahan Kontak'`
* **Integrasi API Backend:**
  * Method & Endpoint: `PUT /api/profile`
  * Payload Request: `{ no_whatsapp, instagram, domisili }`
  * Response Code: `200 OK` (Toast: "Profil Berhasil Diperbarui").

---

### 3. Calendar & LPJ Management

#### **FRAME-07: Responsive Calendar Management Page**
* **Role:** Anggota, Pengurus Divisi, Admin
* **Elemen Trigger UI:**
  * Tombol `'+ Tambah Agenda Baru'` (Pengurus Divisi)
  * Event Card Click
* **Integrasi API Backend:**
  * Data Fetch: `GET /api/schedules`
  * Action: Buka Form Kelola Jadwal atau Pop-up Modal Detail Event.

#### **FRAME-08: Modul Koordinator: Unggah Draf LPJ & Dokumentasi**
* **Role:** Pengurus Divisi / Koordinator
* **Elemen Trigger UI:**
  * Tombol `'Unggah LPJ'` (Pengujian Ukuran File)
* **Integrasi API Backend:**
  * Method & Endpoint: `POST /api/documents/upload` (Multipart form-data)
  * Validation Logic:
    * Jika Ukuran File <= 10MB: Simpan fisik ke Cloud Storage, insert row ke `documents` dengan `Status = 'Draft'`, return `201 Created`.
    * Jika Ukuran File > 10MB: Tolak request, return `400 Bad Request` dengan toast error.

#### **FRAME-09: Konsol Admin: Validasi & Approval LPJ Divisi**
* **Role:** Admin / Pengurus Inti
* **Elemen Trigger UI:**
  * Tombol `'Setujui LPJ'`
  * Tombol `'Minta Revisi'`
* **Integrasi API Backend:**
  * Method & Endpoint Setujui: `PATCH /api/documents/:id/status`
  * Payload Request: `{ status: 'Approved' }`
  * Logika Server: Update `Documents.Status = 'Approved'` & pindahkan berkas ke Repository Vault. Return `200 OK`.
  * Tombol Revisi: Buka `FRAME-10` (Modal Catatan Revisi).

#### **FRAME-10: Modal Catatan Revisi LPJ Divisi**
* **Role:** Admin
* **Elemen Trigger UI:**
  * Tombol `'Kirim Catatan Revisi'`
* **Integrasi API Backend:**
  * Method & Endpoint: `PATCH /api/documents/:id/status`
  * Payload Request: `{ status: 'Revisi', catatan_revisi }`
  * Response Code: `200 OK` (Kirim notifikasi revisi ke Koordinator).

---

### 4. Document Repository & Vault

#### **FRAME-11: Responsive Document Repository Page**
* **Role:** Anggota, Pengurus Divisi, Admin
* **Elemen Trigger UI:**
  * Tombol `'Atur Label / Kategorisasi'`
  * Tombol `'Unduh Bundel Sipakamase'`
  * Trash Icon `'Hapus Berkas'` (Admin Only)
* **Integrasi API Backend:**
  * Data Fetch: `GET /api/documents?is_deleted=false`
  * Action Buttons: Buka Modal `FRAME-12`, `FRAME-13`, atau `FRAME-14`.

#### **FRAME-12: Modal Categorization & Labeling Sipakamase**
* **Role:** Admin
* **Elemen Trigger UI:**
  * Tombol `'Simpan Label'`
* **Integrasi API Backend:**
  * Method & Endpoint: `PUT /api/documents/:id/kategori`
  * Payload Request: `{ kategori: 'Proposal' | 'Surat' | 'LPJ' | 'Sipakamase' }`
  * Response Code: `200 OK`.

#### **FRAME-13: Modal Unduh Bundel Dokumen (.ZIP) Sipakamase**
* **Role:** Admin / Pengurus / Anggota
* **Elemen Trigger UI:**
  * Tombol `'Unduh Bundel .ZIP'`
* **Integrasi API Backend:**
  * Method & Endpoint: `GET /api/v1/documents/bundle?kategori=Sipakamase` (Alias: `GET /api/documents/bundle`)
  * Logika Server: Query file aktif (`Is_Deleted = False`) sesuai filter kategori, ambil file fisik dari `Backend/uploads/`, lakukan streaming compression `.zip` menggunakan Python `zipfile` + `io.BytesIO` beserta `MANIFEST_ARSIP_SIOMAS.txt`, catat ke `audit_logs`, dan salurkan binary file download ke browser.
  * Response Code: `200 OK` (`Content-Type: application/zip`).

#### **FRAME-14: Modal Konfirmasi Soft-Delete Berkas Repositori**
* **Role:** Admin
* **Elemen Trigger UI:**
  * Tombol `'Ya, Arsipkan/Hapus'`
  * Tombol `'Batal'`
* **Integrasi API Backend:**
  * Method & Endpoint: `DELETE /api/documents/:id`
  * Logika Server: Execute SQL `UPDATE documents SET Is_Deleted = True WHERE ID = ?`.
  * Response Code: `200 OK` (Toast: "Berkas Berhasil Diarsipkan").

---

### 5. Inter-UKM Hub & Administrative Consoles

#### **FRAME-15: Hub Inter-UKM & Kolaborasi Antar-Lembaga SIOMAS Desktop**
* **Role:** All Active Roles
* **Elemen Trigger UI:**
  * Tombol `'Publikasikan ke Hub Inter-UKM'`
  * Post Card `'Lihat Detail'`
* **Integrasi API Backend:**
  * Click Detail: `GET /api/inter-ukm/posts/:id`
  * Click Publikasikan: Buka `FRAME-16` (Modal Approval Ketua UKM).

#### **FRAME-16: Modal Approval Ketua UKM: Verifikasi Publikasi Inter-UKM**
* **Role:** Admin
* **Elemen Trigger UI:**
  * Tombol `'Setujui & Siarkan'` (Status_Persetujuan = True)
* **Integrasi API Backend:**
  * Method & Endpoint: `POST /api/inter-ukm/posts`
  * Payload Request: `{ ukm_pengirim, judul, isi_pengumuman, status_persetujuan: true }`
  * Logika Server: Cek aturan `BR-02`.
    * Jika `status_persetujuan = true`: Insert ke `interukm_posts`, return `201 Created` & broadcast feed.
    * Jika `false`: Tolak request, return `403 Forbidden` (`"Perlu Persetujuan Ketua UKM"`).

#### **FRAME-17: Konsol Admin: Verifikasi & Manajemen Akses RBAC**
* **Role:** Admin
* **Elemen Trigger UI:**
  * Tombol `'Verifikasi & Aktifkan Akun'`
* **Integrasi API Backend:**
  * Method & Endpoint: `PATCH /api/users/:id/verify`
  * Logika Server: Update `Users.Status_Keanggotaan = 'Aktif'`, memungkinkan pengguna melakukan login.
  * Response Code: `200 OK`.

#### **FRAME-18: Konsol Admin: Log Notifikasi Email Terjadwal & Open-Rate**
* **Role:** Admin (Ketua UKM)
* **Elemen Trigger UI:**
  * Tombol `'Filter Berdasarkan Status / Attempt'` (`Attempt-1`, `Attempt-2`, `Attempt-3`, `Gagal`)
  * Tombol `'⚡ Jalankan Scheduler Pengingat (24j / 48j)'`
  * Tombol `'Ubah Status (Webhook)'`
* **Integrasi API Backend:**
  * Riwayat Log: `GET /api/v1/notifications/email/logs`
  * Eksekusi Scheduler 24j/48j: `POST /api/v1/notifications/email/run-scheduler`
  * Webhook Callback Status SMTP: `POST /api/v1/notifications/email/webhook` (Alias: `POST /api/webhooks/email-status`)
  * Data Source: Tabel `email_logs` & `announcement_reads`.

#### **FRAME-19: Dashboard Eksekutif Admin SIOMAS Desktop**
* **Role:** Admin (Ketua UKM)
* **Elemen Trigger UI:**
  * Kartu `'Akses Konsol Audit Log'` & Tombol `'Ekspor Audit CSV'`
* **Integrasi API Backend:**
  * Method & Endpoint: `GET /api/v1/notifications/audit-logs`
  * Data Source: Tabel `audit_logs` / View `system_audit_logs` (Menampilkan ringkasan aksi serta perbandingan JSON `BEFORE` dan `AFTER`).

#### **FRAME-20: Dashboard Eksekutif Koordinator Divisi SIOMAS Desktop**
* **Role:** Pengurus Divisi
* **Elemen Trigger UI:**
  * Tombol `'Atur Delegasi Tugas & Presensi'`
* **Integrasi API Backend:** Routing ke `Modul Koordinator: Delegasi Tugas & Presensi Divisi`.

---

## 7. MATRIKS PENGUJIAN SISTEM (TEST CASES & REQUIREMENT TRACEABILITY)

| ID Uji | Ref. Requirement | Skenario Pengujian | Hasil Diharapkan Backend & Frontend |
| :--- | :--- | :--- | :--- |
| **TC-01** | FR-01 / UC-01 | Anggota baru mendaftar dengan data lengkap. | Data tersimpan di DB `users` dengan `Status_Keanggotaan = 'Menunggu Verifikasi'`. UI redirect ke status page (`201 Created`). |
| **TC-02** | FR-01 / RBAC | Admin menekan tombol Verifikasi Akun. | `Status_Keanggotaan` berubah menjadi `'Aktif'`. User dapat login (`200 OK`). |
| **TC-03** | FR-02 / UC-04 | Pengurus Divisi menambah agenda baru. | Agenda tersimpan di DB `schedules` dan real-time muncul di kalender anggota (`201 Created`). |
| **TC-04** | FR-03 / UC-12 | Admin mempublikasikan pengumuman. | Indikator unread badge muncul di dashboard anggota tujuan (`201 Created`). |
| **TC-05** | NFR-PERF-02 | Pengurus mengunggah file LPJ 12.8 MB (>10MB). | Backend menolak file dan mengembalikan status `400 Bad Request`. UI menampilkan error toast. |
| **TC-06** | UC-09 / UC-10 | Admin menyetujui LPJ dan soft-delete berkas. | Status LPJ menjadi `'Approved'`. Soft-delete mengubah `Is_Deleted = True` di DB (`200 OK`). |
| **TC-07** | FR-05 / BR-02 | Publikasi Inter-UKM tanpa persetujuan Ketua UKM. | Backend menolak publikasi dengan status `403 Forbidden` (`"Perlu Persetujuan Ketua UKM"`). |
| **TC-08** | NFR-SEC-01 | Mengakses REST API tanpa Header JWT. | Backend menolak request dengan status `401 Unauthorized`. UI redirect ke login page. |
| **TC-09** | FR-06 / UC-12 | Pengumuman penting belum dibaca > 24 jam. | Cron job memicu email Attempt-2. Begitu user membuka detail, `Is_Read` menjadi `True` dan cron job berhenti (`200 OK`). |
| **TC-10** | NFR-PERF-01 | Load testing 100 pengguna aktif bersamaan. | Minimal 95% request direspons dalam waktu < 2 detik pada lingkungan staging. |

---

## 8. RINGKASAN & ROADMAP IMPLEMENTASI
Dokumen PRD ini menyatukan seluruh spesifikasi **UI/UX Frontend (22 Frame/Modal React.js + Vite)** dan **Aturan Teknis Backend (Python Flask Blueprints, SQLAlchemy ORM, PostgreSQL / MySQL 10 Tabel DDL, Background Cron Scheduler Email Attempt 1–3, Kompresi Bundel ZIP, dan System Audit Logs JSON Before/After)**. Dokumen ini menjadi acuan tunggal (*single source of truth*) yang sinkron 100% dengan kode sumber aplikasi SIOMAS.
