import React, { useState } from 'react';
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

// Modal: Buat Pengumuman Baru
function ModalBuatPengumuman({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    judul: '',
    kategori: '',
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
              <option value="">Pilih kategori</option>
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
            <button type="button" className="btn-primary" style={{ width: 'auto', margin: 0 }} onClick={() => { onSubmit(form); onClose(); }}>
              Publikasikan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KetuaBeranda({ currentUser, onNavigate, onSelectAnnouncement }) {
  const [showModalPengumuman, setShowModalPengumuman] = useState(false);

  const firstName = currentUser?.nama ? currentUser.nama.split(' ')[0] : 'Ardi';

  const announcements = [
    {
      id: 1, judul: 'Rapat Koordinasi Akhir Semester', isi: 'Rapat evaluasi program kerja akan dilaksanakan Jumat mendatang di Aula Gedung C.', is_important: true, category: 'Manajemen', time: 'Hari ini, 09:24', is_read: false,
      tanggal: 'Jumat, 22 November 2024', waktu: '15:30–17:30 WITA', lokasi: 'Aula Gedung C', peserta: 'Seluruh anggota aktif', publisher: 'Divisi Manajemen • 18 November 2024, 09:24 WITA',
      authorName: 'Nabila Putri', authorRole: 'Ketua UKM SIOMAS'
    },
    {
      id: 2, judul: 'Pendaftaran Volunteer SIOMAS Fest 2024', isi: 'Kami membuka kesempatan bagi anggota untuk menjadi bagian dari acara terbesar tahun ini.', is_important: false, category: 'Acara', time: 'Kemarin, 15:40', is_read: true,
      tanggal: '25–27 November 2024', waktu: '08:00–18:00 WITA', lokasi: 'Lapangan Utama Kampus', peserta: 'Anggota terdaftar', publisher: 'Divisi Acara • 17 November 2024, 15:40 WITA',
      authorName: 'Rian Maulana', authorRole: 'Koordinator Acara'
    },
    {
      id: 3, judul: 'Pembaruan Panduan Administrasi & LPJ', isi: 'Panduan terbaru mengenai pengajuan proposal kegiatan dan pelaporan LPJ periode akhir kini tersedia.', is_important: false, category: 'Administrasi', time: '15 Nov 2024', is_read: true,
      tanggal: 'Mulai berlaku 15 Nov 2024', waktu: 'Fleksibel', lokasi: 'Online Repository', peserta: 'Seluruh Divisi', publisher: 'Sekretariat • 15 November 2024',
      authorName: 'Sarah Amalia', authorRole: 'Sekretaris Jenderal'
    }
  ];

  return (
    <div>
      {showModalPengumuman && (
        <ModalBuatPengumuman
          onClose={() => setShowModalPengumuman(false)}
          onSubmit={() => alert('Pengumuman berhasil dipublikasikan!')}
        />
      )}

      {/* Header */}
      <div className="page-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5', display: 'block', marginBottom: '4px' }}>
            Senin, 18 November 2024
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
            <span className="portal-stat-number">8</span>
            <span className="portal-stat-subtext purple">+2 minggu ini</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-green"><FileText size={22} /></div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Dokumen aktif</span>
            <span className="portal-stat-number">24</span>
            <span className="portal-stat-subtext green">3 menunggu validasi</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-yellow"><Users size={22} /></div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Kolaborasi UKM</span>
            <span className="portal-stat-number">6</span>
            <span className="portal-stat-subtext yellow">2 permintaan baru</span>
          </div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon-wrap portal-stat-icon-teal"><Eye size={22} /></div>
          <div className="portal-stat-info">
            <span className="portal-stat-label">Tingkat partisipasi</span>
            <span className="portal-stat-number">87%</span>
            <span className="portal-stat-subtext teal">+5% dari bulan lalu</span>
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
            <button type="button" className="portal-link-btn" onClick={() => onSelectAnnouncement && onSelectAnnouncement(announcements[0])}>
              Lihat semua <ChevronRight size={14} />
            </button>
          </div>

          <div className="announcement-list">
            {announcements.map(item => (
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
            ))}
          </div>
        </div>

        {/* Agenda */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h3 className="portal-card-title">Agenda Terdekat</h3>
              <p className="portal-card-subtitle">November 2024</p>
            </div>
          </div>

          <div className="mini-calendar-wrapper">
            <div className="mini-cal-grid">
              {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => (
                <span key={d} className="mini-cal-head">{d}</span>
              ))}
              {[4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map(d => (
                <span key={d} className={`mini-cal-cell${d===14?' active-today':''}${[19,20,22].includes(d)?' has-dot':''}`}>{d}</span>
              ))}
            </div>
          </div>

          <div className="upcoming-schedules-list">
            {[
              { day: 20, month: 'Nov', title: 'Workshop Kepemimpinan', time: '09:00', place: 'Aula Utama', color: 'blue' },
              { day: 22, month: 'Nov', title: 'Rapat Koordinasi Divisi', time: '13:30', place: 'Ruang Sekretariat', color: 'purple' },
              { day: 25, month: 'Nov', title: 'SIOMAS Fest 2024', time: '08:00', place: 'Lapangan Kampus', color: 'green' }
            ].map((ev, i) => (
              <div key={i} className="upcoming-schedule-item">
                <div className={`schedule-date-badge ${ev.color}`}>
                  <span className="schedule-date-day">{ev.day}</span>
                  <span className="schedule-date-month">{ev.month}</span>
                </div>
                <div className="schedule-details">
                  <h5 className="schedule-title">{ev.title}</h5>
                  <span className="schedule-meta"><Clock size={12} /> {ev.time} • {ev.place}</span>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="portal-outline-btn" onClick={() => onNavigate('k-kalender-agenda')}>
            Buka Kalender Agenda
          </button>
        </div>
      </div>
    </div>
  );
}
