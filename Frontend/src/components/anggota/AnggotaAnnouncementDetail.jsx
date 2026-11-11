import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Bell,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { announcementsApi } from '../../services/api.js';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function extractDateOnly(rawTanggal, createdAt) {
  if (rawTanggal && !rawTanggal.includes(':')) {
    return rawTanggal;
  }
  const source = createdAt || rawTanggal;
  if (source) {
    const d = new Date(source);
    if (!isNaN(d.getTime())) {
      return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (typeof rawTanggal === 'string' && rawTanggal.includes(',')) {
      return rawTanggal.split(',')[0].trim();
    }
  }
  const now = new Date();
  return `${DAYS_ID[now.getDay()]}, ${now.getDate()} ${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()}`;
}

function extractTimeOnly(rawWaktu, rawTanggal, createdAt) {
  if (rawWaktu && rawWaktu !== 'Sesuai jadwal') {
    return rawWaktu.toUpperCase().includes('WITA') ? rawWaktu : `${rawWaktu} WITA`;
  }
  // If rawTanggal accidentally had ", HH:mm", extract it
  if (typeof rawTanggal === 'string' && rawTanggal.includes(':')) {
    const match = rawTanggal.match(/(\d{1,2}:\d{2})/);
    if (match) return `${match[1]} WITA`;
  }
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WITA`;
    }
  }
  return '09:00 WITA';
}

function getInitials(name = 'Admin UKM') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || 'AU').slice(0, 2).toUpperCase();
}

export default function AnggotaAnnouncementDetail({ announcement, onBack }) {
  const [data] = useState(
    announcement || {
      id: 1,
      judul: 'Rapat Koordinasi Akhir Semester',
      isi: 'Halo, seluruh anggota SIOMAS. Sehubungan dengan berakhirnya rangkaian program kerja semester ganjil, kami mengundang seluruh pengurus dan anggota untuk hadir dalam rapat koordinasi serta evaluasi akhir semester.',
      is_important: true,
      category: 'Manajemen',
      tanggal: 'Jumat, 22 November 2026',
      waktu: '15:30 WITA',
      lokasi: 'Kampus SIOMAS',
      peserta: 'Seluruh anggota aktif',
      publisher: 'Dipublikasikan Pengurus UKM',
      authorName: 'Ketua UKM',
      authorRole: 'Pengurus / Ketua UKM'
    }
  );

  useEffect(() => {
    if (data?.id) {
      announcementsApi.markRead(data.id, true).catch(() => {});
    }
  }, [data?.id]);

  const displayTanggal = extractDateOnly(data.tanggal, data.created_at);
  const displayWaktu = extractTimeOnly(data.waktu, data.tanggal, data.created_at);
  const now = new Date();
  const defaultReadAt = `${now.getDate()} ${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WITA`;

  return (
    <div>
      {/* Back button */}
      <button type="button" className="back-link-btn" onClick={onBack}>
        <ChevronLeft size={16} /> Kembali ke Beranda
      </button>

      {/* Header Info */}
      <div className="page-header-block">
        <span className="page-category-tag">PENGUMUMAN • SUDAH DIBACA</span>
        <h1 className="page-title">{data.judul}</h1>
        <p className="page-subtitle">
          {data.publisher || `Dipublikasikan oleh ${data.authorName || 'Pengurus UKM'} • ${displayTanggal}, ${displayWaktu}`}
        </p>
      </div>

      <div className="detail-layout-grid">
        {/* Left: Main Content */}
        <div className="detail-main-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div className="announcement-icon-badge announcement-icon-blue" style={{ width: '44px', height: '44px', borderRadius: '12px' }}>
              <Bell size={22} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {data.is_important && <span className="tag-badge tag-red">PENTING</span>}
              <span className="tag-badge tag-gray">{(data.category || data.kategori || 'MANAJEMEN').toUpperCase()}</span>
            </div>
          </div>

          <p style={{ color: '#334155', fontSize: '15px', lineHeight: '1.7', marginBottom: '20px', whiteSpace: 'pre-line' }}>
            {data.isi}
          </p>

          {/* 4 Metadata Tiles Grid */}
          <div className="meta-grid-tiles">
            <div className="meta-tile">
              <Calendar size={20} className="meta-tile-icon" />
              <div>
                <div className="meta-tile-label">Tanggal</div>
                <div className="meta-tile-value">{displayTanggal}</div>
              </div>
            </div>

            <div className="meta-tile">
              <Clock size={20} className="meta-tile-icon" />
              <div>
                <div className="meta-tile-label">Waktu</div>
                <div className="meta-tile-value">{displayWaktu}</div>
              </div>
            </div>

            <div className="meta-tile">
              <MapPin size={20} className="meta-tile-icon" />
              <div>
                <div className="meta-tile-label">Lokasi</div>
                <div className="meta-tile-value">{data.lokasi || 'Kampus SIOMAS'}</div>
              </div>
            </div>

            <div className="meta-tile">
              <Users size={20} className="meta-tile-icon" />
              <div>
                <div className="meta-tile-label">Peserta</div>
                <div className="meta-tile-value">{data.peserta || 'Seluruh anggota aktif'}</div>
              </div>
            </div>
          </div>

          <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginTop: '16px' }}>
            Mohon setiap divisi menyiapkan ringkasan capaian, kendala, dan rekomendasi program. Kehadiran akan dicatat melalui sistem presensi SIOMAS.
          </p>

          {/* Author Card Footer */}
          <div className="author-info-card">
            <div className="author-left">
              <div className="portal-avatar-init" style={{ background: '#EEF2FF', color: '#4F46E5', width: '40px', height: '40px' }}>
                {getInitials(data.authorName || 'Ketua UKM')}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  {data.authorName || 'Ketua UKM'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {data.authorRole || 'Pengurus / Ketua UKM'}
                </div>
              </div>
            </div>

            <span className="tag-badge tag-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Terverifikasi
            </span>
          </div>
        </div>

        {/* Right: Read Status Card */}
        <div>
          <div className="portal-card" style={{ borderLeft: '4px solid #10B981' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <CheckCircle2 size={22} />
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Status terbaca
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', marginBottom: '18px' }}>
              Status Announcement_Reads telah diperbarui. Pengingat email untuk pengumuman ini dihentikan.
            </p>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px', fontSize: '12.5px', color: '#475569' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Dibaca pada: </span>
                <strong>{data.readAt || defaultReadAt}</strong>
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Jangkauan: </span>
                <strong>{data.reach || `${Math.max(1, data.read_count || 1)} anggota telah membaca`}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
