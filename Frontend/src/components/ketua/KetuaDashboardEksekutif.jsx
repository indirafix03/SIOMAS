import React from 'react';
import { Users, Calendar, FileText, Link2, Shield } from 'lucide-react';

export default function KetuaDashboardEksekutif({ onNavigate }) {
  const stats = [
    { label: 'Anggota aktif', value: '113', sub: 'Periode berjalan', icon: Users, color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Program berjalan', value: '12', sub: 'Periode berjalan', icon: Calendar, color: '#10B981', bg: '#ECFDF5' },
    { label: 'LPJ approved', value: '94%', sub: 'Periode berjalan', icon: FileText, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Kolaborasi aktif', value: '6', sub: 'Periode berjalan', icon: Link2, color: '#4F46E5', bg: '#EEF2FF' }
  ];

  const barHeights = [55, 65, 72, 85, 78, 80, 90, 88, 88, 95, 92, 100];
  const barMonths = ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'];
  const health = [
    { label: 'Kelengkapan LPJ', pct: 94 },
    { label: 'Validitas akun', pct: 88 },
    { label: 'Kepatuhan jadwal', pct: 82 },
    { label: 'Respons notifikasi', pct: 73 }
  ];

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
        borderRadius: '16px',
        padding: '32px 36px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.3)', filter: 'blur(40px)'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            background: '#4F46E5', color: '#fff', fontSize: '11px', fontWeight: 700,
            padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.06em', textTransform: 'uppercase'
          }}>EXECUTIVE OVERVIEW</span>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginTop: '12px', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Kinerja organisasi dalam satu pandangan
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94A3B8', marginBottom: '20px' }}>
            Ringkasan operasional, kepatuhan administrasi, dan aktivitas organisasi periode November 2024.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('k-audit-log')}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Shield size={16} /> Akses Konsol Audit Log
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="portal-stats-grid" style={{ marginBottom: '24px' }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="portal-stat-card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                <Icon size={22} />
              </div>
              <div className="portal-stat-info">
                <span className="portal-stat-label">{s.label}</span>
                <span className="portal-stat-number">{s.value}</span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>{s.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Bar Chart */}
        <div className="portal-card">
          <div className="portal-card-header">
            <div>
              <h3 className="portal-card-title">Partisipasi anggota</h3>
              <p className="portal-card-subtitle">Tren enam bulan terakhir</p>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>+12.5%</span>
          </div>

          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', marginTop: '16px', paddingBottom: '24px', position: 'relative' }}>
            {barHeights.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{
                  width: '100%', height: `${h}%`,
                  background: i === barHeights.length - 1 ? '#4F46E5' : '#A5B4FC',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.3s'
                }} />
              </div>
            ))}
            {/* X-axis labels */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around' }}>
              {barMonths.map(m => (
                <span key={m} style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Health indicators */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h3 className="portal-card-title">Kesehatan administrasi</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {health.map((h, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>{h.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#4F46E5' }}>{h.pct}%</span>
                </div>
                <div style={{ height: '8px', background: '#EEF2FF', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${h.pct}%`, background: '#4F46E5', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
