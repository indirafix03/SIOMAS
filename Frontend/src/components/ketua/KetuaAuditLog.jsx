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
          event: item.aksi,
          detail: `${item.user_name || 'System'} • ${item.detail || item.modul}`,
          code: '200 OK',
          codeType: 'green',
          dot: item.aksi.includes('LPJ') || item.aksi.includes('DOCUMENT') ? '#4F46E5' : '#10B981'
        }));
        setLogs(mapped);
      }
    };
    loadAuditLogs();
  }, []);

  const codeStyle = {
    green: { color: '#10B981', fontWeight: 700 },
    warning: { color: '#F59E0B', fontWeight: 700 },
    danger: { color: '#EF4444', fontWeight: 700 }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>SECURITY &amp; TRANSACTION</span>
          <h1 className="page-title">Audit Log Ormawa</h1>
          <p className="page-subtitle">Jejak aktivitas kritis tidak dapat diubah dan tercatat real-time dari database PostgreSQL.</p>
        </div>
        <button style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => alert('Ekspor audit log sebagai CSV...')}>
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
                display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 28px',
                borderBottom: i < logs.length - 1 ? '1px solid #F1F5F9' : 'none'
              }}
            >
              <span style={{ fontSize: '13px', color: '#94A3B8', fontFamily: 'monospace', minWidth: '64px' }}>{log.time}</span>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: log.dot, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', letterSpacing: '0.01em' }}>{log.event}</div>
                <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>{log.detail}</div>
              </div>
              <span style={codeStyle[log.codeType] || codeStyle.green}>{log.code}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
