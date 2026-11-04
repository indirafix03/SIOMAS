import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, Users, X } from 'lucide-react';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INITIAL_EVENTS = [
  {
    id: 1,
    day: 7,
    month: 10, // November (0-indexed)
    year: 2024,
    title: 'Rapat Divisi',
    category: 'Internal Divisi',
    chipClass: 'event-chip-blue',
    time: '14:00 - 16:00 WITA',
    location: 'Ruang Rapat 2',
    division: 'Divisi Humas & Publikasi',
    desc: 'Koordinasi mingguan progres publikasi media sosial dan evaluasi konten berkala.'
  },
  {
    id: 2,
    day: 14,
    month: 10,
    year: 2024,
    title: 'Workshop',
    category: 'Pengembangan Skill',
    chipClass: 'event-chip-green',
    time: '09:00 - 12:30 WITA',
    location: 'Aula Gedung C',
    division: 'Divisi PSDM',
    desc: 'Pelatihan kepemimpinan dan manajemen organisasi bagi seluruh anggota baru.'
  },
  {
    id: 3,
    day: 18,
    month: 10,
    year: 2024,
    title: 'SIOMAS Fest',
    category: 'Program Kerja Utama',
    chipClass: 'event-chip-yellow',
    time: '08:00 - 18:00 WITA',
    location: 'Lapangan Utama Kampus',
    division: 'Seluruh Divisi',
    desc: 'Festival tahunan organisasi mahasiswa yang menampilkan expo karya, seni, dan kolaborasi UKM.'
  },
  {
    id: 4,
    day: 22,
    month: 10,
    year: 2024,
    title: 'Rapat Koordinasi Akhir',
    category: 'Manajemen',
    chipClass: 'event-chip-purple',
    time: '15:30 - 17:30 WITA',
    location: 'Aula Gedung C',
    division: 'Pengurus Harian & Anggota',
    desc: 'Evaluasi pencapaian target dan program kerja semester ganjil.'
  }
];

function ModalTambahAgenda({ onClose, onSave, showToast }) {
  const [form, setForm] = useState({
    judul: '',
    tanggal: '2024-11-20',
    waktuMulai: '14:00',
    waktuSelesai: '16:00',
    lokasi: '',
    tipe: 'Rapat',
    divisi: 'Divisi Pengurus',
    deskripsi: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.judul.trim() || !form.tanggal) {
      if (showToast) showToast('Harap isi Judul dan Tanggal Agenda.', 'warning');
      return;
    }

    const typeChipMap = {
      'Rapat': { chip: 'event-chip-blue', cat: 'Internal Divisi' },
      'Workshop': { chip: 'event-chip-green', cat: 'Pengembangan Skill' },
      'Acara': { chip: 'event-chip-yellow', cat: 'Program Kerja Utama' },
      'Lainnya': { chip: 'event-chip-purple', cat: 'Manajemen' }
    };

    const mapping = typeChipMap[form.tipe] || typeChipMap['Rapat'];
    const parts = form.tanggal.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const timeStr = form.waktuMulai && form.waktuSelesai 
      ? `${form.waktuMulai} - ${form.waktuSelesai} WITA`
      : 'WITA';

    const newEvt = {
      id: Date.now(),
      day,
      month,
      year,
      title: form.judul,
      category: mapping.cat,
      chipClass: mapping.chip,
      time: timeStr,
      location: form.lokasi || 'Ruang Rapat UKM',
      division: form.divisi || 'Pengurus Divisi',
      desc: form.deskripsi || 'Kegiatan agenda divisi.'
    };

    onSave(newEvt);
    if (showToast) showToast(`Agenda "${form.judul}" berhasil ditambahkan.`, 'success');
    onClose();
  };

  return (
    <div className="portal-modal-backdrop" onClick={onClose}>
      <div className="portal-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="portal-modal-header">
          <div>
            <h3 className="portal-modal-title">Tambah Agenda Baru</h3>
            <p className="portal-modal-subtitle">Kelola jadwal kegiatan dan rapat divisi.</p>
          </div>
          <button type="button" className="portal-modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="portal-modal-body">
            <div className="portal-form-group">
              <label className="portal-form-label">Judul Agenda</label>
              <input className="portal-input" placeholder="Contoh: Rapat Koordinasi Divisi" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} required />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Tipe Kegiatan</label>
              <select className="portal-select" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
                <option>Rapat</option>
                <option>Workshop</option>
                <option>Acara</option>
                <option>Lainnya</option>
              </select>
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Tanggal</label>
              <input type="date" className="portal-input" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Waktu Mulai</label>
                <input type="time" className="portal-input" value={form.waktuMulai} onChange={(e) => setForm({ ...form, waktuMulai: e.target.value })} />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Waktu Selesai</label>
                <input type="time" className="portal-input" value={form.waktuSelesai} onChange={(e) => setForm({ ...form, waktuSelesai: e.target.value })} />
              </div>
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Lokasi</label>
              <input className="portal-input" placeholder="Contoh: Ruang Rapat 2 / Aula" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Divisi Penanggung Jawab</label>
              <input className="portal-input" placeholder="Contoh: Divisi Acara" value={form.divisi} onChange={(e) => setForm({ ...form, divisi: e.target.value })} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Deskripsi (opsional)</label>
              <textarea className="portal-textarea" rows="2" placeholder="Catatan atau deskripsi singkat kegiatan..." value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
            </div>
          </div>
          <div className="portal-modal-footer">
            <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '9px 18px' }} onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary-glow" style={{ padding: '9px 22px' }}>Simpan Agenda</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PDAgenda({ showToast }) {
  const [currentMonth, setCurrentMonth] = useState(10); // November (0-indexed)
  const [currentYear, setCurrentYear] = useState(2024);
  const [viewMode, setViewMode] = useState('Bulan');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState(INITIAL_EVENTS);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 = Senin, 6 = Minggu
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSaveAgenda = (newEvent) => {
    setEvents(prev => [...prev, newEvent]);
  };

  // Build calendar days array
  const calendarDays = [];
  // Days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false, events: [] });
  }
  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEvents = events.filter(
      (e) => e.year === currentYear && e.month === currentMonth && e.day === d
    );
    calendarDays.push({ day: d, isCurrentMonth: true, events: dayEvents });
  }
  // Days from next month to fill weeks
  const totalSlots = Math.ceil(calendarDays.length / 7) * 7;
  const remaining = (totalSlots < 35 ? 35 : totalSlots) - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({ day: d, isCurrentMonth: false, events: [] });
  }

  const numWeeks = Math.ceil(calendarDays.length / 7);

  return (
    <div>
      {/* Header with Title and Tambah Agenda Button */}
      <div className="page-header-block">
        <div className="page-title-row" style={{ alignItems: 'flex-end' }}>
          <div>
            <span className="page-category-tag">AGENDA ORGANISASI</span>
            <h1 className="page-title">Kalender Agenda</h1>
            <p className="page-subtitle">Kelola jadwal kegiatan, rapat, dan program kerja SIOMAS.</p>
          </div>
          <button type="button" className="btn-primary-glow" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Tambah Agenda Baru
          </button>
        </div>
      </div>

      {/* Top Controls matching AnggotaAgenda */}
      <div className="calendar-top-controls">
        <div className="calendar-month-selector">
          <button type="button" className="icon-arrow-btn" title="Bulan Sebelumnya" onClick={handlePrevMonth}>
            <ChevronLeft size={16} />
          </button>
          <h3>{MONTHS[currentMonth]} {currentYear}</h3>
          <button type="button" className="icon-arrow-btn" title="Bulan Selanjutnya" onClick={handleNextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="calendar-view-toggles">
          <button 
            type="button" 
            className="portal-outline-btn" 
            style={{ width: 'auto', padding: '6px 14px', fontSize: '12.5px' }}
            onClick={() => { setCurrentMonth(10); setCurrentYear(2024); }}
          >
            Hari ini
          </button>

          <div className="segmented-toggle">
            <button
              type="button"
              className={`toggle-option ${viewMode === 'Bulan' ? 'active' : ''}`}
              onClick={() => setViewMode('Bulan')}
            >
              Bulan
            </button>
            <button
              type="button"
              className={`toggle-option ${viewMode === 'Minggu' ? 'active' : ''}`}
              onClick={() => setViewMode('Minggu')}
            >
              Minggu
            </button>
          </div>
        </div>
      </div>

      {/* Full Calendar Grid matching AnggotaAgenda */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', overflowX: 'auto' }}>
        <table className="calendar-grid-table">
          <thead>
            <tr>
              <th>Sen</th>
              <th>Sel</th>
              <th>Rab</th>
              <th>Kam</th>
              <th>Jum</th>
              <th>Sab</th>
              <th>Min</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: numWeeks }).map((_, weekIdx) => (
              <tr key={weekIdx}>
                {calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7).map((item, dIdx) => (
                  <td key={dIdx}>
                    <div className={`calendar-cell-date ${!item.isCurrentMonth ? 'dimmed' : ''}`}>
                      {item.day}
                    </div>

                    {item.events && item.events.map((evt, eIdx) => (
                      <span 
                        key={eIdx}
                        className={`calendar-event-chip ${evt.chipClass || 'event-chip-blue'}`}
                        onClick={() => setSelectedEvent(evt)}
                        title="Klik untuk detail"
                      >
                        {evt.title}
                      </span>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Event Detail Modal matching AnggotaAgenda */}
      {selectedEvent && (
        <div className="portal-modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="portal-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <div>
                <span className="tag-badge tag-purple" style={{ marginBottom: '8px', display: 'inline-block' }}>
                  {selectedEvent.category}
                </span>
                <h3 className="portal-modal-title">{selectedEvent.title}</h3>
              </div>
              <button 
                type="button" 
                className="portal-modal-close-btn"
                onClick={() => setSelectedEvent(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="portal-modal-body">
              <p style={{ color: '#475569', fontSize: '13.5px', lineHeight: '1.6', margin: 0 }}>
                {selectedEvent.desc}
              </p>

              <div className="meta-grid-tiles" style={{ margin: '8px 0 0' }}>
                <div className="meta-tile">
                  <Clock size={18} className="meta-tile-icon" />
                  <div>
                    <div className="meta-tile-label">Waktu</div>
                    <div className="meta-tile-value">{selectedEvent.time}</div>
                  </div>
                </div>

                <div className="meta-tile">
                  <MapPin size={18} className="meta-tile-icon" />
                  <div>
                    <div className="meta-tile-label">Lokasi</div>
                    <div className="meta-tile-value">{selectedEvent.location}</div>
                  </div>
                </div>

                <div className="meta-tile" style={{ gridColumn: 'span 2' }}>
                  <Users size={18} className="meta-tile-icon" />
                  <div>
                    <div className="meta-tile-label">Divisi Penanggung Jawab</div>
                    <div className="meta-tile-value">{selectedEvent.division}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="portal-modal-footer">
              <button 
                type="button" 
                className="btn-primary-glow"
                style={{ padding: '8px 20px', fontSize: '13px' }}
                onClick={() => setSelectedEvent(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Agenda */}
      {showModal && (
        <ModalTambahAgenda
          onClose={() => setShowModal(false)}
          onSave={handleSaveAgenda}
          showToast={showToast}
        />
      )}
    </div>
  );
}
