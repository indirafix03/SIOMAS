import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  FileText, 
  Users, 
  Eye, 
  ChevronRight, 
  Bell, 
  Clock
} from 'lucide-react';
import {
  announcementsApi,
  schedulesApi,
  documentsApi,
  interUkmApi
} from '../../services/api.js';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatTodayHeader() {
  const now = new Date();
  return `${DAYS_ID[now.getDay()]}, ${now.getDate()} ${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()}`;
}

function formatDateTimeLabel(isoStr) {
  if (!isoStr) return 'Baru saja';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AnggotaDashboard({ currentUser, onNavigate, onSelectAnnouncement }) {
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState({
    agendaCount: 0,
    docsActiveCount: 0,
    interUkmCount: 0,
    participationPct: 0
  });

  useEffect(() => {
    async function loadData() {
      const [annRes, schedRes, docsRes, interRes] = await Promise.all([
        announcementsApi.getAll(),
        schedulesApi.getAll(),
        documentsApi.getAll(),
        interUkmApi.getFeed()
      ]);

      const annList = annRes.ok && annRes.data?.data ? annRes.data.data.map(item => ({
        id: item.id,
        judul: item.judul,
        isi: item.isi,
        is_important: item.is_important,
        category: item.is_important ? 'Manajemen' : 'Umum',
        time: formatDateTimeLabel(item.created_at),
        is_read: item.is_read !== undefined ? item.is_read : false,
        tanggal: formatDateTimeLabel(item.created_at),
        waktu: 'Sesuai jadwal',
        lokasi: 'Kampus SIOMAS',
        peserta: 'Seluruh anggota aktif',
        publisher: `${item.author_name || 'Pengurus SIOMAS'} • ${formatDateTimeLabel(item.created_at)}`,
        authorName: item.author_name || 'Pengurus SIOMAS',
        authorRole: 'Pengurus / Ketua UKM'
      })) : [];

      const schedList = schedRes.ok && schedRes.data?.data ? schedRes.data.data : [];
      const docsList = docsRes.ok && docsRes.data?.data ? docsRes.data.data : [];
      const interList = interRes.ok && interRes.data?.data ? interRes.data.data : [];

      setAnnouncements(annList);
      setSchedules(schedList);

      const readCount = annList.filter(a => a.is_read).length;
      const participation = annList.length > 0 ? Math.round((readCount / annList.length) * 100) : 0;

      setStats({
        agendaCount: schedList.length,
        docsActiveCount: docsList.length,
        interUkmCount: interList.length,
        participationPct: participation
      });
    }
    loadData();
  }, []);

  const firstName = currentUser?.nama ? currentUser.nama.split(' ')[0] : 'Anggota';
  const now = new Date();
  const currentMonthName = `${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()}`;
  const todayDate = now.getDate();

  const eventDaysInCurrentMonth = schedules
    .map(s => new Date(s.waktu))
    .filter(d => !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
    .map(d => d.getDate());

  const upcomingEvents = schedules.slice(0, 3).map((s, idx) => {
    const d = new Date(s.waktu);
    const valid = !isNaN(d.getTime());
    const colors = ['blue', 'purple', 'green'];
    return {
      id: s.id,
      day: valid ? d.getDate() : '--',
      month: valid ? MONTHS_SHORT[d.getMonth()] : '---',
      title: s.judul_kegiatan,
      time: valid ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '-',
      place: s.lokasi || 'Kampus',
      color: colors[idx % colors.length]
    };
  });

  return (
    <div>
      {/* Date & Welcome Heading */}
      <div className="page-header-block">
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5', display: 'block', marginBottom: '4px' }}>
          {formatTodayHeader()}
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
            <span className="portal-stat-number">{stats.agendaCount}</span>
            <span className="portal-stat-subtext purple">{stats.agendaCount} terjadwal</span>
          </div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-green">
            <FileText size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Dokumen aktif</span>
            <span className="portal-stat-number">{stats.docsActiveCount}</span>
            <span className="portal-stat-subtext green">Tervalidasi di Vault</span>
          </div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-yellow">
            <Users size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Kolaborasi UKM</span>
            <span className="portal-stat-number">{stats.interUkmCount}</span>
            <span className="portal-stat-subtext yellow">{stats.interUkmCount} kolaborasi aktif</span>
          </div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-teal">
            <Eye size={22} />
          </div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Tingkat partisipasi</span>
            <span className="portal-stat-number">{stats.participationPct}%</span>
            <span className="portal-stat-subtext teal">{announcements.length} pengumuman aktif</span>
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
            {announcements.length > 0 && (
              <button 
                type="button" 
                className="portal-link-btn"
                onClick={() => onSelectAnnouncement(announcements[0])}
              >
                Lihat semua <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div className="announcement-list">
            {announcements.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
                Belum ada pengumuman yang dipublikasikan.
              </div>
            ) : (
              announcements.map((item) => (
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
              ))
            )}
          </div>
        </div>

        {/* Right: Agenda Terdekat */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h3 className="portal-card-title">Agenda Terdekat</h3>
              <p className="portal-card-subtitle">{currentMonthName}</p>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="mini-calendar-wrapper">
            <div className="mini-cal-grid">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                <span key={d} className="mini-cal-head">{d}</span>
              ))}
              {Array.from({ length: 21 }, (_, i) => i + 1).map(d => (
                <span key={d} className={`mini-cal-cell ${d === todayDate ? 'active-today' : ''} ${eventDaysInCurrentMonth.includes(d) ? 'has-dot' : ''}`}>{d}</span>
              ))}
            </div>
          </div>

          {/* Upcoming events list */}
          <div className="upcoming-schedules-list">
            {upcomingEvents.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Belum ada agenda kegiatan terdekat.
              </div>
            ) : (
              upcomingEvents.map(ev => (
                <div key={ev.id} className="upcoming-schedule-item">
                  <div className={`schedule-date-badge ${ev.color}`}>
                    <span className="schedule-date-day">{ev.day}</span>
                    <span className="schedule-date-month">{ev.month}</span>
                  </div>
                  <div className="schedule-details">
                    <h5 className="schedule-title">{ev.title}</h5>
                    <span className="schedule-meta">
                      <Clock size={12} /> {ev.time} • {ev.place}
                    </span>
                  </div>
                </div>
              ))
            )}
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
