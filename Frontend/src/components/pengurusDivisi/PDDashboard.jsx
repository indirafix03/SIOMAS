import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  FileText,
  Users,
  Eye,
  CheckSquare,
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

// Modal Buat Pengumuman Baru
function ModalBuatPengumuman({ onClose, onPublish, showToast }) {
  const [form, setForm] = useState({
    judul: '',
    kategori: '',
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
      showToast('Harap isi Judul Pengumuman.', 'warning');
      return;
    }
    if (!form.kategori) {
      showToast('Harap pilih Kategori.', 'warning');
      return;
    }
    onPublish(form);
    showToast('Pengumuman berhasil dipublikasikan ke seluruh anggota.', 'success');
    onClose();
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
                <option value="">Pilih kategori</option>
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
                      onClick={() => showToast(`Format ${btn.title} diterapkan.`, 'info')}
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
            <button type="submit" className="btn-primary-glow" style={{ padding: '9px 24px' }}>
              Publikasikan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PDDashboard({ currentUser, onNavigate, onSelectAnnouncement }) {
  const [showModalPengumuman, setShowModalPengumuman] = useState(false);

  const firstName = currentUser?.nama ? currentUser.nama.split(' ')[0] : 'Ardi';

  const announcements = [
    {
      id: 1,
      judul: 'Rapat Koordinasi Akhir Semester',
      isi: 'Rapat evaluasi program kerja akan dilaksanakan Jumat mendatang di Aula Gedung C.',
      is_important: true,
      category: 'Manajemen',
      time: 'Hari ini, 09:24',
      is_read: false,
      tanggal: 'Jumat, 22 November 2024',
      waktu: '15:30–17:30 WITA',
      lokasi: 'Aula Gedung C',
      peserta: 'Seluruh anggota aktif',
      publisher: 'Divisi Manajemen • 18 November 2024, 09:24 WITA',
      authorName: 'Ardi Pratama',
      authorRole: 'Koordinator Divisi Acara'
    },
    {
      id: 2,
      judul: 'Pendaftaran Volunteer SIOMAS Fest 2024',
      isi: 'Kami membuka kesempatan bagi anggota untuk menjadi bagian dari acara terbesar tahun ini.',
      is_important: false,
      category: 'Acara',
      time: 'Kemarin, 15:40',
      is_read: true,
      tanggal: '25–27 November 2024',
      waktu: '08:00–18:00 WITA',
      lokasi: 'Lapangan Utama Kampus',
      peserta: 'Anggota terdaftar',
      publisher: 'Divisi Acara • 17 November 2024, 15:40 WITA',
      authorName: 'Ardi Pratama',
      authorRole: 'Koordinator Divisi Acara'
    },
    {
      id: 3,
      judul: 'Pembaruan Panduan Administrasi',
      isi: 'Panduan terbaru pengajuan proposal dan LPJ kini tersedia di Repository Vault.',
      is_important: false,
      category: 'Administrasi',
      time: '15 Nov 2024',
      is_read: true,
      tanggal: 'Mulai berlaku 15 Nov 2024',
      waktu: 'Fleksibel',
      lokasi: 'Online Repository',
      peserta: 'Seluruh Divisi',
      publisher: 'Sekretariat • 15 November 2024',
      authorName: 'Ardi Pratama',
      authorRole: 'Koordinator Divisi Acara'
    }
  ];

  const handlePublishAnnouncement = (data) => {
    console.log('Published announcement:', data);
  };

  return (
    <div>
      {/* Date & Welcome */}
      <div className="page-header-block">
        <div className="page-title-row" style={{ alignItems: 'flex-end' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5', display: 'block', marginBottom: '4px' }}>
              Senin, 18 November 2024
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

      {/* Main Two-Column Grid */}
      <div className="portal-dashboard-grid">
        {/* Left: Pengumuman */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h3 className="portal-card-title">Pengumuman Terbaru</h3>
              <p className="portal-card-subtitle">Informasi penting untuk anggota organisasi</p>
            </div>
            <button type="button" className="portal-link-btn" onClick={() => onSelectAnnouncement && onSelectAnnouncement(announcements[0])}>
              Lihat semua <ChevronRight size={14} />
            </button>
          </div>

          <div className="announcement-list">
            {announcements.map((item) => (
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
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
                <span key={d} className="mini-cal-head">{d}</span>
              ))}
              {[4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map((d) => (
                <span key={d} className={`mini-cal-cell ${d === 14 ? 'active-today' : ''} ${[19, 20, 22].includes(d) ? 'has-dot' : ''}`}>{d}</span>
              ))}
            </div>
          </div>

          <div className="upcoming-schedules-list">
            <div className="upcoming-schedule-item">
              <div className="schedule-date-badge blue">
                <span className="schedule-date-day">20</span>
                <span className="schedule-date-month">Nov</span>
              </div>
              <div className="schedule-details">
                <h5 className="schedule-title">Workshop Kepemimpinan</h5>
                <span className="schedule-meta"><Clock size={12} /> 09:00 • Aula Utama</span>
              </div>
            </div>
            <div className="upcoming-schedule-item">
              <div className="schedule-date-badge purple">
                <span className="schedule-date-day">22</span>
                <span className="schedule-date-month">Nov</span>
              </div>
              <div className="schedule-details">
                <h5 className="schedule-title">Rapat Koordinasi Divisi</h5>
                <span className="schedule-meta"><Clock size={12} /> 13:30 • Ruang Sekretariat</span>
              </div>
            </div>
            <div className="upcoming-schedule-item">
              <div className="schedule-date-badge green">
                <span className="schedule-date-day">25</span>
                <span className="schedule-date-month">Nov</span>
              </div>
              <div className="schedule-details">
                <h5 className="schedule-title">SIOMAS Fest 2024</h5>
                <span className="schedule-meta"><Clock size={12} /> 08:00 • Lapangan Kampus</span>
              </div>
            </div>
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
          showToast={() => {}}
        />
      )}
    </div>
  );
}
