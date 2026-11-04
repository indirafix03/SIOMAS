import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, Users, X } from 'lucide-react';
import { schedulesApi } from '../../services/api.js';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function mapScheduleToEvent(item) {
  const d = new Date(item.waktu);
  const valid = !isNaN(d.getTime());
  const chipMap = {
    'Internal': 'event-chip-blue',
    'Divisi': 'event-chip-green',
    'Umum': 'event-chip-yellow'
  };
  return {
    id: item.id,
    day: valid ? d.getDate() : 1,
    month: valid ? d.getMonth() : 0,
    year: valid ? d.getFullYear() : new Date().getFullYear(),
    title: item.judul_kegiatan,
    category: item.kategori || 'Umum',
    chipClass: chipMap[item.kategori] || 'event-chip-blue',
    time: valid ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WITA` : '-',
    location: item.lokasi || 'Kampus SIOMAS',
    division: item.pic_name || 'Pengurus Divisi',
    desc: item.keterangan || 'Jadwal kegiatan organisasi.'
  };
}

function ModalTambahAgenda({ onClose, onSave, submitting }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    judul: '',
    tanggal: todayStr,
    waktuMulai: '14:00',
    lokasi: '',
    kategori: 'Divisi',
    deskripsi: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
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
              <label className="portal-form-label">Kategori Kegiatan</label>
              <select className="portal-select" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
                <option value="Divisi">Divisi</option>
                <option value="Internal">Internal</option>
                <option value="Umum">Umum</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="portal-form-group">
                <label className="portal-form-label">Tanggal</label>
                <input type="date" className="portal-input" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required />
              </div>
              <div className="portal-form-group">
                <label className="portal-form-label">Waktu Mulai (WITA)</label>
                <input type="time" className="portal-input" value={form.waktuMulai} onChange={(e) => setForm({ ...form, waktuMulai: e.target.value })} required />
              </div>
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Lokasi</label>
              <input className="portal-input" placeholder="Contoh: Ruang Rapat 2 / Aula" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
            </div>
            <div className="portal-form-group">
              <label className="portal-form-label">Deskripsi (opsional)</label>
              <textarea className="portal-textarea" rows="2" placeholder="Catatan atau deskripsi singkat kegiatan..." value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
            </div>
          </div>
          <div className="portal-modal-footer">
            <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '9px 18px' }} onClick={onClose}>Batal</button>
            <button type="submit" disabled={submitting} className="btn-primary-glow" style={{ padding: '9px 22px' }}>
              {submitting ? 'Menyimpan...' : 'Simpan Agenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PDAgenda({ showToast }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState('Bulan');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState([]);

  const loadSchedules = useCallback(async () => {
    const res = await schedulesApi.getAll();
    if (res.ok && res.data?.data) {
      setEvents(res.data.data.map(mapScheduleToEvent));
    } else {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleSaveAgenda = async (form) => {
    if (!form.judul.trim() || !form.tanggal) {
      if (showToast) showToast('Harap isi Judul dan Tanggal Agenda.', 'warning');
      return;
    }
    setSubmitting(true);
    const waktuStr = `${form.tanggal} ${form.waktuMulai || '14:00'}:00`;
    const res = await schedulesApi.create({
      judul_kegiatan: form.judul.trim(),
      kategori: form.kategori || 'Divisi',
      waktu: waktuStr,
      lokasi: form.lokasi.trim() || 'Ruang Rapat UKM',
      keterangan: form.deskripsi.trim()
    });
    setSubmitting(false);

    if (res.ok) {
      setShowModal(false);
      if (showToast) showToast(`Agenda "${form.judul}" berhasil ditambahkan.`, 'success');
      const parts = form.tanggal.split('-');
      if (parts.length === 3) {
        setCurrentYear(parseInt(parts[0], 10));
        setCurrentMonth(parseInt(parts[1], 10) - 1);
      }
      loadSchedules();
    } else {
      if (showToast) showToast(res.data?.message || 'Gagal menyimpan agenda.', 'error');
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
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

  const calendarDays = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false, events: [] });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEvents = events.filter(
      (e) => e.year === currentYear && e.month === currentMonth && e.day === d
    );
    calendarDays.push({ day: d, isCurrentMonth: true, events: dayEvents });
  }
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

      {/* Top Controls */}
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
            onClick={() => { setCurrentMonth(now.getMonth()); setCurrentYear(now.getFullYear()); }}
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

      {/* Full Calendar Grid */}
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

      {/* Event Detail Modal */}
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
                    <div className="meta-tile-label">Penanggung Jawab</div>
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
          submitting={submitting}
        />
      )}
    </div>
  );
}
