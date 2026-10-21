import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Tag, Users, X } from 'lucide-react';

export default function AnggotaAgenda() {
  const [viewMode, setViewMode] = useState('Bulan');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const events = {
    7: {
      title: 'Rapat Divisi',
      category: 'Internal Divisi',
      chipClass: 'event-chip-blue',
      time: '14:00 - 16:00 WITA',
      location: 'Ruang Rapat 2',
      division: 'Divisi Humas & Publikasi',
      desc: 'Koordinasi mingguan progres publikasi media sosial dan evaluasi konten berkala.'
    },
    14: {
      title: 'Workshop',
      category: 'Pengembangan Skill',
      chipClass: 'event-chip-green',
      time: '09:00 - 12:30 WITA',
      location: 'Aula Gedung C',
      division: 'Divisi PSDM',
      desc: 'Pelatihan kepemimpinan dan manajemen organisasi bagi seluruh anggota baru.'
    },
    18: {
      title: 'SIOMAS Fest',
      category: 'Program Kerja Utama',
      chipClass: 'event-chip-yellow',
      time: '08:00 - 18:00 WITA',
      location: 'Lapangan Utama Kampus',
      division: 'Seluruh Divisi',
      desc: 'Festival tahunan organisasi mahasiswa yang menampilkan expo karya, seni, dan kolaborasi UKM.'
    },
    22: {
      title: 'Rapat Koordinasi Akhir',
      category: 'Manajemen',
      chipClass: 'event-chip-purple',
      time: '15:30 - 17:30 WITA',
      location: 'Aula Gedung C',
      division: 'Pengurus Harian & Anggota',
      desc: 'Evaluasi pencapaian target dan program kerja semester ganjil.'
    }
  };

  // 35 days in 5 weeks (Sen to Min)
  // Matching November 2024 calendar:
  // Nov 1 was Friday. Days before: 28, 29, 30, 31 (October)
  const calendarDays = [
    { day: 28, isCurrentMonth: false },
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    { day: 31, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true, event: events[7] },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true, event: events[14] },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true, event: events[18] },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true, event: events[22] },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 31, isCurrentMonth: true }
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header-block">
        <span className="page-category-tag">AGENDA ORGANISASI</span>
        <h1 className="page-title">Kalender Agenda</h1>
        <p className="page-subtitle">Kelola jadwal kegiatan, rapat, dan program kerja SIOMAS.</p>
      </div>

      {/* Top Controls */}
      <div className="calendar-top-controls">
        <div className="calendar-month-selector">
          <button type="button" className="icon-arrow-btn" title="Bulan Sebelumnya">
            <ChevronLeft size={16} />
          </button>
          <h3>November 2024</h3>
          <button type="button" className="icon-arrow-btn" title="Bulan Selanjutnya">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="calendar-view-toggles">
          <button 
            type="button" 
            className="portal-outline-btn" 
            style={{ width: 'auto', padding: '6px 14px', fontSize: '12.5px' }}
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
            {[0, 1, 2, 3, 4].map((weekIdx) => (
              <tr key={weekIdx}>
                {calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7).map((item, dIdx) => (
                  <td key={dIdx}>
                    <div className={`calendar-cell-date ${!item.isCurrentMonth ? 'dimmed' : ''}`}>
                      {item.day}
                    </div>

                    {item.event && (
                      <span 
                        className={`calendar-event-chip ${item.event.chipClass}`}
                        onClick={() => setSelectedEvent(item.event)}
                        title="Klik untuk detail"
                      >
                        {item.event.title}
                      </span>
                    )}
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
    </div>
  );
}
