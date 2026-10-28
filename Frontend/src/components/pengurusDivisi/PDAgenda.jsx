import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const EVENT_COLORS = {
  'Rapat': { bg: '#EEF2FF', color: '#6366F1', dot: '#6366F1' },
  'Workshop': { bg: '#DCFCE7', color: '#10B981', dot: '#10B981' },
  'Acara': { bg: '#FEF9C3', color: '#CA8A04', dot: '#CA8A04' },
  'Lainnya': { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' }
};

function ModalTambahAgenda({ onClose, onSave, showToast }) {
  const [form, setForm] = useState({
    judul: '',
    tanggal: '',
    waktuMulai: '',
    waktuSelesai: '',
    lokasi: '',
    tipe: 'Rapat',
    deskripsi: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.judul.trim() || !form.tanggal) {
      showToast('Harap isi Judul dan Tanggal Agenda.', 'warning');
      return;
    }
    onSave(form);
    showToast(`Agenda "${form.judul}" berhasil ditambahkan.`, 'success');
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
              <input className="portal-input" placeholder="Contoh: Ruang Sekretariat" value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} />
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
  const [showModal, setShowModal] = useState(false);

  const [events, setEvents] = useState([
    { id: 1, date: 7, judul: 'Rapat Divisi', tipe: 'Rapat' },
    { id: 2, date: 14, judul: 'Workshop', tipe: 'Workshop' },
    { id: 3, date: 18, judul: 'SIOMAS Fest', tipe: 'Acara' }
  ]);

  // Get days in month
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust to Monday start
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const getEventsForDay = (day) => events.filter((e) => e.date === day);

  const handleSaveAgenda = (data) => {
    const day = data.tanggal ? parseInt(data.tanggal.split('-')[2]) : 1;
    setEvents([...events, { id: events.length + 10, date: day, judul: data.judul, tipe: data.tipe }]);
  };

  // Build calendar grid
  const calendarCells = [];
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarCells.push({ day: prevMonthDays - i, current: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, current: true });
  }
  // Next month days
  const remaining = 42 - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    calendarCells.push({ day: d, current: false });
  }

  return (
    <div>
      {/* Header */}
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

      {/* Calendar Card */}
      <div className="portal-card" style={{ padding: '28px' }}>
        {/* Calendar Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button type="button" className="table-action-btn" onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <button type="button" className="table-action-btn" onClick={handleNextMonth}><ChevronRight size={18} /></button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="portal-outline-btn"
              style={{ width: 'auto', padding: '7px 14px', fontSize: '13px' }}
              onClick={() => { setCurrentMonth(10); setCurrentYear(2024); }}
            >
              Hari ini
            </button>
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
              {['Bulan', 'Minggu'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '6px 16px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    background: viewMode === mode ? '#fff' : 'transparent',
                    color: viewMode === mode ? '#0F172A' : '#64748B',
                    boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '4px' }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#94A3B8', padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#E2E8F0', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
          {calendarCells.map((cell, idx) => {
            const dayEvents = cell.current ? getEventsForDay(cell.day) : [];
            const isToday = cell.current && cell.day === 14 && currentMonth === 10;
            return (
              <div key={idx} style={{
                background: '#fff',
                minHeight: '110px',
                padding: '10px 12px',
                opacity: cell.current ? 1 : 0.35
              }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: isToday ? '#6366F1' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#fff' : '#475569',
                  marginBottom: '6px'
                }}>
                  {cell.day}
                </div>
                {dayEvents.map((evt) => {
                  const style = EVENT_COLORS[evt.tipe] || EVENT_COLORS['Lainnya'];
                  return (
                    <div key={evt.id} style={{
                      background: style.bg, color: style.color,
                      fontSize: '11px', fontWeight: 600, padding: '3px 8px',
                      borderRadius: '6px', marginBottom: '3px',
                      cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {evt.judul}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

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
