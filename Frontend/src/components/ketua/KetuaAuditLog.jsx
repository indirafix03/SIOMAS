import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { apiFetch } from '../../services/api.js';

export default function KetuaAuditLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadAuditLogs = async () => {
      const res = await apiFetch('/notifications/audit-logs');
      if (res.ok && res.data?.data) {
        const mapped = res.data.data.map((item) => ({
          id: item.id,
          time: item.created_at ? item.created_at.split(' ')[1] || item.created_at : '-',
          fullDate: item.created_at || '-',
          event: item.aksi,
          modul: item.modul,
          userName: item.user_name || 'System',
          summary: item.detail || item.modul,
          beforeData: item.before_data || null,
          afterData: item.after_data || null,
          detail: `${item.user_name || 'System'} • ${item.detail || item.modul}`,
          code: '200 OK',
          codeType: 'green',
          dot: item.aksi.includes('LPJ') || item.aksi.includes('DOCUMENT') || item.aksi.includes('SIPAKAMASE') ? '#4F46E5' : '#10B981'
        }));
        setLogs(mapped);
      }
    };
    loadAuditLogs();
  }, []);

  const handleExportCsv = () => {
    const header = ['ID', 'Waktu', 'Aksi', 'Modul', 'Pengguna', 'Ringkasan', 'JSON_Before', 'JSON_After'];
    const rows = logs.map(l => [
      l.id,
      `"${l.fullDate}"`,
      `"${l.event}"`,
      `"${l.modul}"`,
      `"${l.userName}"`,
      `"${(l.summary || '').replace(/"/g, '""')}"`,
      `"${l.beforeData ? JSON.stringify(l.beforeData).replace(/"/g, '""') : ''}"`,
      `"${l.afterData ? JSON.stringify(l.afterData).replace(/"/g, '""') : ''}"`
    ]);
    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'System_Audit_Logs_SIOMAS.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const codeStyle = {
    green: { color: '#10B981', fontWeight: 700 },
    warning: { color: '#F59E0B', fontWeight: 700 },
    danger: { color: '#EF4444', fontWeight: 700 }
  };

  return (
    <div>
      {/* Header */}
      <div className="responsive-page-header">
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>SECURITY &amp; TRANSACTION • SYSTEM_AUDIT_LOGS</span>
          <h1 className="page-title">Audit Log Ormawa</h1>
          <p className="page-subtitle" style={{ lineHeight: 1.55, marginTop: '6px' }}>Jejak aktivitas kritis beserta payload JSON perubahan (Before &amp; After) tercatat real-time di database.</p>
        </div>
        <button
          type="button"
          style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          onClick={handleExportCsv}
        >
          <Download size={16} /> Ekspor Audit CSV
        </button>
      </div>

      {/* Log Table */}
      <div className="portal-card" style={{ padding: 0 }}>
        {logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '13.5px' }}>
            Belum ada aktivitas yang tercatat di Audit Log.
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={log.id}
              style={{
                display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', padding: '18px 22px',
                borderBottom: i < logs.length - 1 ? '1px solid #F1F5F9' : 'none'
              }}
            >
              <span style={{ fontSize: '13px', color: '#94A3B8', fontFamily: 'monospace', minWidth: '64px', marginTop: '2px' }}>{log.time}</span>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: log.dot, flexShrink: 0, marginTop: '6px' }} />
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', letterSpacing: '0.01em', lineHeight: 1.4, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                  <span>{log.event}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px' }}>{log.modul}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '5px', lineHeight: 1.5, wordBreak: 'break-word' }}>{log.detail}</div>
                {(log.beforeData || log.afterData) && (
                  <div style={{
                    marginTop: '10px',
                    display: 'grid',
                    gridTemplateColumns: log.beforeData && log.afterData ? '1fr 1fr' : '1fr',
                    gap: '8px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontFamily: 'monospace',
                    fontSize: '11.5px',
                    color: '#334155',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere'
                  }}>
                    {log.beforeData && (
                      <div style={{ lineHeight: 1.5 }}>
                        <span style={{ color: '#DC2626', fontWeight: 700 }}>BEFORE: </span>
                        {JSON.stringify(log.beforeData)}
                      </div>
                    )}
                    {log.afterData && (
                      <div style={{ lineHeight: 1.5 }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>AFTER: </span>
                        {JSON.stringify(log.afterData)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span style={codeStyle[log.codeType] || codeStyle.green}>{log.code}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
