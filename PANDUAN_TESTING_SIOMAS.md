# Panduan Alur Testing End-to-End SIOMAS

Dokumen ini berisi daftar langkah pengujian (*testing*) seluruh fitur aplikasi **SIOMAS** secara berurutan, mulai dari aksi **Anggota**, **Pengurus Divisi**, proses verifikasi oleh **Ketua UKM / Admin**, hingga pengecekan hasil verifikasinya.

---

## Daftar Akun untuk Testing

| Peran (Role) | Email | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Anggota** | `anggota@siomas.com` *(atau `indiraramayani14@gmail.com`)* | `anggota123` *(atau password registrasi)* | Melihat beranda, mengajukan kolaborasi/publikasi Inter-UKM, melihat kalender agenda, dan mengunduh berkas LPJ tervalidasi |
| **Pengurus Divisi** | `pengurus@siomas.com` | `pengurus123` | Semua akses Anggota **+** membuat pengumuman (*broadcast*), membuat jadwal agenda, dan mengunggah dokumen LPJ |
| **Ketua UKM / Admin** | `admin@siomas.com` *(atau `ketua@siomas.com`)* | `admin123` *(atau `ketua123`)* | Memverifikasi akun baru, memvalidasi LPJ, memverifikasi pengumuman Sipakamase, menyetujui publikasi Inter-UKM, melihat Audit Log, Log Notifikasi, dan Dashboard Eksekutif |

---

## ALUR 1: Pendaftaran Akun Baru & Verifikasi Akses (UC-01 & UC-02)
Menguji pendaftaran anggota baru yang berstatus **Pending** hingga diaktifkan oleh **Ketua UKM / Admin**.

### 1. Daftar Akun Baru (Sebagai Calon Anggota)
1. Buka halaman **Login**, lalu klik **Daftar Sekarang (Registrasi)**.
2. Isi **Nama Lengkap**, **Email** (contoh: `budi@siomas.com`), **Password**, dan pilih Role **Anggota** (atau **Pengurus**).
3. Klik tombol **Daftar**.
4. **Cek Sebelum Verifikasi**: Coba langsung login menggunakan `budi@siomas.com`. Sistem akan menolak login karena akun masih berstatus *Pending* dan menunggu verifikasi Admin/Ketua.

### 2. Tempat Verifikasi (Login sebagai Ketua/Admin: `admin@siomas.com`)
1. Perhatikan sidebar kiri pada menu **Manajemen Akses**: akan muncul **badge merah** berisi jumlah akun *Pending*.
2. Klik menu **Manajemen Akses**.
3. Cari akun `budi@siomas.com` (status: **Menunggu**), lalu klik tombol **Setujui / Aktifkan**.
4. *(Opsional)* Di halaman yang sama, uji juga fitur **Ubah Peran** (mengubah Anggota menjadi Pengurus Divisi) atau **Cabut Akses** (menonaktifkan akun).

### 3. Tempat Melihat Hasil Verifikasi
1. Logout dari Admin, lalu login kembali menggunakan akun `budi@siomas.com`. Akun kini berhasil masuk ke Portal sesuai perannya.
2. Pada akun Admin (`admin@siomas.com`), buka menu **Audit Log** untuk melihat catatan riwayat verifikasi akun tersebut.

---

## ALUR 2: Publikasi & Permintaan Kolaborasi Hub Inter-UKM (UC-11 / BR-02)
Menguji pengajuan publikasi/kolaborasi dari **Anggota** atau **Pengurus Divisi** (lengkap dengan unggah foto sampul & dokumen proposal), verifikasi oleh **Ketua UKM**, hingga tampil di **Feed Hub Inter-UKM**.

### 1. Ajukan Publikasi / Kolaborasi (Login sebagai Anggota: `anggota@siomas.com`)
1. Buka menu **Hub Inter-UKM** di sidebar kiri.
2. **Opsi A — Form Publikasi Lengkap (Gambar & Proposal)**:
   - Klik tombol **+ Publikasikan ke Hub** di kanan atas banner.
   - Isi **Judul Publikasi**, **Kategori**, **Target Publikasi**, **Deskripsi Kegiatan**, **Tanggal Pelaksanaan**, **Lokasi**, **Nama Narahubung**, dan **Nomor WhatsApp**.
   - Klik **Pilih Berkas** untuk melampirkan file proposal (`.pdf`/`.docx`) dan klik **Pilih Foto** untuk melampirkan gambar kegiatan (`.jpg`/`.png`).
   - Centang kotak persetujuan **BR-02**, lalu klik **Ajukan Persetujuan**.
3. **Opsi B — Modal Permintaan Kolaborasi Cepat**:
   - Pada kartu kanan bawah *"Punya ide kolaborasi?"*, klik tombol **Buat Permintaan Kolaborasi**.
   - Isi formulir, lampirkan berkas proposal melalui tombol **Pilih Berkas**, lalu klik **Ajukan Persetujuan**.
4. **Cek Sebelum Verifikasi**: Publikasi yang baru diajukan belum tampil di feed publik Anggota karena statusnya masih *Pending*.

### 2. Tempat Verifikasi (WAJIB Logout dari Anggota & Login sebagai Ketua/Admin: `admin@siomas.com` / `admin123`)
> **Penting**: Tombol **Setujui & Siarkan** hanya muncul di akun **Ketua UKM / Admin** (`admin@siomas.com`), **bukan** di akun Anggota (`anggota@siomas.com`). Di akun Anggota hanya akan tertulis status *Menunggu Verifikasi*.

1. **Logout** dari akun Anggota, lalu **Login** menggunakan akun Ketua/Admin (`admin@siomas.com` / `admin123`).
2. Buka menu **Hub Inter-UKM** di sidebar kiri (terdapat badge merah jumlah publikasi *Pending*).
3. Publikasi yang baru diajukan akan tampil di urutan teratas:
   - Anda bisa langsung mengklik tombol hijau **`✓ Setujui & Siarkan`** atau tombol merah **`Tolak`** di bagian bawah kartu publikasi.
   - Atau klik **`Lihat Detail`** terlebih dahulu untuk memeriksa gambar sampul & membuka berkas proposal, lalu klik tombol hijau **`✓ Setujui & Siarkan`** pada banner kuning di bagian atas halaman detail.

### 3. Tempat Melihat Hasil Verifikasi
1. Login sebagai **Anggota** (`anggota@siomas.com`), **Pengurus Divisi** (`pengurus@siomas.com`), atau **Ketua** (`admin@siomas.com`).
2. Buka menu **Hub Inter-UKM**: publikasi kini berstatus hijau **Published** dan tampil di feed semua pengguna.
3. Klik **Lihat Detail** pada publikasi tersebut:
   - Gambar sampul yang diunggah tampil di bagian atas kartu detail.
   - Informasi **Pelaksanaan**, **Tempat**, dan **Contact Person** tampil sesuai input.
   - Tombol **Buka Berkas / Pratinjau** dapat diklik untuk membuka/mengunduh file proposal.
   - Tombol **Nyatakan Ketertarikan** dan **Hubungi Narahubung** dapat digunakan oleh anggota.

---

## ALUR 3: Unggah LPJ & Validasi Keuangan/Dokumen (UC-07, UC-08, UC-09 / BR-03)
Menguji pengunggahan dokumen Laporan Pertanggungjawaban (LPJ) oleh **Pengurus Divisi**, validasi oleh **Ketua UKM**, dan pengunduhan dokumen tervalidasi oleh **Anggota**.

> **Catatan Hak Akses**: Role **Anggota** hanya dapat melihat & mengunduh LPJ yang sudah divalidasi. Pengunggahan LPJ baru dilakukan oleh role **Pengurus Divisi**.

### 1. Unggah Dokumen LPJ Baru (Login sebagai Pengurus Divisi: `pengurus@siomas.com`)
1. Buka menu **Unggah & Riwayat LPJ** (atau **Vault Dokumen & LPJ**) di sidebar kiri.
2. Klik tombol **+ Unggah LPJ Baru**.
3. Isi **Nama Kegiatan / Judul LPJ** dan **Total Realisasi Anggaran (Rp)** (contoh: `5000000`).
4. Klik **Pilih Berkas** untuk melampirkan file LPJ (`.pdf` atau `.docx`).
5. Klik **Kirim untuk Validasi**.
6. **Cek Sebelum Verifikasi**: Pada daftar riwayat LPJ Pengurus Divisi, status dokumen adalah **Pending / Menunggu Validasi**.

### 2. Tempat Verifikasi (Login sebagai Ketua/Admin: `admin@siomas.com`)
1. Perhatikan sidebar kiri pada menu **Validasi LPJ**: akan muncul **badge merah** sesuai jumlah LPJ yang menunggu pemeriksaan.
2. Klik menu **Validasi LPJ**.
3. Pilih LPJ yang baru diunggah oleh Pengurus Divisi:
   - **Skenario Revisi**: Klik **Tolak / Minta Revisi** dan tuliskan alasan/catatan revisi (contoh: *"Lampiran nota konsumsi belum lengkap"*).
   - **Skenario Setuju**: Klik **Setujui / Validasi LPJ**.

### 3. Tempat Melihat Hasil Verifikasi
1. **Di Akun Ketua/Admin (`admin@siomas.com`)**:
   - Badge merah pada menu **Validasi LPJ** berkurang/hilang.
   - Buka menu **Dashboard Eksekutif**: jumlah **LPJ Tervalidasi**, persentase kepatuhan LPJ, dan **Total Anggaran Tervalidasi** otomatis bertambah.
2. **Di Akun Pengurus Divisi (`pengurus@siomas.com`)**:
   - Buka **Unggah & Riwayat LPJ**: status dokumen berubah menjadi **Valid / Disetujui** (hijau) atau **Revisi** (merah beserta catatan revisi dari Ketua).
3. **Di Akun Anggota (`anggota@siomas.com`)**:
   - Buka menu **Vault Dokumen & LPJ**: dokumen LPJ yang telah divalidasi kini muncul di arsip dan dapat diunduh melalui tombol **Unduh**.

---

## ALUR 4: Pengumuman Broadcast & Verifikasi Dokumen Sipakamase (UC-03, UC-05, UC-08)

Di SIOMAS, fitur **Pengumuman Broadcast** dan **Verifikasi Dokumen Sipakamase** memiliki alur masing-masing sebagai berikut:

### Bagian A — Pengumuman Broadcast (UC-03 & UC-05)
1. **Buat Pengumuman (Login sebagai Pengurus Divisi `pengurus@siomas.com` atau Ketua `admin@siomas.com`)**:
   - Buka menu **Beranda**, lalu klik tombol **+ Buat Pengumuman** di kanan atas.
   - Isi **Judul Pengumuman**, pilih **Kategori**, dan tulis **Isi Pengumuman**.
   - Centang **Tandai Penting & Kirim Notifikasi Email** jika ingin memicu pengiriman notifikasi email ke seluruh anggota aktif.
   - Klik **Publikasikan**.
2. **Tempat Melihat Hasil**:
   - Pengumuman yang dipublikasikan **langsung tayang** pada bagian **Pengumuman Terbaru** di **Beranda** seluruh role (**Anggota**, **Pengurus Divisi**, dan **Ketua UKM**).
   - Jika opsi *Tandai Penting & Kirim Notifikasi Email* dicentang, login ke akun **Ketua/Admin (`admin@siomas.com`)** dan buka menu **Log Notifikasi** untuk melihat riwayat pengiriman email pengumuman tersebut ke setiap anggota.

---

### Bagian B — Verifikasi Dokumen Sipakamase (UC-08)
Menu **Verifikasi Sipakamase** pada akun Ketua UKM digunakan khusus untuk memeriksa **bundel dokumen administrasi berlabel `Sipakamase`** yang diunggah oleh Pengurus Divisi.

1. **Unggah Dokumen Sipakamase (Login sebagai Pengurus Divisi: `pengurus@siomas.com`)**:
   - Buka menu **Vault LPJ & Dokumen** di sidebar kiri.
   - Klik tombol **Unggah Dokumen** di kanan atas.
   - Isi **Nama Dokumen** (contoh: *Bundel Administrasi Sipakamase Semester Ganjil*).
   - Pada kolom **Label**, pastikan memilih **`Sipakamase`** (secara default sudah terpilih `Sipakamase`).
   - Pilih **Divisi**, klik kotak unggah untuk memilih file (`.pdf` atau `.docx`), lalu klik **Unggah Dokumen**.
   - **Cek Sebelum Verifikasi**: Di tabel **Vault LPJ & Dokumen**, dokumen tersebut tampil dengan label **Sipakamase** dan status **Draft** (oranye).
2. **Tempat Verifikasi (Login sebagai Ketua/Admin: `admin@siomas.com`)**:
   - Perhatikan sidebar kiri pada menu **Verifikasi Sipakamase**: kini muncul **badge merah angka `1`**.
   - Klik menu **Verifikasi Sipakamase**.
   - Dokumen yang baru diunggah oleh Pengurus Divisi akan muncul pada kolom kiri **Antrean Sipakamase**.
   - Anda dapat mengklik **Unduh Berkas** di kolom tengah untuk memeriksa file, lalu pada kolom kanan **Checklist Verifikasi**:
     - **Skenario Setuju**: Klik tombol **`✓ Setujui Sipakamase`**.
     - **Skenario Minta Perbaikan**: Klik tombol **`✏️ Minta Perbaikan`**, pilih jenis temuan, isi catatan perbaikan, lalu klik **Kirim Catatan Perbaikan**.
3. **Tempat Melihat Hasil Verifikasi**:
   - Login kembali sebagai **Pengurus Divisi (`pengurus@siomas.com`)** dan buka menu **Vault LPJ & Dokumen**:
     - Jika **Disetujui**, status dokumen berubah menjadi hijau **`Approved`**.
     - Jika **Diminta Perbaikan**, status dokumen berubah menjadi merah **`Revisi`** lengkap dengan pesan catatan perbaikan dari Ketua/Admin tepat di bawah nama dokumen.
   - Jika login sebagai **Anggota (`anggota@siomas.com`)** dan membuka **Vault Dokumen & LPJ**, dokumen Sipakamase yang telah disetujui (`Approved`) dapat dilihat dan diunduh.

---

## ALUR 5: Pembuatan Jadwal Kegiatan & Kalender Agenda (UC-05 & UC-06)
Menguji penambahan agenda kegiatan organisasi dan sinkronisasinya ke seluruh tampilan kalender.

### 1. Tambah Jadwal Kegiatan (Login sebagai Pengurus Divisi `pengurus@siomas.com` atau Ketua `admin@siomas.com`)
1. Buka menu **Kalender Agenda** di sidebar kiri.
2. Klik tombol **+ Tambah Jadwal / Kegiatan**.
3. Isi **Judul Kegiatan** (contoh: *Rapat Koordinasi Akhir Bulan*), **Tanggal & Waktu**, **Lokasi** (contoh: *Ruang Sekretariat*), **Kategori**, dan **Deskripsi**.
4. Klik **Simpan Jadwal**.

### 2. Tempat Melihat Hasil
Login sebagai **Anggota** (`anggota@siomas.com`), **Pengurus Divisi**, atau **Ketua**:
1. **Menu Beranda**:
   - Angka pada kartu statistik **Agenda Mendatang** bertambah.
   - Tanggal kegiatan pada mini-kalender kanan bawah memiliki titik penanda (*dot*).
   - Daftar **Agenda Terdekat** menampilkan kegiatan yang baru dibuat.
2. **Menu Kalender Agenda**:
   - Tanggal pada kalender utama menampilkan agenda tersebut; klik tanggalnya untuk melihat detail waktu dan lokasi.
3. **Menu Hub Inter-UKM**:
   - Widget **Agenda Bersama** di sidebar kanan menampilkan daftar jadwal kegiatan terdekat.

---

## ALUR 6: Monitoring Sistem oleh Ketua UKM / Admin (UC-10, UC-12, UC-13)
Setelah menjalankan Alur 1 hingga Alur 5, login sebagai **Ketua/Admin (`admin@siomas.com`)** untuk memeriksa ketiga menu pemantauan berikut:

1. **Dashboard Eksekutif**
   - Menampilkan metrik organisasi secara *real-time* dari database PostgreSQL: total anggota aktif, jumlah agenda kegiatan, persentase kepatuhan LPJ, total serapan anggaran tervalidasi, serta aktivitas terbaru.
2. **Log Notifikasi**
   - Menampilkan riwayat pengiriman notifikasi sistem/WhatsApp/Email dari setiap pengumuman, jadwal kegiatan, dan validasi yang telah dilakukan.
3. **Audit Log**
   - Menampilkan rekam jejak keamanan (*security & activity log*) secara kronologis: siapa yang login, siapa yang mengunggah LPJ, siapa yang memverifikasi akun/publikasi, lengkap dengan *timestamp* dan alamat IP.

