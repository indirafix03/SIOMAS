import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  FileText, 
  Users, 
  Eye, 
  ChevronRight, 
  Bell, 
  ArrowRight,
  Clock,
  MapPin
} from 'lucide-react';
import { announcementsApi, schedulesApi } from '../../services/api.js';

export default function AnggotaDashboard({ currentUser, onNavigate, onSelectAnnouncement }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default fallback data matching mockup exactly
  const defaultAnnouncements = [
    {
      id: 1,
      judul: 'Rapat Koordinasi Akhir Semester',
      isi: 'Halo, seluruh anggota SIOMAS. Sehubungan dengan berakhirnya rangkaian program kerja semester ganjil, kami mengundang seluruh pengurus dan anggota untuk hadir dalam rapat koordinasi serta evaluasi akhir semester.',
      is_important: true,
      category: 'Manajemen',
      time: 'Hari ini, 09:24',
      is_read: false,
      tanggal: 'Jumat, 22 November 2024',
      waktu: '15:30–17:30 WITA',
      lokasi: 'Aula Gedung C',
      peserta: 'Seluruh anggota aktif',
      publisher: 'Divisi Manajemen • 18 November 2024, 09:24 WITA',
      authorName: 'Nabila Putri',
      authorRole: 'Ketua UKM SIOMAS'
    },
    {
      id: 2,
      judul: 'Pendaftaran Volunteer SIOMAS Fest 2024',
      isi: 'Kami membuka kesempatan bagi anggota untuk menjadi bagian dari kepanitiaan acara terbesar tahun ini. Berbagai divisi teknis dan kreatif siap menerima kontribusi aktif Anda.',
      is_important: false,
      category: 'Acara',
      time: 'Kemarin, 15:40',
      is_read: true,
      tanggal: '25–27 November 2024',
      waktu: '08:00–18:00 WITA',
      lokasi: 'Lapangan Utama Kampus',
      peserta: 'Anggota terdaftar',
      publisher: 'Divisi Acara • 17 November 2024, 15:40 WITA',
      authorName: 'Rian Maulana',
      authorRole: 'Koordinator Acara'
    },
    {
      id: 3,
      judul: 'Pembaruan Panduan Administrasi & LPJ',
      isi: 'Panduan terbaru mengenai pengajuan proposal kegiatan dan pelaporan LPJ periode akhir kini tersedia dan dapat diunduh di Repository Vault.',
      is_important: false,
      category: 'Administrasi',
      time: '15 Nov 2024',
      is_read: true,
      tanggal: 'Mulai berlaku 15 Nov 2024',
      waktu: 'Fleksibel',
      lokasi: 'Online Repository',
      peserta: 'Seluruh Divisi',
      publisher: 'Sekretariat • 15 November 2024',
      authorName: 'Sarah Amalia',
      authorRole: 'Sekretaris Jenderal'
    }
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const res = await announcementsApi.getAll();
        if (res.ok && res.data && res.data.data && res.data.data.length > 0) {
          // Merge API data with rich mockup details
          const merged = res.data.data.map((item, idx) => ({
            ...defaultAnnouncements[idx % defaultAnnouncements.length],
            id: item.id || item.ID,
            judul: item.judul || item.Judul,
            isi: item.isi || item.Isi,
            is_important: item.is_important || item.Is_Important,
            is_read: item.is_read !== undefined ? item.is_read : false
          }));
          setAnnouncements(merged);
        } else {
          setAnnouncements(defaultAnnouncements);
        }
      } catch {
        setAnnouncements(defaultAnnouncements);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const firstName = currentUser?.nama ? currentUser.nama.split(' ')[0] : 'Ardi';

  return (
    <div>
      {/* Date & Welcome Heading */}
      <div className="page-header-block">
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5', display: 'block', marginBottom: '4px' }}>
          Senin, 18 November 2024
        </span>
        <h1 className="page-title">Selamat datang, {firstName}</h1>
        <p className="page-subtitle">Berikut ringkasan aktivitas organisasi kamu hari ini.</p>
      </div>

      {/* 4 Stat Cards */}
      <div className="portal-stats-grid">
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-purple">
            <CalendarIcon size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Agenda mendatang</span>
            <span className="portal-stat-number">8</span>
            <span className="portal-stat-subtext purple">+2 minggu ini</span>
          </div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-green">
            <FileText size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Dokumen aktif</span>
            <span className="portal-stat-number">24</span>
            <span className="portal-stat-subtext green">3 menunggu validasi</span>
          </div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-yellow">
            <Users size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Kolaborasi UKM</span>
            <span className="portal-stat-number">6</span>
            <span className="portal-stat-subtext yellow">2 permintaan baru</span>
          </div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-teal">
            <Eye size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Tingkat partisipasi</span>
            <span className="portal-stat-number">87%</span>
            <span className="portal-stat-subtext teal">+5% dari bulan lalu</span>
          </div>
        </div>
      </div>

      {/* Main Two Columns */}
      <div className="portal-dashboard-grid">
        {/* Left: Pengumuman Terbaru */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h3 className="portal-card-title">Pengumuman Terbaru</h3>
              <p className="portal-card-subtitle">Informasi penting untuk anggota organisasi</p>
            </div>
            <button 
              type="button" 
              className="portal-link-btn"
              onClick={() => onSelectAnnouncement(announcements[0] || defaultAnnouncements[0])}
            >
              Lihat semua <ChevronRight size={14} />
            </button>
          </div>

          <div className="announcement-list">
            {announcements.map((item) => (
              <div 
                key={item.id} 
                className="announcement-item-card"
                onClick={() => onSelectAnnouncement(item)}
              >
                <div className={`announcement-icon-badge ${item.is_important ? 'announcement-icon-red' : item.category === 'Acara' ? 'announcement-icon-blue' : 'announcement-icon-gray'}`}>
                  {item.category === 'Administrasi' ? <FileText size={18} /> : <Bell size={18} />}
                </div>

                <div className="announcement-body">
                  <div className="announcement-tags-row">
                    {item.is_important && <span className="tag-badge tag-red">Penting</span>}
                    <span className="tag-badge tag-gray">{item.category}</span>
                    <span className="announcement-time">{item.time}</span>
                    {!item.is_read && <span className="announcement-unread-dot" title="Belum dibaca" />}
                  </div>

                  <h4 className="announcement-title">{item.judul}</h4>
                  <p className="announcement-snippet">{item.isi}</p>

                  <button 
                    type="button" 
                    className="portal-link-btn"
                    style={{ fontSize: '12px' }}
                  >
                    Lihat selengkapnya <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Agenda Terdekat */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h3 className="portal-card-title">Agenda Terdekat</h3>
              <p className="portal-card-subtitle">November 2024</p>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="mini-calendar-wrapper">
            <div className="mini-cal-grid">
              <span className="mini-cal-head">Sen</span>
              <span className="mini-cal-head">Sel</span>
              <span className="mini-cal-head">Rab</span>
              <span className="mini-cal-head">Kam</span>
              <span className="mini-cal-head">Jum</span>
              <span className="mini-cal-head">Sab</span>
              <span className="mini-cal-head">Min</span>

              {/* Row 1 */}
              <span className="mini-cal-cell">4</span>
              <span className="mini-cal-cell">5</span>
              <span className="mini-cal-cell">6</span>
              <span className="mini-cal-cell">7</span>
              <span className="mini-cal-cell">8</span>
              <span className="mini-cal-cell">9</span>
              <span className="mini-cal-cell">10</span>

              {/* Row 2 */}
              <span className="mini-cal-cell">11</span>
              <span className="mini-cal-cell">12</span>
              <span className="mini-cal-cell">13</span>
              <span className="mini-cal-cell active-today">14</span>
              <span className="mini-cal-cell">15</span>
              <span className="mini-cal-cell">16</span>
              <span className="mini-cal-cell">17</span>

              {/* Row 3 */}
              <span className="mini-cal-cell">18</span>
              <span className="mini-cal-cell has-dot">19</span>
              <span className="mini-cal-cell has-dot">20</span>
              <span className="mini-cal-cell">21</span>
              <span className="mini-cal-cell has-dot">22</span>
              <span className="mini-cal-cell">23</span>
              <span className="mini-cal-cell">24</span>
            </div>
          </div>

          {/* Upcoming events list */}
          <div className="upcoming-schedules-list">
            <div className="upcoming-schedule-item">
              <div className="schedule-date-badge blue">
                <span className="schedule-date-day">20</span>
                <span className="schedule-date-month">Nov</span>
              </div>
              <div className="schedule-details">
                <h5 className="schedule-title">Workshop Kepemimpinan</h5>
                <span className="schedule-meta">
                  <Clock size={12} /> 09:00 • Aula Utama
                </span>
              </div>
            </div>

            <div className="upcoming-schedule-item">
              <div className="schedule-date-badge purple">
                <span className="schedule-date-day">22</span>
                <span className="schedule-date-month">Nov</span>
              </div>
              <div className="schedule-details">
                <h5 className="schedule-title">Rapat Koordinasi Divisi</h5>
                <span className="schedule-meta">
                  <Clock size={12} /> 13:30 • Ruang Sekretariat
                </span>
              </div>
            </div>

            <div className="upcoming-schedule-item">
              <div className="schedule-date-badge green">
                <span className="schedule-date-day">25</span>
                <span className="schedule-date-month">Nov</span>
              </div>
              <div className="schedule-details">
                <h5 className="schedule-title">SIOMAS Fest 2024</h5>
                <span className="schedule-meta">
                  <Clock size={12} /> 08:00 • Lapangan Kampus
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="portal-outline-btn"
            onClick={() => onNavigate('agenda')}
          >
            Buka Kalender Agenda
          </button>
        </div>
      </div>
    </div>
  );
}
