-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 26 Sep 2026 pada 08.21
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `siomas`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `announcements`
--

CREATE TABLE `announcements` (
  `ID` int(11) NOT NULL,
  `Judul` varchar(255) NOT NULL,
  `Isi` text NOT NULL,
  `Is_Important` tinyint(1) DEFAULT 0,
  `Created_By` int(11) DEFAULT NULL,
  `Created_At` datetime DEFAULT current_timestamp(),
  `Updated_By` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `announcement_reads`
--

CREATE TABLE `announcement_reads` (
  `ID` int(11) NOT NULL,
  `Announcement_ID` int(11) DEFAULT NULL,
  `User_ID` int(11) DEFAULT NULL,
  `Is_Read` tinyint(1) DEFAULT 0,
  `Read_At` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `documents`
--

CREATE TABLE `documents` (
  `ID` int(11) NOT NULL,
  `Nama_Berkas` varchar(255) NOT NULL,
  `Kategori` enum('LPJ','Proposal','Sipakamase','Surat') NOT NULL,
  `Path_File` varchar(255) NOT NULL,
  `Status` enum('Draft','Approved','Revisi') DEFAULT 'Draft',
  `Is_Deleted` tinyint(1) DEFAULT 0,
  `Uploaded_By` int(11) DEFAULT NULL,
  `Approved_By` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `email_logs`
--

CREATE TABLE `email_logs` (
  `ID` int(11) NOT NULL,
  `Announcement_ID` int(11) DEFAULT NULL,
  `User_ID` int(11) DEFAULT NULL,
  `Attempt_Number` int(11) DEFAULT NULL CHECK (`Attempt_Number` between 1 and 3),
  `Sent_At` datetime DEFAULT current_timestamp(),
  `Status_Pengiriman` enum('Terkirim','Gagal') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `interukm_posts`
--

CREATE TABLE `interukm_posts` (
  `ID` int(11) NOT NULL,
  `UKM_Pengirim` varchar(255) NOT NULL,
  `Judul` varchar(255) NOT NULL,
  `Isi_Pengumuman` text NOT NULL,
  `Status_Persetujuan` varchar(255) NOT NULL,
  `Date` datetime DEFAULT current_timestamp(),
  `Created_By` int(11) DEFAULT NULL,
  `Approved_By` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `permissions`
--

CREATE TABLE `permissions` (
  `ID` int(11) NOT NULL,
  `Nama_Akses` varchar(100) NOT NULL,
  `Deskripsi` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `permissions`
--

INSERT INTO `permissions` (`ID`, `Nama_Akses`, `Deskripsi`) VALUES
(1, 'buat_pengumuman', 'Bisa membuat pengumuman di dashboard'),
(2, 'kirim_email', 'Bisa memicu/mengirim notifikasi email'),
(3, 'unggah_dokumen', 'Bisa mengunggah dokumen/LPJ'),
(4, 'setujui_dokumen', 'Bisa mengubah status dokumen menjadi Approved/Revisi'),
(5, 'buat_jadwal', 'Bisa menambahkan jadwal kegiatan baru'),
(6, 'buat_interukm', 'Bisa membuat draft postingan lintas UKM'),
(7, 'setujui_interukm', 'Bisa menyetujui publikasi lintas UKM (Hak Ketua)'),
(8, 'baca_pengumuman', 'Bisa membaca pengumuman'),
(9, 'lihat_jadwal', 'Bisa melihat kalender jadwal');

-- --------------------------------------------------------

--
-- Struktur dari tabel `role_permissions`
--

CREATE TABLE `role_permissions` (
  `ID` int(11) NOT NULL,
  `Role_Name` enum('Admin','Pengurus','Anggota') NOT NULL,
  `Permission_ID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `role_permissions`
--

INSERT INTO `role_permissions` (`ID`, `Role_Name`, `Permission_ID`) VALUES
(1, 'Admin', 1),
(2, 'Admin', 2),
(3, 'Admin', 3),
(4, 'Admin', 4),
(5, 'Admin', 5),
(6, 'Admin', 6),
(7, 'Admin', 7),
(8, 'Admin', 8),
(9, 'Admin', 9),
(10, 'Pengurus', 1),
(11, 'Pengurus', 3),
(12, 'Pengurus', 5),
(13, 'Pengurus', 6),
(14, 'Pengurus', 8),
(15, 'Pengurus', 9),
(16, 'Anggota', 8),
(17, 'Anggota', 9);

-- --------------------------------------------------------

--
-- Struktur dari tabel `schedules`
--

CREATE TABLE `schedules` (
  `ID` int(11) NOT NULL,
  `Judul_Kegiatan` varchar(255) NOT NULL,
  `Kategori` varchar(100) DEFAULT NULL,
  `Waktu` datetime NOT NULL,
  `Lokasi` varchar(255) DEFAULT NULL,
  `Keterangan` text DEFAULT NULL,
  `Divisi_ID` int(11) DEFAULT NULL,
  `Updated_By` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `ID` int(11) NOT NULL,
  `Nama` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Password_Hash` varchar(255) NOT NULL,
  `Role` enum('Admin','Pengurus','Anggota') NOT NULL,
  `Job_Desc` varchar(255) DEFAULT NULL,
  `Status_Keanggotaan` enum('Aktif','Alumni') NOT NULL,
  `Created_At` datetime DEFAULT current_timestamp(),
  `Created_By` int(11) DEFAULT NULL,
  `Updated_By` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `Created_By` (`Created_By`),
  ADD KEY `Updated_By` (`Updated_By`);

--
-- Indeks untuk tabel `announcement_reads`
--
ALTER TABLE `announcement_reads`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `Announcement_ID` (`Announcement_ID`),
  ADD KEY `User_ID` (`User_ID`);

--
-- Indeks untuk tabel `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `Uploaded_By` (`Uploaded_By`),
  ADD KEY `Approved_By` (`Approved_By`);

--
-- Indeks untuk tabel `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `Announcement_ID` (`Announcement_ID`),
  ADD KEY `User_ID` (`User_ID`);

--
-- Indeks untuk tabel `interukm_posts`
--
ALTER TABLE `interukm_posts`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `Created_By` (`Created_By`),
  ADD KEY `Approved_By` (`Approved_By`);

--
-- Indeks untuk tabel `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `Nama_Akses` (`Nama_Akses`);

--
-- Indeks untuk tabel `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `Permission_ID` (`Permission_ID`);

--
-- Indeks untuk tabel `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `Divisi_ID` (`Divisi_ID`),
  ADD KEY `Updated_By` (`Updated_By`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD KEY `Created_By` (`Created_By`),
  ADD KEY `Updated_By` (`Updated_By`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `announcements`
--
ALTER TABLE `announcements`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `announcement_reads`
--
ALTER TABLE `announcement_reads`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `documents`
--
ALTER TABLE `documents`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `email_logs`
--
ALTER TABLE `email_logs`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `interukm_posts`
--
ALTER TABLE `interukm_posts`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `permissions`
--
ALTER TABLE `permissions`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT untuk tabel `schedules`
--
ALTER TABLE `schedules`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`Created_By`) REFERENCES `users` (`ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `announcements_ibfk_2` FOREIGN KEY (`Updated_By`) REFERENCES `users` (`ID`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `announcement_reads`
--
ALTER TABLE `announcement_reads`
  ADD CONSTRAINT `announcement_reads_ibfk_1` FOREIGN KEY (`Announcement_ID`) REFERENCES `announcements` (`ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `announcement_reads_ibfk_2` FOREIGN KEY (`User_ID`) REFERENCES `users` (`ID`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`Uploaded_By`) REFERENCES `users` (`ID`) ON DELETE SET NULL,
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`Approved_By`) REFERENCES `users` (`ID`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `email_logs`
--
ALTER TABLE `email_logs`
  ADD CONSTRAINT `email_logs_ibfk_1` FOREIGN KEY (`Announcement_ID`) REFERENCES `announcements` (`ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `email_logs_ibfk_2` FOREIGN KEY (`User_ID`) REFERENCES `users` (`ID`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `interukm_posts`
--
ALTER TABLE `interukm_posts`
  ADD CONSTRAINT `interukm_posts_ibfk_1` FOREIGN KEY (`Created_By`) REFERENCES `users` (`ID`) ON DELETE SET NULL,
  ADD CONSTRAINT `interukm_posts_ibfk_2` FOREIGN KEY (`Approved_By`) REFERENCES `users` (`ID`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`Permission_ID`) REFERENCES `permissions` (`ID`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`Divisi_ID`) REFERENCES `users` (`ID`) ON DELETE SET NULL,
  ADD CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`Updated_By`) REFERENCES `users` (`ID`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`Created_By`) REFERENCES `users` (`ID`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`Updated_By`) REFERENCES `users` (`ID`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
