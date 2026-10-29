import React, { useState } from 'react';

const emailLogs = [
  { id: 1, subjek: 'Pengumuman: Rapat Koordinasi', penerima: '96 penerima', status: 'Delivered', statusColor: '#10B981', attempt: 'Attempt-1', openRate: '68%' },
  { id: 2, subjek: 'Reminder: SIOMAS Fest', penerima: '84 penerima', status: 'Opened', statusColor: '#4F46E5', attempt: 'Attempt-1', openRate: '81%' },
  { id: 3, subjek: 'Revisi LPJ Divisi Humas', penerima: '1 penerima', status: 'Failed', statusColor: '#EF4444', attempt: 'Attempt-2', openRate: '—' },
  { id: 4, subjek: 'Verifikasi Anggota Baru', penerima: '4 penerima', status: 'Queued', statusColor: '#F59E0B', attempt: 'Attempt-1', openRate: '—' }
];

export default function KetuaLogNotifikasi() {
  const [activeTab, setActiveTab] = useState('Semua');

  const stats = [
    { label: 'Email terkirim', value: '1,284', sub: '98.4% delivery' },
    { label: 'Open-rate', value: '72.8%', sub: '+4.2% bulan ini' },
    { label: 'Dalam antrean', value: '18', sub: 'Attempt-1' },
    { label: 'Gagal', value: '3', sub: 'Perlu ditinjau' }
  ];

  const filtered = activeTab === 'Semua' ? emailLogs
    : emailLogs.filter(l => l.attempt === activeTab || l.status === activeTab);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>EMAIL_LOGS</span>
          <h1 className="page-title">Log Notifikasi & Open-Rate</h1>
          <p className="page-subtitle">Pantau antrean SMTP, delivery status, dan engagement email.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['Semua', 'Attempt-1', 'Failed'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? '#4F46E5' : '#fff',
              color: activeTab === tab ? '#fff' : '#64748B',
              border: activeTab === tab ? 'none' : '1.5px solid #E2E8F0',
              borderRadius: '8px', padding: '8px 18px', cursor: 'pointer',
              fontSize: '13px', fontFamily: 'inherit', fontWeight: 600
            }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
        borderRadius: '14px', padding: '24px 28px', marginBottom: '20px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px'
      }}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="portal-card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Aktivitas Email Terjadwal</h3>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Filter: {activeTab}</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              {['SUBJEK', 'PENERIMA', 'STATUS', 'ATTEMPT', 'OPEN-RATE'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{log.subjek}</td>
                <td style={{ padding: '16px 20px', fontSize: '13.5px', color: '#64748B' }}>{log.penerima}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ color: log.statusColor, fontWeight: 700, fontSize: '13.5px' }}>{log.status}</span>
                </td>
                <td style={{ padding: '16px 20px', fontSize: '13.5px', color: '#64748B' }}>{log.attempt}</td>
                <td style={{ padding: '16px 20px', fontSize: '13.5px', color: '#64748B' }}>{log.openRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
