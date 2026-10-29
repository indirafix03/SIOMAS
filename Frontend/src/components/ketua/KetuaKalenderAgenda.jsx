import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, MapPin, Check } from 'lucide-react';

const events = {
  7: { title: 'Rapat Divisi', color: '#6366F1', bg: '#EEF2FF', time: '7 Nov • 09:00 WITA', lokasi: 'Zoom Meeting', type: 'RAPAT DIVISI', desc: 'Evaluasi kemajuan program kerja divisi bulan November.' },
  14: { title: 'Workshop', color: '#10B981', bg: '#ECFDF5', time: '14 Nov • 13:00 WITA', lokasi: 'Aula Utama', type: 'WORKSHOP', desc: 'Workshop kepemimpinan bagi seluruh koordinator divisi.' },
  18: { title: 'SIOMAS Fest', color: '#F59E0B', bg: '#FFFBEB', time: '18 Nov • 08:00 WITA', lokasi: 'Lapangan Kampus', type: 'FESTIVAL', desc: 'Pameran dan festival budaya mahasiswa SIOMAS 2024.' },
  22: { title: 'Rapat Koordinasi Divisi', color: '#6366F1', bg: '#EEF2FF', time: '22 Nov • 15:30 WITA', lokasi: 'Ruang Sekretariat', type: 'RAPAT DIVISI', desc: 'Finalisasi rundown dan pembagian PIC untuk pelaksanaan SIOMAS Fest 2024.' }
};

export default function KetuaKalenderAgenda() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('Bulan');

  const weeks = [
    [null, null, null, null, 1, 2, 3],
    [4, 5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16, 17],
    [18, 19, 20, 21, 22, 23, 24],
    [25, 26, 27, 28, 29, 30, 31]
  ];

  const dayHeaders = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  return (
    <div>
      {/* Detail Agenda Modal */}
      {selectedEvent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Detail Agenda</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Agenda organisasi • Waktu Indonesia Tengah</div>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                <Clock size={24} />
              </div>
              <span style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', width: 'fit-content', letterSpacing: '0.06em' }}>
                {selectedEvent.type}
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>{selectedEvent.title}</h2>
              <p style={{ fontSize: '13.5px', color: '#64748B' }}>{selectedEvent.desc}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={18} color="#4F46E5" />
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Waktu</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{selectedEvent.time}</div>
                  </div>
                </div>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin size={18} color="#4F46E5" />
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Lokasi</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{selectedEvent.lokasi}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748B', padding: '10px 16px', fontFamily: 'inherit', fontWeight: 600 }}>
                Tutup
              </button>
              <button className="btn-primary" style={{ width: 'auto', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => { alert('Kehadiran dikonfirmasi!'); setSelectedEvent(null); }}>
                <Check size={16} /> Konfirmasi Kehadiran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-block">
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>AGENDA ORGANISASI</span>
        <h1 className="page-title">Kalender Agenda</h1>
        <p className="page-subtitle">Kelola jadwal kegiatan, rapat, dan program kerja SIOMAS.</p>
      </div>

      {/* Calendar Card */}
      <div className="portal-card">
        {/* Calendar Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
              <ChevronLeft size={18} color="#64748B" />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>November 2024</h3>
            <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
              <ChevronRight size={18} color="#64748B" />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', color: '#64748B', fontFamily: 'inherit' }}>
              Hari ini
            </button>
            {['Bulan', 'Minggu'].map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                style={{
                  background: viewMode === v ? '#4F46E5' : 'none',
                  color: viewMode === v ? '#fff' : '#64748B',
                  border: viewMode === v ? 'none' : '1px solid #E2E8F0',
                  borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
                  fontSize: '13px', fontFamily: 'inherit', fontWeight: 600
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
          {dayHeaders.map(d => (
            <div key={d} style={{ background: '#F8FAFC', padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
              {d}
            </div>
          ))}
          {weeks.flat().map((day, i) => {
            const ev = day && events[day];
            return (
              <div
                key={i}
                style={{
                  background: '#fff', minHeight: '90px', padding: '8px',
                  cursor: day && ev ? 'pointer' : 'default',
                  borderTop: '1px solid #F1F5F9'
                }}
                onClick={() => day && ev && setSelectedEvent(ev)}
              >
                {day && (
                  <>
                    <span style={{
                      display: 'inline-block', width: '26px', height: '26px',
                      lineHeight: '26px', textAlign: 'center', borderRadius: '50%',
                      fontSize: '13px', fontWeight: 500,
                      background: day === 14 ? '#4F46E5' : 'transparent',
                      color: day === 14 ? '#fff' : '#0F172A'
                    }}>{day}</span>
                    {ev && (
                      <div style={{
                        marginTop: '4px', background: ev.bg, color: ev.color,
                        fontSize: '11px', fontWeight: 600, padding: '3px 7px',
                        borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {ev.title}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
