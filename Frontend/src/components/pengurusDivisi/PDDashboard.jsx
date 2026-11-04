import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  FileText,
  Users,
  Eye,
  Bell,
  ChevronRight,
  Clock,
  Plus,
  X,
  Bold,
  Italic,
  AlignLeft,
  Link
} from 'lucide-react';
import {
  announcementsApi,
  schedulesApi,
  documentsApi,
  lpjApi,
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

// Modal Buat Pengumuman Baru
function ModalBuatPengumuman({ onClose, onPublish, showToast, submitting }) {
  const [form, setForm] = useState({
    judul: '',
    kategori: 'Umum',
    metodPublikasi: 'Publikasikan Sekarang',
    tanggalPublikasi: '',
    waktuPublikasi: '',
    tanggalKegiatan: '',
    aktifSampai: '',
    isi: '',
    tandaiPenting: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.judul.trim()) {
      showToast && showToast('Harap isi Judul Pengumuman.', 'warning');
      return;
    }
    if (!form.isi.trim()) {
      showToast && showToast('Harap isi detail Pengumuman.', 'warning');
      return;
    }
    onPublish(form);
  };

  return (
    <div className="portal-modal-backdrop" onClick={onClose}>
      <div className="portal-modal-dialog wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="portal-modal-header">
          <div>
            <h3 className="portal-modal-title">Buat Pengumuman Baru</h3>
            <p className="portal-modal-subtitle">Bagikan informasi kepada anggota organisasi.</p>
          </div>
          <button type="button" className="portal-modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="portal-modal-body">
            {/* Judul */}
            <div className="portal-form-group">
              <label className="portal-form-label">Judul Pengumuman</label>
              <input
                type="text"
                className="portal-input"
                placeholder="Tulis judul yang informatif"
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                required
              />
            </div>

            {/* Kategori */}
            <div className="portal-form-group">
              <label className="portal-form-label">Kategori</label>
              <select className="portal-select" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
                <option value="Penting">Penting</option>
                <option value="Manajemen">Manajemen</option>
                <option value="Acara">Acara</option>
                <option value="Administrasi">Administrasi</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            {/* Jadwal Pengumuman Card */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: '#EEF2FF', borderRadius: '8px', padding: '6px 8px', color: '#6366F1' }}>
                  <CalendarIcon size={16} />
                </div>
                <div>
                  <h6 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Jadwal Pengumuman</h6>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Atur waktu publikasi dan masa aktif informasi.</p>
                </div>
              </div>

              <div className="portal-form-group">
                <label className="portal-form-label">Metode Publikasi</label>
                <select className="portal-select" value={form.metodPublikasi} onChange={(e) => setForm({ ...form, metodPublikasi: e.target.value })}>
                  <option>Publikasikan Sekarang</option>
                  <option>Jadwalkan Publikasi</option>
                  <option>Simpan sebagai Draf</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="portal-form-group">
                  <label className="portal-form-label">Tanggal Publikasi</label>
                  <input type="date" className="portal-input" value={form.tanggalPublikasi} onChange={(e) => setForm({ ...form, tanggalPublikasi: e.target.value })} />
                </div>
                <div className="portal-form-group">
                  <label className="portal-form-label">Waktu Publikasi (WITA)</label>
                  <input type="time" className="portal-input" value={form.waktuPublikasi} onChange={(e) => setForm({ ...form, waktuPublikasi: e.target.value })} />
                </div>
                <div className="portal-form-group">
                  <label className="portal-form-label">Tanggal Kegiatan</label>
                  <input type="date" className="portal-input" value={form.tanggalKegiatan} onChange={(e) => setForm({ ...form, tanggalKegiatan: e.target.value })} />
                </div>
                <div className="portal-form-group">
                  <label className="portal-form-label">Aktif Sampai</label>
                  <input type="date" className="portal-input" value={form.aktifSampai} onChange={(e) => setForm({ ...form, aktifSampai: e.target.value })} />
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0' }}>
                Tanggal kegiatan bersifat opsional. Setelah masa aktif berakhir, pengumuman otomatis dipindahkan ke arsip.
              </p>
            </div>

            {/* Isi Pengumuman - Rich Text */}
            <div className="portal-form-group">
              <label className="portal-form-label">Isi Pengumuman</label>
              <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '2px', padding: '8px 10px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  {[
                    { icon: <Bold size={14} />, title: 'Bold' },
                    { icon: <Italic size={14} />, title: 'Italic' },
                    { icon: <AlignLeft size={14} />, title: 'Align' },
                    { icon: <Link size={14} />, title: 'Link' }
                  ].map((btn) => (
                    <button key={btn.title} type="button" title={btn.title}
                      style={{ padding: '4px 8px', border: 'none', background: 'none', cursor: 'pointer', color: '#475569', borderRadius: '4px' }}
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>
                <textarea
                  className="portal-textarea"
                  rows="4"
                  style={{ borderRadius: 0, border: 'none' }}
                  placeholder="Tulis detail pengumuman..."
                  value={form.isi}
                  onChange={(e) => setForm({ ...form, isi: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Tandai Penting */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <input
                type="checkbox"
                id="pd_tandai_penting"
                checked={form.tandaiPenting}
                onChange={(e) => setForm({ ...form, tandaiPenting: e.target.checked })}
                style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="pd_tandai_penting" style={{ fontSize: '13px', color: '#92400E', cursor: 'pointer', lineHeight: '1.4' }}>
                <strong>Tandai Penting &amp; Kirim Notifikasi Email</strong>
                <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                  Pengumuman ditandai prioritas dan dikirim ke email seluruh anggota.
                </div>
              </label>
            </div>
          </div>

          <div className="portal-modal-footer">
            <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '9px 18px' }} onClick={onClose}>
              Batal Simpan
            </button>
            <button type="submit" disabled={submitting} className="btn-primary-glow" style={{ padding: '9px 24px' }}>
              {submitting ? 'Mempublikasikan...' : 'Publikasikan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PDDashboard({ currentUser, onNavigate, onSelectAnnouncement, showToast }) {
  const [showModalPengumuman, setShowModalPengumuman] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState({
    agendaCount: 0,
    docsActiveCount: 0,
    docsPendingCount: 0,
    interUkmCount: 0,
    participationPct: 0
  });

  const firstName = currentUser?.nama ? currentUser.nama.split(' ')[0] : 'Pengurus';

  const loadDashboardData = useCallback(async () => {
    const [annRes, schedRes, docsRes, myLpjRes, interFeedRes] = await Promise.all([
      announcementsApi.getAll(),
      schedulesApi.getAll(),
      documentsApi.getAll(),
      lpjApi.getMySubmissions(),
      interUkmApi.getFeed()
    ]);

    const annList = annRes.ok && annRes.data?.data ? annRes.data.data.map(item => ({
      id: item.id,
      judul: item.judul,
      isi: item.isi,
      is_important: item.is_important,
      category: item.is_important ? 'Manajemen' : 'Umum',
      time: formatDateTimeLabel(item.created_at),
      is_read: item.is_read !== undefined ? item.is_read : true,
      tanggal: formatDateTimeLabel(item.created_at),
      waktu: 'Sesuai jadwal',
      lokasi: 'Kampus SIOMAS',
      peserta: 'Seluruh anggota aktif',
      publisher: `${item.author_name || 'Pengurus SIOMAS'} • ${formatDateTimeLabel(item.created_at)}`,
      authorName: item.author_name || 'Pengurus SIOMAS',
      authorRole: 'Pengurus Divisi'
    })) : [];

    const schedList = schedRes.ok && schedRes.data?.data ? schedRes.data.data : [];
    const docsList = docsRes.ok && docsRes.data?.data ? docsRes.data.data : [];
    const myLpjList = myLpjRes.ok && myLpjRes.data?.data ? myLpjRes.data.data : [];
    const pendingLpj = myLpjList.filter(d => d.status_validasi === 'Draft').length;
    const interFeedList = interFeedRes.ok && interFeedRes.data?.data ? interFeedRes.data.data : [];

    setAnnouncements(annList);
    setSchedules(schedList);

    const readCount = annList.filter(a => a.is_read).length;
    const participation = annList.length > 0 ? Math.round((readCount / annList.length) * 100) : 0;

    setStats({
      agendaCount: schedList.length,
      docsActiveCount: docsList.length,
      docsPendingCount: pendingLpj,
      interUkmCount: interFeedList.length,
      participationPct: participation
    });
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handlePublishAnnouncement = async (form) => {
    setSubmitting(true);
    const isImportant = form.tandaiPenting || form.kategori === 'Penting';
    const res = await announcementsApi.create({
      judul: form.judul.trim(),
      isi: form.isi.trim(),
      is_important: isImportant,
      notify_email: form.tandaiPenting
    });
    setSubmitting(false);

    if (res.ok) {
      setShowModalPengumuman(false);
      if (showToast) showToast('Pengumuman berhasil dipublikasikan ke seluruh anggota.', 'success');
      loadDashboardData();
    } else {
      if (showToast) showToast(res.data?.message || 'Gagal mempublikasikan pengumuman.', 'error');
    }
  };

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
      {/* Date & Welcome */}
      <div className="page-header-block">
        <div className="page-title-row" style={{ alignItems: 'flex-end' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5', display: 'block', marginBottom: '4px' }}>
              {formatTodayHeader()}
            </span>
            <h1 className="page-title">Selamat datang, {firstName}</h1>
            <p className="page-subtitle">Berikut ringkasan aktivitas organisasi kamu hari ini.</p>
          </div>
          <button
            type="button"
            className="btn-primary-glow"
            onClick={() => setShowModalPengumuman(true)}
          >
            <Plus size={16} /> Buat Pengumuman
          </button>
        </div>
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
            <span className="portal-stat-subtext green">{stats.docsPendingCount} menunggu validasi</span>
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

      {/* Main Two-Column Grid */}
      <div className="portal-dashboard-grid">
        {/* Left: Pengumuman */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h3 className="portal-card-title">Pengumuman Terbaru</h3>
              <p className="portal-card-subtitle">Informasi penting untuk anggota organisasi</p>
            </div>
            {announcements.length > 0 && (
              <button type="button" className="portal-link-btn" onClick={() => onSelectAnnouncement && onSelectAnnouncement(announcements[0])}>
                Lihat semua <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div className="announcement-list">
            {announcements.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
                Belum ada pengumuman yang dipublikasikan. Klik <strong>Buat Pengumuman</strong> untuk menambahkan.
              </div>
            ) : (
              announcements.map((item) => (
                <div
                  key={item.id}
                  className="announcement-item-card"
                  onClick={() => onSelectAnnouncement && onSelectAnnouncement(item)}
                >
                  <div className={`announcement-icon-badge ${item.is_important ? 'announcement-icon-red' : item.category === 'Acara' ? 'announcement-icon-blue' : 'announcement-icon-gray'}`}>
                    {item.category === 'Administrasi' ? <FileText size={18} /> : <Bell size={18} />}
                  </div>
                  <div className="announcement-body">
                    <div className="announcement-tags-row">
                      {item.is_important && <span className="tag-badge tag-red">Penting</span>}
                      <span className="tag-badge tag-gray">{item.category}</span>
                      <span className="announcement-time">{item.time}</span>
                      {!item.is_read && <span className="announcement-unread-dot" />}
                    </div>
                    <h4 className="announcement-title">{item.judul}</h4>
                    <p className="announcement-snippet">{item.isi}</p>
                    <button type="button" className="portal-link-btn" style={{ fontSize: '12px' }}>
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
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
                <span key={d} className="mini-cal-head">{d}</span>
              ))}
              {Array.from({ length: 21 }, (_, i) => i + 1).map((d) => (
                <span key={d} className={`mini-cal-cell ${d === todayDate ? 'active-today' : ''} ${eventDaysInCurrentMonth.includes(d) ? 'has-dot' : ''}`}>{d}</span>
              ))}
            </div>
          </div>

          <div className="upcoming-schedules-list">
            {upcomingEvents.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Belum ada agenda kegiatan terdekat.
              </div>
            ) : (
              upcomingEvents.map((ev) => (
                <div key={ev.id} className="upcoming-schedule-item">
                  <div className={`schedule-date-badge ${ev.color}`}>
                    <span className="schedule-date-day">{ev.day}</span>
                    <span className="schedule-date-month">{ev.month}</span>
                  </div>
                  <div className="schedule-details">
                    <h5 className="schedule-title">{ev.title}</h5>
                    <span className="schedule-meta"><Clock size={12} /> {ev.time} • {ev.place}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button type="button" className="portal-outline-btn" onClick={() => onNavigate('pd-agenda')}>
            Buka Kalender Agenda
          </button>
        </div>
      </div>

      {/* Modal Buat Pengumuman */}
      {showModalPengumuman && (
        <ModalBuatPengumuman
          onClose={() => setShowModalPengumuman(false)}
          onPublish={handlePublishAnnouncement}
          showToast={showToast}
          submitting={submitting}
        />
      )}
    </div>
  );
}
