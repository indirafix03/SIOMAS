import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  FileText,
  Users,
  Eye,
  ChevronRight,
  Bell,
  Clock,
  PlusCircle,
  X
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

function formatDateOnly(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr.length === 10 ? `${isoStr}T00:00:00` : isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTimeOnly(isoStr) {
  if (!isoStr) return '09:00 WITA';
  if (/^\d{1,2}:\d{2}/.test(isoStr)) {
    return isoStr.toUpperCase().includes('WITA') ? isoStr : `${isoStr} WITA`;
  }
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '09:00 WITA';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WITA`;
}

// Modal: Lihat Semua Pengumuman
function ModalSemuaPengumuman({ announcements, onClose, onSelect }) {
  const [filterTab, setFilterTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = announcements.filter(item => {
    if (filterTab === 'Penting' && !item.is_important) return false;
    if (filterTab === 'Belum Dibaca' && item.is_read) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (item.judul || '').toLowerCase().includes(q) ||
        (item.isi || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="portal-modal-backdrop" onClick={onClose}>
      <div
        className="portal-modal-dialog wide"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '720px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="portal-modal-header">
          <div>
            <h3 className="portal-modal-title">Daftar Seluruh Pengumuman ({announcements.length})</h3>
            <p className="portal-modal-subtitle">Klik salah satu pengumuman untuk membaca detail lengkapnya.</p>
          </div>
          <button type="button" className="portal-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '14px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Semua', 'Penting', 'Belum Dibaca'].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  border: filterTab === tab ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                  background: filterTab === tab ? '#EEF2FF' : '#FFFFFF',
                  color: filterTab === tab ? '#4F46E5' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="portal-input"
            placeholder="Cari judul pengumuman..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ maxWidth: '240px', padding: '7px 12px', fontSize: '13px' }}
          />
        </div>

        <div className="portal-modal-body" style={{ overflowY: 'auto', padding: '20px 24px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
              Tidak ada pengumuman yang sesuai dengan filter.
            </div>
          ) : (
            <div className="announcement-list">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="announcement-item-card"
                  onClick={() => {
                    onClose();
                    onSelect && onSelect(item);
                  }}
                >
                  <div className={`announcement-icon-badge ${item.is_important ? 'announcement-icon-red' : item.category === 'Acara' ? 'announcement-icon-blue' : 'announcement-icon-gray'}`}>
                    {item.category === 'Administrasi' ? <FileText size={18} /> : <Bell size={18} />}
                  </div>
                  <div className="announcement-body">
                    <div className="announcement-tags-row">
                      {item.is_important && <span className="tag-badge tag-red">Penting</span>}
                      <span className="tag-badge tag-gray">{item.category}</span>
                      <span className="announcement-time">{item.tanggal} • {item.waktu}</span>
                      {!item.is_read && <span className="announcement-unread-dot" />}
                    </div>
                    <h4 className="announcement-title">{item.judul}</h4>
                    <p className="announcement-snippet">{item.isi}</p>
                    <button type="button" className="portal-link-btn" style={{ fontSize: '12px' }}>
                      Lihat selengkapnya <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal: Buat Pengumuman Baru
function ModalBuatPengumuman({ onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    judul: '',
    kategori: 'Umum',
    metodePub: 'Publikasikan Sekarang',
    tanggalPub: '',
    waktuPub: '',
    tanggalKegiatan: '',
    aktifSampai: '',
    isi: '',
    isPenting: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)'
      }}>
        <div style={{ padding: '28px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>Buat Pengumuman Baru</h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Bagikan informasi kepada anggota organisasi.</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Judul Pengumuman</label>
            <input className="form-input" name="judul" value={form.judul} onChange={handleChange} placeholder="Tulis judul yang informatif" />
          </div>

          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select className="form-select" name="kategori" value={form.kategori} onChange={handleChange}>
              <option value="Manajemen">Manajemen</option>
              <option value="Acara">Acara</option>
              <option value="Administrasi">Administrasi</option>
              <option value="Umum">Umum</option>
            </select>
          </div>

          {/* Jadwal Publikasi box */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#EEF2FF', borderRadius: '8px', padding: '6px', color: '#4F46E5' }}>
                <CalendarIcon size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Jadwal Pengumuman</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Atur waktu publikasi dan masa aktif informasi.</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Metode Publikasi</label>
              <select className="form-select" name="metodePub" value={form.metodePub} onChange={handleChange}>
                <option>Publikasikan Sekarang</option>
                <option>Jadwalkan</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Publikasi</label>
                <input className="form-input" type="date" name="tanggalPub" value={form.tanggalPub} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Waktu Publikasi (WITA)</label>
                <input className="form-input" type="time" name="waktuPub" value={form.waktuPub} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Kegiatan</label>
                <input className="form-input" type="date" name="tanggalKegiatan" value={form.tanggalKegiatan} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Aktif Sampai</label>
                <input className="form-input" type="date" name="aktifSampai" value={form.aktifSampai} onChange={handleChange} />
              </div>
            </div>
            <p style={{ fontSize: '11.5px', color: '#64748B' }}>Tanggal kegiatan bersifat opsional. Setelah masa aktif berakhir, pengumuman otomatis dipindahkan ke arsip.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Isi Pengumuman</label>
            <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                {['B', 'I', '≡', '🔗'].map((t, i) => (
                  <button key={i} type="button" style={{ background: 'none', border: 'none', fontWeight: t === 'B' ? 700 : 400, cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', color: '#0F172A' }}>
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                className="form-input"
                name="isi"
                value={form.isi}
                onChange={handleChange}
                placeholder="Tulis detail pengumuman..."
                rows={4}
                style={{ border: 'none', borderRadius: 0, resize: 'none', boxShadow: 'none' }}
              />
            </div>
          </div>

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <input type="checkbox" id="isPenting" name="isPenting" checked={form.isPenting} onChange={handleChange} style={{ marginTop: '2px', accentColor: '#4F46E5' }} />
            <label htmlFor="isPenting" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Tandai Penting & Kirim Notifikasi Email</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Pengumuman ditandai prioritas dan dikirim ke email seluruh anggota.</div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ width: 'auto', padding: '10px 20px' }}>
              Batal Simpan
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={submitting}
              style={{ width: 'auto', margin: 0 }}
              onClick={() => onSubmit(form)}
            >
              {submitting ? 'Mempublikasikan...' : 'Publikasikan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KetuaBeranda({ currentUser, onNavigate, onSelectAnnouncement, showToast }) {
  const [showModalPengumuman, setShowModalPengumuman] = useState(false);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState({
    agendaCount: 0,
    docsActiveCount: 0,
    docsPendingCount: 0,
    interUkmApprovedCount: 0,
    interUkmPendingCount: 0,
    participationPct: 0
  });

  const firstName = currentUser?.nama ? currentUser.nama.split(' ')[0] : 'Admin';

  const loadDashboardData = useCallback(async () => {
    const [annRes, schedRes, docsRes, lpjRes, interFeedRes, interPendRes] = await Promise.all([
      announcementsApi.getAll(),
      schedulesApi.getAll(),
      documentsApi.getAll(),
      lpjApi.getPendingValidation(),
      interUkmApi.getFeed(),
      interUkmApi.getPending()
    ]);

    const annList = annRes.ok && annRes.data?.data ? annRes.data.data.map(item => ({
      id: item.id,
      judul: item.judul,
      isi: item.isi,
      is_important: item.is_important,
      category: item.kategori || (item.is_important ? 'Manajemen' : 'Umum'),
      time: formatDateTimeLabel(item.created_at),
      is_read: item.is_read !== undefined ? item.is_read : true,
      created_at: item.created_at,
      read_count: item.read_count || 1,
      tanggal: item.tanggal || formatDateOnly(item.created_at),
      waktu: item.waktu && item.waktu !== 'Sesuai jadwal' ? item.waktu : formatTimeOnly(item.created_at),
      lokasi: item.lokasi || 'Kampus SIOMAS',
      peserta: 'Seluruh anggota aktif',
      publisher: `${item.author_name || 'Admin SIOMAS'} • ${formatDateTimeLabel(item.created_at)}`,
      authorName: item.author_name || 'Admin SIOMAS',
      authorRole: 'Pengurus / Ketua UKM'
    })) : [];

    const schedList = schedRes.ok && schedRes.data?.data ? schedRes.data.data : [];
    const docsList = docsRes.ok && docsRes.data?.data ? docsRes.data.data : [];
    const lpjPendingList = lpjRes.ok && lpjRes.data?.data ? lpjRes.data.data : [];
    const interFeedList = interFeedRes.ok && interFeedRes.data?.data ? interFeedRes.data.data : [];
    const interPendList = interPendRes.ok && interPendRes.data?.data ? interPendRes.data.data : [];

    setAnnouncements(annList);
    setSchedules(schedList);

    const readCount = annList.filter(a => a.is_read).length;
    const participation = annList.length > 0 ? Math.round((readCount / annList.length) * 100) : 0;

    setStats({
      agendaCount: schedList.length,
      docsActiveCount: docsList.length,
      docsPendingCount: lpjPendingList.length,
      interUkmApprovedCount: interFeedList.length,
      interUkmPendingCount: interPendList.length,
      participationPct: participation
    });
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCreateAnnouncement = async (form) => {
    if (!form.judul.trim() || !form.isi.trim()) {
      if (showToast) showToast('Judul dan isi pengumuman wajib diisi!', 'error');
      return;
    }
    setSubmitting(true);
    const res = await announcementsApi.create({
      judul: form.judul.trim(),
      isi: form.isi.trim(),
      kategori: form.kategori || 'Umum',
      tanggal_kegiatan: form.tanggalKegiatan || form.tanggalPub || '',
      waktu_kegiatan: form.waktuPub || '',
      is_important: form.isPenting,
      notify_email: form.isPenting
    });
    setSubmitting(false);

    if (res.ok) {
      setShowModalPengumuman(false);
      if (showToast) showToast('Pengumuman berhasil dipublikasikan!', 'success');
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
      {showModalPengumuman && (
        <ModalBuatPengumuman
          onClose={() => setShowModalPengumuman(false)}
          onSubmit={handleCreateAnnouncement}
          submitting={submitting}
        />
      )}
      {showAllAnnouncements && (
        <ModalSemuaPengumuman
          announcements={announcements}
          onClose={() => setShowAllAnnouncements(false)}
          onSelect={onSelectAnnouncement}
        />
      )}

      {/* Header */}
      <div className="page-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5', display: 'block', marginBottom: '4px' }}>
            {formatTodayHeader()}
          </span>
          <h1 className="page-title">Selamat datang, {firstName}</h1>
          <p className="page-subtitle">Berikut ringkasan aktivitas organisasi kamu hari ini.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ margin: 0, width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          onClick={() => setShowModalPengumuman(true)}
        >
          <PlusCircle size={16} />
          Buat Pengumuman
        </button>
      </div>

      {/* Stats */}
      <div className="portal-stats-grid">
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-purple"><CalendarIcon size={22} /></div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Agenda mendatang</span>
            <span className="portal-stat-number">{stats.agendaCount}</span>
            <span className="portal-stat-subtext purple">{stats.agendaCount} terjadwal</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-green"><FileText size={22} /></div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Dokumen aktif</span>
            <span className="portal-stat-number">{stats.docsActiveCount}</span>
            <span className="portal-stat-subtext green">{stats.docsPendingCount} menunggu validasi</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-yellow"><Users size={22} /></div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Kolaborasi UKM</span>
            <span className="portal-stat-number">{stats.interUkmApprovedCount}</span>
            <span className="portal-stat-subtext yellow">{stats.interUkmPendingCount} permintaan baru</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-teal"><Eye size={22} /></div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Tingkat partisipasi</span>
            <span className="portal-stat-number">{stats.participationPct}%</span>
            <span className="portal-stat-subtext teal">{announcements.length} pengumuman aktif</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="portal-dashboard-grid">
        {/* Pengumuman */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h3 className="portal-card-title">Pengumuman Terbaru</h3>
              <p className="portal-card-subtitle">Informasi penting untuk anggota organisasi</p>
            </div>
            {announcements.length > 0 && (
              <button type="button" className="portal-link-btn" onClick={() => setShowAllAnnouncements(true)}>
                Lihat semua ({announcements.length}) <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div className="announcement-list">
            {announcements.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
                Belum ada pengumuman yang dipublikasikan. Klik <strong>Buat Pengumuman</strong> untuk menambahkan.
              </div>
            ) : (
              announcements.slice(0, 4).map(item => (
                <div key={item.id} className="announcement-item-card" onClick={() => onSelectAnnouncement && onSelectAnnouncement(item)}>
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

        {/* Agenda */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h3 className="portal-card-title">Agenda Terdekat</h3>
              <p className="portal-card-subtitle">{currentMonthName}</p>
            </div>
          </div>

          <div className="mini-calendar-wrapper">
            <div className="mini-cal-grid">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                <span key={d} className="mini-cal-head">{d}</span>
              ))}
              {Array.from({ length: 21 }, (_, i) => i + 1).map(d => (
                <span key={d} className={`mini-cal-cell${d === todayDate ? ' active-today' : ''}${eventDaysInCurrentMonth.includes(d) ? ' has-dot' : ''}`}>{d}</span>
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

          <button type="button" className="portal-outline-btn" onClick={() => onNavigate('k-kalender-agenda')}>
            Buka Kalender Agenda
          </button>
        </div>
      </div>
    </div>
  );
}
