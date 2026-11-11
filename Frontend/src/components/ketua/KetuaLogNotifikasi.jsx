import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../../services/api.js';

export default function KetuaLogNotifikasi({ showToast }) {
  const [activeTab, setActiveTab] = useState('Semua');
  const [emailLogs, setEmailLogs] = useState([]);
  const [runningCron, setRunningCron] = useState(false);
  const [cronResult, setCronResult] = useState(null);

  const loadLogs = async () => {
    const res = await notificationsApi.getEmailLogs();
    if (res.ok && res.data?.data) {
      const mapped = res.data.data.map(l => {
        const attemptNum = l.attempt_number || l.retry_count || 1;
        const statusStr = l.status_pengiriman || l.status_kirim || 'Terkirim';
        const isFailed = statusStr === 'Gagal' || statusStr === 'Failed';
        return {
          id: l.id,
          subjek: l.announcement_title || l.subjek || 'Notifikasi SIOMAS',
          penerima: l.recipient_email || l.email_tujuan || '-',
          namaPenerima: l.recipient_name || '',
          status: isFailed ? 'Gagal' : 'Terkirim',
          statusColor: isFailed ? '#EF4444' : '#10B981',
          attemptNum,
          attempt: `Attempt-${attemptNum}`,
          attemptLabel:
            attemptNum === 1 ? 'Attempt-1 (Awal)' :
            attemptNum === 2 ? 'Attempt-2 (24 Jam)' :
            'Attempt-3 (48 Jam)',
          openRate: (l.sent_at || l.waktu_kirim)
            ? new Date(l.sent_at || l.waktu_kirim).toLocaleString('id-ID')
            : '—'
        };
      });
      setEmailLogs(mapped);
    } else {
      setEmailLogs([]);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRunScheduler = async () => {
    setRunningCron(true);
    const res = await notificationsApi.runScheduler(true);
    setRunningCron(false);
    if (res.ok) {
      const d = res.data?.data || {};
      setCronResult(d);
      showToast && showToast(res.data?.message || 'Scheduler pengingat email selesai dijalankan!', 'success');
      loadLogs();
    } else {
      showToast && showToast(res.data?.message || 'Gagal menjalankan scheduler pengingat.', 'error');
    }
  };

  const handleWebhookToggle = async (log) => {
    const nextStatus = log.status === 'Terkirim' ? 'Gagal' : 'Terkirim';
    const res = await notificationsApi.triggerWebhook(log.id, nextStatus);
    if (res.ok) {
      showToast && showToast(`Webhook: Status EmailLog #${log.id} diperbarui ke ${nextStatus}`, 'success');
      loadLogs();
    }
  };

  const sentCount = emailLogs.filter(l => l.status === 'Terkirim').length;
  const failedCount = emailLogs.filter(l => l.status === 'Gagal').length;
  const reminderCount = emailLogs.filter(l => l.attemptNum >= 2).length;

  const stats = [
    { label: 'Email Terkirim', value: String(sentCount), sub: 'Status Terkirim di DB' },
    { label: 'Total Log Pengiriman', value: String(emailLogs.length), sub: 'Semua tahap (1-3)' },
    { label: 'Pengingat 24j / 48j', value: String(reminderCount), sub: 'Attempt-2 & Attempt-3' },
    { label: 'Gagal', value: String(failedCount), sub: 'Perlu ditinjau / Retry' }
  ];

  const filtered = activeTab === 'Semua' ? emailLogs
    : emailLogs.filter(l => l.attempt === activeTab || l.status === activeTab);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>UC-12 • EMAIL_LOGS &amp; CRON SCHEDULER</span>
          <h1 className="page-title">Log Notifikasi &amp; Pengingat Terjadwal</h1>
          <p className="page-subtitle">Pantau pengiriman Attempt-1 (Awal), Attempt-2 (24 Jam), Attempt-3 (48 Jam), dan auto-stop saat pengumuman telah dibaca.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleRunScheduler}
            disabled={runningCron}
            style={{
              background: '#0F172A',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              cursor: runningCron ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontFamily: 'inherit',
              fontWeight: 600
            }}
          >
            {runningCron ? 'Memproses...' : '⚡ Jalankan Scheduler Pengingat (24j / 48j)'}
          </button>
          {['Semua', 'Attempt-1', 'Attempt-2', 'Attempt-3', 'Gagal'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? '#4F46E5' : '#fff',
              color: activeTab === tab ? '#fff' : '#64748B',
              border: activeTab === tab ? 'none' : '1.5px solid #E2E8F0',
              borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
              fontSize: '13px', fontFamily: 'inherit', fontWeight: 600
            }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {cronResult && (
        <div style={{
          background: '#EEF2FF',
          border: '1px solid #C7D2FE',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '18px',
          fontSize: '13px',
          color: '#312E81',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            <strong>Hasil Eksekusi Cron Pengingat ({cronResult.checked_at}):</strong>{' '}
            {cronResult.emails_triggered} email pengingat dikirim •{' '}
            {cronResult.skipped_already_read} dihentikan otomatis (sudah dibaca) •{' '}
            {cronResult.skipped_max_attempt_reached} mencapai batas maks (Attempt-3).
          </span>
          <button
            type="button"
            onClick={() => setCronResult(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Aktivitas Email Terjadwal (`email_logs`)</h3>
          <span style={{ fontSize: '13px', color: '#64748B' }}>Filter: {activeTab} ({filtered.length} baris)</span>
        </div>

        <div className="table-scroll-wrap">
        <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              {['SUBJEK PENGUMUMAN', 'PENERIMA', 'STATUS', 'TAHAP PENGINGAT', 'WAKTU KIRIM', 'WEBHOOK'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
                  Belum ada riwayat pengiriman email notifikasi untuk filter ini.
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                  <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{log.subjek}</td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748B' }}>
                    {log.namaPenerima ? `${log.namaPenerima} (${log.penerima})` : log.penerima}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ color: log.statusColor, fontWeight: 700, fontSize: '13px' }}>{log.status}</span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '12.5px' }}>
                    <span style={{
                      background: log.attemptNum === 1 ? '#EEF2FF' : log.attemptNum === 2 ? '#FEF3C7' : '#FEE2E2',
                      color: log.attemptNum === 1 ? '#4F46E5' : log.attemptNum === 2 ? '#D97706' : '#DC2626',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontWeight: 700
                    }}>
                      {log.attemptLabel}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748B' }}>{log.openRate}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      type="button"
                      onClick={() => handleWebhookToggle(log)}
                      title="Simulasi Webhook Callback SMTP Status"
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      Ubah Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
